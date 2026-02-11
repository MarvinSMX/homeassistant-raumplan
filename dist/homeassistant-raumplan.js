/**
 * Interaktiver Raumplan - ha-floorplan Style
 * SVG-basiert, Entities werden auf SVG-Elemente gemappt.
 * Inspiriert von: https://github.com/ExperienceLovelace/ha-floorplan
 */

(function () {
  const CARD_TAG = 'room-plan-card';
  const EDITOR_TAG = 'room-plan-editor';

  function getImageUrl(cfg) {
    if (!cfg || !cfg.image) return null;
    if (typeof cfg.image === 'string') return cfg.image;
    if (cfg.image.location) return cfg.image.location;
    if (cfg.image.sizes && cfg.image.sizes[0]) return cfg.image.sizes[0].location;
    return null;
  }

  function getFriendlyName(hass, entityId) {
    const state = hass?.states?.[entityId];
    return state?.attributes?.friendly_name || entityId;
  }

  function entityIdToClass(id) {
    return 'ha-entity-' + (id || '').replace(/\./g, '-');
  }

  // ---------- Hauptkarte (ha-floorplan Style) ----------
  class RoomPlanCard extends HTMLElement {
    static getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }

    static getStubConfig() {
      return {
        image: '/local/floorplan.svg',
        stylesheet: '/local/floorplan.css',
        rules: [
          { entity: 'light.example', element: 'area.livingroom', tap_action: 'toggle' }
        ]
      };
    }

    constructor() {
      super();
      this._config = {};
      this._hass = null;
      this._root = null;
      this._container = null;
      this._svgRoot = null;
      this._rules = [];
    }

    setConfig(config) {
      const img = getImageUrl(config);
      if (!img) {
        this._config = { image: '', stylesheet: '', rules: [] };
      } else {
        this._config = {
          image: config.image,
          stylesheet: config.stylesheet || '',
          rules: Array.isArray(config.rules) ? config.rules : [],
          title: config.title || ''
        };
      }
      this._rules = this._config.rules || [];
      if (this._root) this._render();
    }

    set hass(hass) {
      this._hass = hass;
      if (this._svgRoot) this._applyStates();
    }

    getCardSize() {
      return 6;
    }

    connectedCallback() {
      if (!this._root) {
        this._root = document.createElement('ha-card');
        this._root.style.overflow = 'hidden';
        this._container = document.createElement('div');
        this._container.id = 'floorplan';
        this._container.className = 'room-plan-container';
        this._root.appendChild(this._container);
        this.appendChild(this._root);
        this._injectStyles();
      }
      this._render();
    }

    _injectStyles() {
      if (document.getElementById('room-plan-card-styles')) return;
      const style = document.createElement('style');
      style.id = 'room-plan-card-styles';
      style.textContent = `
        #floorplan { position: relative; width: 100%; min-height: 320px; }
        #floorplan svg { width: 100%; height: auto; display: block; }
        #floorplan svg, #floorplan svg * { vector-effect: non-scaling-stroke; pointer-events: all; }
        .ha-entity:hover { stroke: var(--primary-color) !important; stroke-width: 1px !important; cursor: pointer; }
      `;
      document.head.appendChild(style);
    }

    async _render() {
      if (!this._container) return;

      const imgUrl = getImageUrl(this._config);
      if (!imgUrl) {
        this._container.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--secondary-text-color);">
            <ha-icon icon="mdi:vector-square" style="font-size: 48px; margin-bottom: 16px; display: block;"></ha-icon>
            <p><strong>Interaktiver Raumplan (ha-floorplan Style)</strong></p>
            <p>Bitte konfigurieren: SVG-URL und Rules mit entity + element (SVG-Element-ID).</p>
            <p style="font-size: 12px; margin-top: 12px;">Siehe <a href="https://github.com/ExperienceLovelace/ha-floorplan" target="_blank">ha-floorplan</a> für Anleitung.</p>
          </div>`;
        return;
      }

      const title = this._config.title;
      let html = '';
      if (title) html += `<div style="padding: 8px 16px 0; font-weight: 600;">${title}</div>`;
      html += `<div class="room-plan-wrapper" style="position:relative;"></div>`;
      this._container.innerHTML = html;

      const wrapper = this._container.querySelector('.room-plan-wrapper');

      try {
        const isSvg = imgUrl.toLowerCase().endsWith('.svg');
        if (isSvg) {
          const base = window.location.origin;
          const url = imgUrl.startsWith('/') ? base + imgUrl : imgUrl;
          const res = await fetch(url);
          const svgText = await res.text();
          wrapper.innerHTML = svgText;
          this._svgRoot = wrapper.querySelector('svg');
          if (!this._svgRoot) {
            wrapper.innerHTML = `<img src="${imgUrl}" alt="Raumplan" style="width:100%;height:auto;" />`;
          }
        } else {
          wrapper.innerHTML = `<img src="${imgUrl}" alt="Raumplan" style="width:100%;height:auto;" />`;
        }

        if (this._config.stylesheet) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = this._config.stylesheet.startsWith('/') ? (window.location.origin + this._config.stylesheet) : this._config.stylesheet;
          document.head.appendChild(link);
        }

        if (this._svgRoot) {
          this._applyStates();
          this._bindElements();
        }
      } catch (e) {
        wrapper.innerHTML = `<div style="padding: 24px; color: #f44336;">Fehler beim Laden: ${e.message}</div>`;
      }
    }

    _getElement(selector) {
      if (!this._svgRoot) return null;
      try {
        return this._svgRoot.querySelector('[id="' + selector.replace(/"/g, '\\"') + '"]') ||
          this._svgRoot.querySelector('#' + selector.replace(/\./g, '\\.'));
      } catch (_) { return null; }
    }

    _applyStates() {
      if (!this._svgRoot || !this._hass) return;

      this._rules.forEach(rule => {
        const entities = rule.entities || (rule.entity ? [rule.entity] : []);
        const elements = rule.elements || (rule.element ? [rule.element] : []);

        entities.forEach(entityId => {
          const state = this._hass.states?.[entityId];
          const stateVal = state ? state.state : 'unknown';
          const cls = entityIdToClass(entityId);
          const stateCls = 'state-' + String(stateVal).replace(/\s/g, '-');

          elements.forEach(sel => {
            const el = this._getElement(sel);
            if (el) {
              el.classList.add('ha-entity', cls);
              Array.from(el.classList).filter(c => c.startsWith('state-')).forEach(c => el.classList.remove(c));
              el.classList.add(stateCls);
              el.dataset.entity = entityId;
              el.dataset.state = stateVal;
            }
          });
        });
      });
    }

    _bindElements() {
      if (!this._svgRoot) return;

      this._rules.forEach(rule => {
        const entities = rule.entities || (rule.entity ? [rule.entity] : []);
        const elements = rule.elements || (rule.element ? [rule.element] : []);
        const tapAction = rule.tap_action || 'more-info';
        const entityId = entities[0];

        elements.forEach(sel => {
          const el = this._getElement(sel);
          if (el && entityId) {
            el.style.cursor = 'pointer';
            el.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              this._handleTap(entityId, tapAction);
            });
          }
        });
      });
    }

    _handleTap(entityId, action) {
      if (!this._hass) return;

      if (action === 'toggle') {
        this._hass.callService('homeassistant', 'toggle', { entity_id: entityId });
      } else if (action === 'more-info') {
        const ev = new Event('hass-more-info', { bubbles: true, composed: true });
        ev.detail = { entityId };
        this.dispatchEvent(ev);
      } else if (typeof action === 'object' && action.action === 'call-service') {
        const svc = action.service || action.service_data?.service;
        const data = action.service_data || {};
        if (svc) {
          const [domain, service] = svc.split('.');
          this._hass.callService(domain, service, { ...data, entity_id: entityId });
        }
      } else if (typeof action === 'string' && action.includes('.')) {
        const [domain, service] = action.split('.');
        this._hass.callService(domain, service, { entity_id: entityId });
      }
    }
  }

  // ---------- Konfigurations-Editor ----------
  class RoomPlanEditor extends HTMLElement {
    constructor() {
      super();
      this._config = { image: '', stylesheet: '', rules: [] };
      this._hass = null;
    }

    setConfig(c) {
      this._config = c ? { ...c } : { image: '', stylesheet: '', rules: [] };
      if (!Array.isArray(this._config.rules)) this._config.rules = [];
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    set lovelace(l) { this._lovelace = l; }

    connectedCallback() {
      this._render();
    }

    _fireConfigChanged(cfg) {
      this.dispatchEvent(new CustomEvent('config-changed', { bubbles: true, composed: true, detail: { config: cfg } }));
    }

    _injectEditorStyles() {
      if (document.getElementById('room-plan-editor-styles')) return;
      const style = document.createElement('style');
      style.id = 'room-plan-editor-styles';
      style.textContent = `
        .rp-editor { padding: 20px; max-width: 560px; }
        .rp-editor * { box-sizing: border-box; }
        .rp-section { margin-bottom: 24px; }
        .rp-section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
        .rp-section-title ha-icon { color: var(--primary-color); }
        .rp-field { margin-bottom: 16px; }
        .rp-field label { display: block; font-size: 12px; font-weight: 500; color: var(--secondary-text-color); margin-bottom: 6px; }
        .rp-field input { width: 100%; padding: 12px 14px; border: 1px solid var(--divider-color); border-radius: 8px;
          background: var(--ha-card-background, #fff); color: var(--primary-text-color); font-size: 14px; }
        .rp-field input:focus { outline: none; border-color: var(--primary-color); }
        .rp-hint { font-size: 12px; color: var(--secondary-text-color); margin-top: 6px; line-height: 1.4; }
        .rp-hint code { background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
        .rp-rule-list { display: flex; flex-direction: column; gap: 10px; }
        .rp-rule-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items: center; padding: 12px;
          background: var(--ha-card-background, #fff); border: 1px solid var(--divider-color); border-radius: 10px; }
        .rp-rule-row input { padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 8px; font-size: 14px; }
        .rp-btn-remove { padding: 8px 12px; border-radius: 8px; border: none; background: rgba(244, 67, 54, 0.12);
          color: #f44336; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .rp-btn-remove:hover { background: rgba(244, 67, 54, 0.2); }
        .rp-btn-add { padding: 12px 18px; border-radius: 10px; border: 2px dashed var(--divider-color);
          background: transparent; color: var(--primary-color); font-size: 14px; font-weight: 500;
          cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; margin-top: 12px; }
        .rp-btn-add:hover { border-color: var(--primary-color); background: rgba(3, 169, 244, 0.08); }
        .rp-preview-wrap { margin-top: 12px; border-radius: 12px; overflow: hidden; border: 1px solid var(--divider-color); background: #f5f5f5; min-height: 160px; }
        .rp-preview-wrap img { display: block; width: 100%; height: auto; }
      `;
      document.head.appendChild(style);
    }

    _render() {
      this._injectEditorStyles();
      const img = typeof this._config.image === 'string' ? this._config.image : (this._config.image?.location || '');
      const stylesheet = this._config.stylesheet || '';
      const rules = this._config.rules || [];
      const entityIds = this._hass && this._hass.states ? Object.keys(this._hass.states).sort() : [];

      let html = `
        <div class="rp-editor">
          <div class="rp-section">
            <div class="rp-section-title"><ha-icon icon="mdi:vector-square"></ha-icon> SVG Raumplan (ha-floorplan Style)</div>
            <div class="rp-field">
              <label>SVG-URL</label>
              <input type="text" id="rp-image-url" value="${img}" placeholder="/local/floorplan.svg" />
              <div class="rp-hint">SVG-Datei mit Element-IDs (z.B. area.wohnzimmer). In Inkscape erstellen.</div>
            </div>
            <div class="rp-field">
              <label>CSS-Stylesheet (optional)</label>
              <input type="text" id="rp-stylesheet-url" value="${stylesheet}" placeholder="/local/floorplan.css" />
            </div>
          </div>
          <div class="rp-section">
            <div class="rp-section-title"><ha-icon icon="mdi:link-variant"></ha-icon> Rules (Entity → SVG-Element)</div>
            <div class="rp-rule-list">`;

      rules.forEach((rule, i) => {
        const ent = rule.entities ? rule.entities[0] : rule.entity || '';
        const elem = rule.elements ? rule.elements[0] : rule.element || '';
        const listId = 'rp-entity-list-' + i;
        html += `<div class="rp-rule-row" data-index="${i}">
          <input type="text" data-field="entity" list="${listId}" value="${ent}" placeholder="light.wohnzimmer" />
          <datalist id="${listId}">${entityIds.slice(0, 150).map(eid => `<option value="${eid}">${getFriendlyName(this._hass, eid)}</option>`).join('')}</datalist>
          <input type="text" data-field="element" value="${elem}" placeholder="area.wohnzimmer" />
          <button type="button" class="rp-btn-remove rp-remove-rule" data-index="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
        </div>`;
      });

      html += `
            </div>
            <button type="button" class="rp-btn-add" id="rp-add-rule"><ha-icon icon="mdi:plus"></ha-icon> Rule hinzufügen</button>
          </div>
          <div class="rp-section">
            <div class="rp-section-title"><ha-icon icon="mdi:information"></ha-icon> Vorschau</div>
            <div class="rp-preview-wrap" id="rp-preview">
              <img id="rp-preview-img" src="${img || ''}" alt="Vorschau" onerror="this.style.display='none'" />
            </div>
          </div>
        </div>`;

      this.innerHTML = html;

      this.querySelector('#rp-image-url').addEventListener('input', (e) => {
        const v = e.target.value.trim();
        this._config.image = v;
        this.querySelector('#rp-preview-img').src = v || '';
        this._fireConfigChanged(this._config);
      });

      this.querySelector('#rp-stylesheet-url').addEventListener('input', (e) => {
        this._config.stylesheet = e.target.value.trim();
        this._fireConfigChanged(this._config);
      });

      this.querySelectorAll('.rp-rule-row input').forEach(input => {
        input.addEventListener('change', () => this._syncRules());
      });

      this.querySelectorAll('.rp-remove-rule').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.index, 10);
          this._config.rules.splice(i, 1);
          this._fireConfigChanged(this._config);
        });
      });

      this.querySelector('#rp-add-rule').addEventListener('click', () => {
        this._config.rules.push({ entity: '', element: '', tap_action: 'toggle' });
        this._fireConfigChanged(this._config);
      });
    }

    _syncRules() {
      const rows = this.querySelectorAll('.rp-rule-row');
      const rules = [];
      rows.forEach((row, i) => {
        const entityInput = row.querySelector('input[data-field="entity"]');
        const elementInput = row.querySelector('input[data-field="element"]');
        const r = this._config.rules[i] || {};
        rules.push({
          entity: (entityInput?.value || '').trim() || r.entity || '',
          element: (elementInput?.value || '').trim() || r.element || '',
          tap_action: r.tap_action || 'toggle'
        });
      });
      this._config.rules = rules;
      this._fireConfigChanged(this._config);
    }
  }

  customElements.define(CARD_TAG, RoomPlanCard);
  customElements.define(EDITOR_TAG, RoomPlanEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'custom:' + CARD_TAG,
    name: 'Interaktiver Raumplan',
    description: 'SVG-Raumplan mit Entity-Element-Mapping (ha-floorplan Style).',
    preview: true
  });
})();
