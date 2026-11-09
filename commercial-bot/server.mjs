/**
 * CicloBem — receptor de WhatsApp Cloud API e qualificação comercial (Node 20).
 * Não se conecta ao banco/ledger financeiro.
 * Credenciais somente via environment. Público: webhook. Administração: localhost.
 */
import http from "node:http";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import pg from "pg";
import { processLead } from "./flow.mjs";

const required = [
  "DATABASE_URL", "META_APP_SECRET", "META_VERIFY_TOKEN",
  "META_ACCESS_TOKEN", "META_PHONE_NUMBER_ID", "META_GRAPH_VERSION",
  "COMMERCIAL_ADMIN_TOKEN"
];
for (const key of required) {
  if (!process.env[key]) throw new Error("Missing required environment variable: " + key);
}
const env = process.env;
if (!/^v\d+\.\d+$/.test(env.META_GRAPH_VERSION)) throw new Error("Invalid META_GRAPH_VERSION");
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });
const webhookPort = Number(env.WEBHOOK_PORT || 3017);
const adminPort = Number(env.ADMIN_PORT || 3018);

function respond(res, status, body, contentType = "application/json") {
  res.writeHead(status, { "Content-Type": contentType, "Cache-Control": "no-store" });
  res.end(contentType === "application/json" ? JSON.stringify(body) : String(body));
}
async function readBody(req, maxBytes = 256 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error("Payload too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function matchesSecret(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && timingSafeEqual(x, y);
}
function validSignature(body, signature) {
  const calculated = "sha256=" +
    createHmac("sha256", env.META_APP_SECRET).update(body).digest("hex");
  return matchesSecret(signature, calculated);
}
function sourceFromText(rawText) {
  const match = String(rawText || "").match(/^\[CICLOBEM_SITE:([a-z0-9-]+)\]/i);
  if (match) return match[1].toLowerCase();
  if (String(rawText || "").includes("[Contato Site CicloBem]")) return "formulario-site";
  return "whatsapp-organico";
}
function extractText(msg) {
  if (msg.type === "text") return String(msg.text?.body || "");
  if (msg.type === "interactive") {
    return String(msg.interactive?.button_reply?.id || msg.interactive?.list_reply?.id ||
      msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "");
  }
  if (msg.type === "button") return String(msg.button?.text || "");
  return "";
}

async function persistInbound(msg) {
  const id = String(msg.id || "");
  const wa = String(msg.from || "");
  if (!id.startsWith("wamid.") || !/^\d{10,16}$/.test(wa)) return;
  const text = extractText(msg);
  const origin = sourceFromText(text);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const unique = await client.query(
      "INSERT INTO commercial_inbound (message_id, wa_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING message_id",
      [id, wa]
    );
    if (!unique.rowCount) {
      await client.query("COMMIT");
      return; // reentrega de webhook: sem duplicar resposta
    }
    await client.query("INSERT INTO commercial_leads (wa_id, source) VALUES ($1,$2) ON CONFLICT (wa_id) DO NOTHING", [wa, origin]);
    const found = await client.query("SELECT * FROM commercial_leads WHERE wa_id=$1 FOR UPDATE", [wa]);
    if (!found.rowCount) throw new Error("Lead missing after insertion");
    const current = found.rows[0];
    const next = processLead(current, text);
    const l = next.lead;
    await client.query(
      "UPDATE commercial_leads SET source=CASE WHEN source='whatsapp-organico' THEN $2 ELSE source END, " +
      "stage=$3,status=$4,profile=$5,contact_name=$6,organization=$7,email=$8,city_state=$9," +
      "installation=$10,daily_flow=$11,commercial_model=$12,last_inbound_at=NOW(),updated_at=NOW() " +
      "WHERE wa_id=$1",
      [wa, origin, l.stage, l.status, l.profile || null, l.contact_name || null,
        l.organization || null, l.email || null, l.city_state || null,
        l.installation || null, l.daily_flow || null, l.commercial_model || null]
    );
    await client.query(
      "INSERT INTO commercial_outbox (message_id,wa_id,text_body,origin) VALUES ($1,$2,$3,'bot')",
      [id, wa, next.reply]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

let workerBusy = false;
async function processOutbox() {
  if (workerBusy) return;
  workerBusy = true;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT id,wa_id,text_body,attempts FROM commercial_outbox " +
      "WHERE delivered_to_api_at IS NULL AND attempts < 6 AND next_attempt_at <= NOW() " +
      "ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED"
    );
    if (!rows.length) {
      await client.query("COMMIT");
      return;
    }
    const item = rows[0];
    let errorText = null;
    try {
      const url = "https://graph.facebook.com/" +
        env.META_GRAPH_VERSION + "/" + env.META_PHONE_NUMBER_ID + "/messages";
      const result = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + env.META_ACCESS_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp", to: item.wa_id, type: "text",
          text: { preview_url: false, body: item.text_body }
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (!result.ok) throw new Error("Graph API HTTP " + result.status);
      await client.query(
        "UPDATE commercial_outbox SET delivered_to_api_at=NOW(),attempts=attempts+1,last_error=NULL WHERE id=$1",
        [item.id]
      );
    } catch (error) {
      errorText = String(error.message || "delivery failed").slice(0, 120);
      await client.query(
        "UPDATE commercial_outbox SET attempts=attempts+1,last_error=$2," +
        "next_attempt_at=NOW()+($3::integer*INTERVAL '1 minute') WHERE id=$1",
        [item.id, errorText, Math.min(60, 2 ** Number(item.attempts))]
      );
    }
    await client.query("COMMIT");
    if (errorText) console.error("Commercial outbound delivery failure (no PII):", errorText);
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Commercial outbox worker error:", error.message);
  } finally {
    client.release();
    workerBusy = false;
  }
}

const publicServer = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, "http://localhost");
    if (req.method === "GET" && path.pathname === "/healthz") {
      await pool.query("SELECT 1");
      return respond(res, 200, { ok: true, service: "ciclobem-commercial-wa" });
    }
    if (path.pathname !== "/webhook") return respond(res, 404, { error: "NOT_FOUND" });
    if (req.method === "GET") {
      const mode = path.searchParams.get("hub.mode");
      const token = path.searchParams.get("hub.verify_token");
      const challenge = path.searchParams.get("hub.challenge");
      if (mode === "subscribe" && matchesSecret(token, env.META_VERIFY_TOKEN) &&
          /^\d+$/.test(challenge || "")) {
        return respond(res, 200, challenge, "text/plain");
      }
      return respond(res, 403, { error: "INVALID_VERIFY_TOKEN" });
    }
    if (req.method !== "POST") return respond(res, 405, { error: "METHOD_NOT_ALLOWED" });
    const raw = await readBody(req);
    if (!validSignature(raw, req.headers["x-hub-signature-256"])) {
      return respond(res, 403, { error: "BAD_SIGNATURE" });
    }
    let data;
    try { data = JSON.parse(raw.toString("utf8")); }
    catch { return respond(res, 400, { error: "INVALID_JSON" }); }
    if (data?.object !== "whatsapp_business_account") return respond(res, 200, { ok: true });
    for (const entry of data.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const val = change.value;
        if (String(val?.metadata?.phone_number_id) !== env.META_PHONE_NUMBER_ID) continue;
        for (const msg of val.messages || []) await persistInbound(msg);
      }
    }
    respond(res, 200, { ok: true });
    void processOutbox();
  } catch (error) {
    // Meta pode repetir o webhook se o banco estiver indisponível.
    console.error("Commercial webhook failure:", error.message);
    respond(res, error.status || 503, { error: "WEBHOOK_UNAVAILABLE" });
  }
});

