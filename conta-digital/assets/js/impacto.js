(function () {
  'use strict';

  window.CicloBem = window.CicloBem || {};
  window.CicloBem.contaDigital = window.CicloBem.contaDigital || {};
  const CicloBem = window.CicloBem;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const ICON_LEAF = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>';

  function fmtKg(kg) {
    const n = Number(kg);
    if (!Number.isFinite(n)) return 'Indisponível';
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  }

  // UNKNOWN !== ZERO: derive truthful weight state from the new contract
  // (peso_status) or infer it from the legacy shape (0 kg + coletas > 0 = unknown).
  function deriveImpacto(impacto) {
    const kg = Number(impacto.kg_reciclados);
    const totalColetas = Number(impacto.total_coletas);
    const embalagens = Number(impacto.embalagens_recuperadas);
    const semPeso = Number(impacto.itens_sem_peso);
    const pesoStatus = impacto.peso_status
      || (Number.isFinite(kg) && kg > 0 ? 'measured' : 'unknown');
    const co2Status = impacto.co2_status
      || (Number(impacto.co2_estimado_kg) > 0 ? 'estimated' : 'not_estimated');
    return {
      pesoStatus,
      co2Status,
      kg: Number.isFinite(kg) ? kg : 0,
      embalagens: Number.isFinite(embalagens) && embalagens > 0 ? embalagens : (Number.isFinite(totalColetas) ? totalColetas : null),
      totalColetas: Number.isFinite(totalColetas) ? totalColetas : null,
      semPeso: Number.isFinite(semPeso) ? semPeso : 0
    };
  }

  function pesoLabel(d) {
    if (d.pesoStatus === 'measured') return `${escapeHtml(fmtKg(d.kg))} kg`;
    if (d.pesoStatus === 'partial') return `${escapeHtml(fmtKg(d.kg))} kg`;
    return 'Ainda não estimado';
  }

  function pesoHint(d) {
    if (d.pesoStatus === 'partial') return `medidos · ${d.semPeso} embalagens ainda não estimadas`;
    return '';
  }

  function materialPesoLabel(m) {
    if (m.peso_status === 'measured' || (m.peso_status == null && Number(m.peso_kg) > 0)) {
      return `${escapeHtml(fmtKg(m.peso_kg))} kg`;
    }
    if (m.peso_status === 'partial' && Number(m.peso_kg) > 0) {
      return `${escapeHtml(fmtKg(m.peso_kg))} kg medidos`;
    }
    return 'peso ainda não estimado';
  }

  const ContaDigitalImpacto = {
    init() {
      this.render();
      this.load();
      if (window.CicloBem.menu) window.CicloBem.menu.render('impacto');
    },

    render() {
      const root = document.getElementById('conta-digital-root');
      if (!root) return;

      root.innerHTML = `
        <div class="cb-page">
          <header class="cb-header">
            <div>
              <h1 class="cb-header__title">Seu impacto</h1>
              <p class="cb-header__sub">O que sua reciclagem já gerou de resultado.</p>
            </div>
          </header>
          <div id="impacto-content" aria-live="polite">
            <div class="cb-card"><div class="cb-skeleton cb-skeleton--row"></div><div class="cb-skeleton cb-skeleton--row"></div></div>
          </div>
        </div>
      `;
    },

    renderData(impacto) {
      const el = document.getElementById('impacto-content');
      if (!el) return;

      const d = deriveImpacto(impacto);
      const materiais = Array.isArray(impacto.materiais) ? impacto.materiais : [];
      const materiaisHtml = materiais.length
        ? materiais.map((m) => `
            <div class="cb-list-row">
              <span class="cb-list-row__label">${escapeHtml(m.material || 'Material')}${m.quantidade ? ` · ${m.quantidade} embalagens` : ''}</span>
              <span class="cb-list-row__value">${materialPesoLabel(m)}</span>
            </div>`).join('')
        : '<div class="cb-list-row"><span class="cb-list-row__label">Detalhamento ainda não disponível</span></div>';

      const co2Label = d.co2Status === 'estimated'
        ? `${escapeHtml(fmtKg(impacto.co2_estimado_kg))} kg`
        : 'Ainda não estimado';
      const pesoHintText = pesoHint(d);

      el.innerHTML = `
        <div class="cb-card cb-card--impact">
          <div class="cb-stats" style="display:flex;gap:var(--space-6);flex-wrap:wrap;">
            <div class="cb-stat">
              <p class="cb-stat__label">Embalagens recuperadas</p>
              <p class="cb-stat__value cb-stat__value--credit">${d.embalagens ?? 'Indisponível'}</p>
            </div>
            <div class="cb-stat">
              <p class="cb-stat__label">Material reciclado</p>
              <p class="cb-stat__value">${pesoLabel(d)}</p>
              ${pesoHintText ? `<p class="cb-hint" style="margin:0;">${pesoHintText}</p>` : ''}
            </div>
            <div class="cb-stat">
              <p class="cb-stat__label">CO₂ evitado</p>
              <p class="cb-stat__value">${co2Label}</p>
            </div>
          </div>
        </div>

        <div class="cb-card">
          <h2 class="cb-card__title">Por material</h2>
          <div class="cb-list">${materiaisHtml}</div>
        </div>

        <p class="cb-hint" style="text-align:center;">O peso só é contabilizado quando a embalagem tem peso registrado no catálogo. Quando a informação não existe, mostramos como ainda não estimado — nunca como zero.</p>
      `;
    },

    renderEmpty() {
      const el = document.getElementById('impacto-content');
      if (!el) return;
      el.innerHTML = `
        <div class="cb-card">
          <div class="cb-state">
            <div class="cb-state__icon">${ICON_LEAF}</div>
            <p class="cb-state__title">Seu impacto começa na primeira reciclagem</p>
            <p class="cb-state__text">Recicle em uma CicloMachine ou CicloPonto e acompanhe aqui o quanto você já recuperou de material.</p>
          </div>
        </div>`;
    },

    renderUnavailable() {
      const el = document.getElementById('impacto-content');
      if (!el) return;
      el.innerHTML = `
        <div class="cb-card">
          <div class="cb-state">
            <div class="cb-state__icon">${ICON_LEAF}</div>
            <p class="cb-state__title">Em breve</p>
            <p class="cb-state__text">Estamos preparando o cálculo do seu impacto. Ele aparece aqui assim que estiver disponível.</p>
          </div>
        </div>`;
    },

    async load() {
      if (!CicloBem.env.FEATURES || !CicloBem.env.FEATURES.impacto) {
        this.renderUnavailable();
        return;
      }

      try {
        const res = await CicloBem.api.get('/conta-digital/resumo');
        const impacto = res.ok && res.data ? res.data.impacto : null;

        if (!impacto) {
          this.renderUnavailable();
          return;
        }

        const hasAny =
          Number(impacto.kg_reciclados) > 0 ||
          Number(impacto.total_coletas) > 0 ||
          (Array.isArray(impacto.materiais) && impacto.materiais.length > 0);

        if (!hasAny) {
          this.renderEmpty();
          return;
        }

        this.renderData(impacto);
      } catch (error) {
        this.renderUnavailable();
        CicloBem.logger.error('Impacto load error', error);
      }
    }
  };

  CicloBem.contaDigital.impacto = ContaDigitalImpacto;
})();
