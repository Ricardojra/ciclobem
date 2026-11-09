-- Banco comercial isolado: não reutilizar schemas/tabelas Pix ou Conta Digital.
BEGIN;
CREATE TABLE IF NOT EXISTS commercial_leads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wa_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'whatsapp-organico',
  stage TEXT NOT NULL DEFAULT 'profile',
  status TEXT NOT NULL DEFAULT 'NOVO',
  profile TEXT,
  contact_name TEXT,
  organization TEXT,
  email TEXT,
  city_state TEXT,
  installation TEXT,
  daily_flow TEXT,
  commercial_model TEXT,
  last_inbound_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_status ON commercial_leads(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS commercial_inbound (
  message_id TEXT PRIMARY KEY,
  wa_id TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_commercial_inbound_received ON commercial_inbound(received_at);

CREATE TABLE IF NOT EXISTS commercial_outbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id TEXT NOT NULL UNIQUE REFERENCES commercial_inbound(message_id),
  wa_id TEXT NOT NULL,
  text_body TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_to_api_at TIMESTAMPTZ,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_commercial_outbox_due
  ON commercial_outbox(next_attempt_at)
  WHERE delivered_to_api_at IS NULL;
COMMIT;