// Porta administrativa restrita a localhost. Expor somente por Tailscale + controle adicional.
const adminServer = http.createServer(async (req, res) => {
  try {
    if (!matchesSecret(req.headers.authorization, "Bearer " + env.COMMERCIAL_ADMIN_TOKEN)) {
      return respond(res, 401, { error: "UNAUTHORIZED" });
    }
    const path = new URL(req.url, "http://localhost");
    if (req.method === "GET" && path.pathname === "/leads") {
      const { rows } = await pool.query(
        "SELECT id,wa_id,source,status,stage,profile,contact_name,organization,email," +
        "city_state,installation,daily_flow,commercial_model,last_inbound_at,updated_at " +
        "FROM commercial_leads ORDER BY updated_at DESC LIMIT 100"
      );
      return respond(res, 200, { leads: rows });
    }
    const match = path.pathname.match(/^\/leads\/(\d+)\/reply$/);
    if (req.method === "POST" && match) {
      const body = JSON.parse((await readBody(req, 8192)).toString("utf8"));
      const reply = String(body.text || "").trim();
      if (!reply || reply.length > 3000) return respond(res, 400, { error: "INVALID_TEXT" });
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const q = await client.query(
          "SELECT * FROM commercial_leads WHERE id=$1 FOR UPDATE", [match[1]]
        );
        if (!q.rowCount) { await client.query("ROLLBACK"); return respond(res, 404, { error: "NOT_FOUND" }); }
        const lead = q.rows[0];
        if (!lead.last_inbound_at || Date.now() - new Date(lead.last_inbound_at).getTime() >= 24 * 3600 * 1000) {
          await client.query("ROLLBACK");
          return respond(res, 409, { error: "WINDOW_CLOSED_REQUIRES_APPROVED_TEMPLATE" });
        }
        await client.query(
          "INSERT INTO commercial_outbox (message_id,wa_id,text_body,origin) VALUES ($1,$2,$3,'human')",
          ["admin-" + randomUUID(), lead.wa_id, reply]
        );
        await client.query(
          "UPDATE commercial_leads SET stage='human',status='EM_ATENDIMENTO',updated_at=NOW() WHERE id=$1",
          [lead.id]
        );
        await client.query("COMMIT");
        void processOutbox();
        return respond(res, 202, { queued: true });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally { client.release(); }
    }
    return respond(res, 404, { error: "NOT_FOUND" });
  } catch (error) {
    console.error("Commercial admin API error:", error.message);
    return respond(res, 500, { error: "INTERNAL" });
  }
});

await pool.query("SELECT 1");
publicServer.listen(webhookPort, "127.0.0.1", () => console.log("WhatsApp webhook bound on localhost:" + webhookPort));
adminServer.listen(adminPort, "127.0.0.1", () => console.log("Commercial admin API bound on localhost:" + adminPort));
const timer = setInterval(() => void processOutbox(), 3000);
timer.unref();
void processOutbox();
