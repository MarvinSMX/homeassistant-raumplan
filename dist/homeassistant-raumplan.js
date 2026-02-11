/**
 * Interaktiver Raumplan - Bild mit per Koordinaten positionierten Entitäten
 * Entitäten als Kreise mit Icons, Position per x,y (Prozent).
 */

(function () {
  const CARD_TAG = 'room-plan-card';
  const EDITOR_TAG = 'room-plan-editor';

  function getEntityIcon(hass, entityId) {
    const state = hass?.states?.[entityId];
    if (!state) return 'mdi:help-circle';
    const icon = state.attributes?.icon;
    if (icon) return icon;
    const domain = entityId.split('.')[0];
    const stateVal = state.state;
    if (domain === 'light' || domain === 'switch') return stateVal === 'on' ? 'mdi:lightbulb-on' : 'mdi:lightbulb-outline';
    if (domain === 'cover') return 'mdi:blinds';
    if (domain === 'climate') return 'mdi:thermostat';
    if (domain === 'sensor') return 'mdi:gauge';
    if (domain === 'binary_sensor') return 'mdi:motion-sensor';
    return 'mdi:circle';
  }

  function getFriendlyName(hass, entityId) {
    const state = hass?.states?.[entityId];
    return state?.attributes?.friendly_name || entityId;
  }

  function getStateDisplay(hass, entityId) {
    const state = hass?.states?.[entityId];
    if (!state) return '—';
    const uom = state.attributes?.unit_of_measurement;
    if (uom) return state.state + ' ' + uom;
    return state.state;
  }

  // ---------- Hauptkarte ----------
  class RoomPlanCard extends HTMLElement {
    static getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }

    static getStubConfig() {
      return {
        image: '/local/raumplan.png',
        rotation: 0,
        entities: [
          { entity: 'light.example', x: 25, y: 30, scale: 1, color: '#ffc107' },
          { entity: 'sensor.example', x: 75, y: 40, scale: 1 }
        ]
      };
    }

    constructor() {
      super();
      this._config = {};
      this._hass = null;
      this._root = null;
      this._container = null;
    }

    setConfig(config) {
      const img = (config && config.image) ? (typeof config.image === 'string' ? config.image : config.image.location || config.image) : '';
      this._config = {
        image: img,
        entities: Array.isArray(config && config.entities) ? config.entities : [],
        title: (config && config.title) ? config.title : '',
        rotation: Number(config && config.rotation) || 0
      };
      if (this._root) this._render();
    }

    set hass(hass) {
      this._hass = hass;
      if (this._root) this._render();
    }

    getCardSize() {
      return 3;
    }

    getGridOptions() {
      return { rows: 3, columns: 2, min_rows: 2, min_columns: 1 };
    }

    connectedCallback() {
      if (!this._root) {
        this._injectStyles();
        this._root = document.createElement('ha-card');
        this._root.className = 'room-plan-ha-card';
        this._root.style.cssText = 'overflow: hidden; padding: 0 !important;';
        this._container = document.createElement('div');
        this._container.className = 'room-plan-container';
        this._root.appendChild(this._container);
        this.appendChild(this._root);
      }
      this._render();
    }

    _injectStyles() {
      if (this.querySelector('style[data-room-plan]')) return;
      const style = document.createElement('style');
      style.setAttribute('data-room-plan', '1');
      style.textContent = `
        room-plan-card { display: flex; flex-direction: column; width: 100%; height: 100%; max-width: 100%; min-width: 0; min-height: 0; overflow: hidden; box-sizing: border-box; }
        room-plan-card .room-plan-ha-card { padding: 0 !important; overflow: hidden !important; flex: 1 1 0; min-height: 0; width: 100%; height: 100%; display: flex; flex-direction: column; }
        room-plan-card .room-plan-container { position: relative; flex: 1 1 0; min-height: 0; width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; }
        room-plan-card .room-plan-wrapper { position: relative; flex: 1 1 0; min-height: 0; width: 100%; height: 100%; overflow: hidden; }
        room-plan-card .room-plan-inner { position: absolute; inset: 0; width: 100%; height: 100%; }
        room-plan-card .room-plan-inner > img { width: 100%; height: 100%; object-fit: fill; object-position: center; display: block;
          filter: brightness(0.92) contrast(1.05) saturate(0.9); }
        room-plan-card .room-plan-theme-tint { position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background: var(--primary-color, #03a9f4); opacity: 0.06; mix-blend-mode: overlay; }
        room-plan-card .room-plan-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; }
        room-plan-card .room-plan-overlay > * { pointer-events: auto; }
        room-plan-card .room-plan-entity { position: absolute; transform: translate(-50%,-50%);
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--card-background-color, var(--ha-card-background, #1e1e1e));
          color: var(--primary-text-color, #e1e1e1);
          box-shadow: 0 2px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 2; border: 3px solid rgba(255,255,255,0.15);
          transition: transform 0.15s; }
        room-plan-card .room-plan-entity:hover { transform: translate(-50%,-50%) scale(1.1); }
        room-plan-card .room-plan-entity ha-icon { --mdc-icon-size: 24px; }
        room-plan-card .room-plan-entity.state-on { color: var(--state-icon-on-color, var(--state-icon-active-color, #ffc107)) !important; }
      `;
      this.appendChild(style);
    }

    _render() {
      if (!this._container) return;

      if (!this._config.image) {
        this._container.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--secondary-text-color);">
            <ha-icon icon="mdi:cog" style="font-size: 48px; margin-bottom: 16px; display: block;"></ha-icon>
            <p><strong>Interaktiver Raumplan</strong></p>
            <p>Bitte konfigurieren: Bild-URL und Entitäten mit Koordinaten.</p>
          </div>`;
        return;
      }

      const img = this._config.image;
      const entities = this._config.entities || [];
      const title = this._config.title;
      const rotation = Number(this._config.rotation) || 0;

      let html = '';
      if (title) html += `<div style="padding: 8px 16px; font-weight: 600; color: var(--primary-text-color, #e1e1e1);">${title}</div>`;
      html += `<div class="room-plan-wrapper">`;
      html += `<div class="room-plan-inner" style="transform: rotate(${rotation}deg);">`;
      html += `<img src="${img}" alt="Raumplan" />`;
      html += `<div class="room-plan-theme-tint"></div>`;
      html += `<div class="room-plan-overlay">`;

      entities.forEach((ent) => {
        const x = Math.min(100, Math.max(0, Number(ent.x) || 50));
        const y = Math.min(100, Math.max(0, Number(ent.y) || 50));
        const scale = Math.min(2, Math.max(0.3, Number(ent.scale) || 1));
        const state = this._hass?.states?.[ent.entity]?.state;
        const stateClass = state === 'on' ? ' state-on' : '';
        const baseSize = 44;
        const size = Math.round(baseSize * scale);
        const iconSize = Math.round(24 * scale);
        let entStyle = `left:${x}%;top:${y}%;width:${size}px;height:${size}px;`;
        if (ent.color) entStyle += `background:${ent.color};color:#fff;`;
        html += `<div class="room-plan-entity${stateClass}" data-entity="${ent.entity}" style="${entStyle}" title="${getFriendlyName(this._hass, ent.entity)}: ${getStateDisplay(this._hass, ent.entity)}">
          <ha-icon icon="${ent.icon || getEntityIcon(this._hass, ent.entity)}" style="--mdc-icon-size:${iconSize}px;"></ha-icon>
        </div>`;
      });

      html += '</div></div></div>';
      this._container.innerHTML = html;

      this._container.querySelectorAll('.room-plan-entity').forEach(el => {
        el.addEventListener('click', () => {
          const entityId = el.dataset.entity;
          const ev = new Event('hass-more-info', { bubbles: true, composed: true });
          ev.detail = { entityId };
          this.dispatchEvent(ev);
        });
      });
    }
  }

  // ---------- Konfigurations-Editor (Drag & Drop) ----------
  class RoomPlanEditor extends HTMLElement {
    constructor() {
      super();
      this._config = { image: '', entities: [] };
      this._hass = null;
      this._dragging = null;
      this._dragOffset = { x: 0, y: 0 };
      this._dragListenersAdded = false;
    }

    setConfig(c) {
      this._config = c ? { ...c } : { image: '', entities: [] };
      this._config.entities = Array.isArray(this._config.entities) ? this._config.entities : [];
      this._config.rotation = Number(this._config.rotation) || 0;
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
      if (this.querySelector('style[data-room-plan-editor]')) return;
      const style = document.createElement('style');
      style.setAttribute('data-room-plan-editor', '1');
      style.textContent = `
        room-plan-editor .rp-editor { padding: 20px; max-width: 560px; }
        room-plan-editor .rp-editor * { box-sizing: border-box; }
        room-plan-editor .rp-section { margin-bottom: 24px; }
        room-plan-editor .rp-section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px; font-weight: 600; color: var(--primary-text-color, #e1e1e1); }
        room-plan-editor .rp-section-title ha-icon { color: var(--primary-color, #03a9f4); }
        room-plan-editor .rp-field { margin-bottom: 16px; }
        room-plan-editor .rp-field label { display: block; font-size: 12px; font-weight: 500; color: var(--secondary-text-color, #9e9e9e); margin-bottom: 6px; }
        room-plan-editor .rp-field input { width: 100%; padding: 12px 14px; border: 1px solid var(--divider-color, rgba(255,255,255,0.12)); border-radius: 8px;
          background: var(--ha-card-background, #1e1e1e); color: var(--primary-text-color, #e1e1e1); font-size: 14px; }
        room-plan-editor .rp-field input:focus { outline: none; border-color: var(--primary-color, #03a9f4); }
        room-plan-editor .rp-hint { font-size: 12px; color: var(--secondary-text-color, #9e9e9e); margin-top: 6px; line-height: 1.4; }
        room-plan-editor .rp-hint code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
        room-plan-editor .rp-entity-list { display: flex; flex-direction: column; gap: 10px; }
        room-plan-editor .rp-entity-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 12px 14px;
          background: var(--ha-card-background, #1e1e1e); border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
          border-radius: 10px; }
        room-plan-editor .rp-entity-row input[data-field] { flex: 1; min-width: 120px; padding: 10px 12px; border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
          border-radius: 8px; font-size: 14px; background: var(--ha-card-background, #1e1e1e); color: var(--primary-text-color, #e1e1e1); }
        room-plan-editor .rp-entity-row input[type="number"] { width: 70px; flex: none; }
        room-plan-editor .rp-entity-row input[type="color"] { width: 36px; height: 36px; padding: 2px; flex: none; cursor: pointer; border-radius: 6px; }
        room-plan-editor .rp-entity-row input:focus { outline: none; border-color: var(--primary-color, #03a9f4); }
        room-plan-editor .rp-entity-pos { font-size: 11px; color: var(--secondary-text-color, #9e9e9e); min-width: 70px; text-align: right; }
        room-plan-editor .rp-btn-remove { padding: 8px 12px; border-radius: 8px; border: none; background: rgba(244, 67, 54, 0.2);
          color: #f44336; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        room-plan-editor .rp-btn-remove:hover { background: rgba(244, 67, 54, 0.3); }
        room-plan-editor .rp-btn-add { padding: 12px 18px; border-radius: 10px; border: 2px dashed var(--divider-color, rgba(255,255,255,0.12));
          background: transparent; color: var(--primary-color, #03a9f4); font-size: 14px; font-weight: 500;
          cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; margin-top: 12px; }
        room-plan-editor .rp-btn-add:hover { border-color: var(--primary-color, #03a9f4); background: rgba(3, 169, 244, 0.08); }
        room-plan-editor .rp-btn-position { padding: 12px 20px; border-radius: 10px; border: none;
          background: var(--primary-color, #03a9f4); color: white; font-size: 14px; font-weight: 500; cursor: pointer;
          display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; }
        room-plan-editor .rp-btn-position:hover:not(:disabled) { opacity: 0.9; }
        room-plan-editor .rp-btn-position:disabled { opacity: 0.5; cursor: not-allowed; }
        room-plan-editor .rp-btn-position ha-icon { --mdc-icon-size: 22px; }
        room-plan-editor .rp-editor-dot { position: absolute; width: 44px; height: 44px; left: 0; top: 0;
          transform: translate(-50%,-50%); border-radius: 50%; background: var(--primary-color, #03a9f4); color: white;
          display: flex; align-items: center; justify-content: center; cursor: grab;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25); z-index: 10; user-select: none; touch-action: none;
          border: 3px solid rgba(255,255,255,0.9); }
        room-plan-editor .rp-editor-dot:hover { transform: translate(-50%,-50%) scale(1.08); }
        room-plan-editor .rp-editor-dot:active { cursor: grabbing; }
        room-plan-editor .rp-editor-dot ha-icon { --mdc-icon-size: 22px; }
      `;
      this.appendChild(style);
    }

    _render() {
      const img = typeof this._config.image === 'string' ? this._config.image : (this._config.image?.location || '');
      const rotation = Number(this._config.rotation) || 0;
      const entities = this._config.entities || [];
      const entityIds = this._hass && this._hass.states ? Object.keys(this._hass.states).sort() : [];

      let html = `
        <div class="rp-editor">
          <div class="rp-section">
            <div class="rp-section-title"><ha-icon icon="mdi:image"></ha-icon> Raumplan-Bild</div>
            <div class="rp-field">
              <label>Bild-URL</label>
              <input type="text" id="rp-image-url" value="${img}" placeholder="/local/raumplan.png" />
              <div class="rp-hint">Bild unter <code>config/www/</code> speichern, dann <code>/local/dateiname.png</code> angeben.</div>
            </div>
            <div class="rp-field rp-field-inline">
              <label>Drehung (Grad)</label>
              <select id="rp-rotation" style="padding: 10px 12px; border-radius: 8px; border: 1px solid var(--divider-color, rgba(255,255,255,0.12)); background: var(--ha-card-background, #1e1e1e); color: var(--primary-text-color, #e1e1e1); font-size: 14px;">
                <option value="0" ${rotation === 0 ? 'selected' : ''}>0°</option>
                <option value="90" ${rotation === 90 ? 'selected' : ''}>90°</option>
                <option value="180" ${rotation === 180 ? 'selected' : ''}>180°</option>
                <option value="270" ${rotation === 270 ? 'selected' : ''}>270°</option>
              </select>
            </div>
          </div>
          <div class="rp-section">
            <div class="rp-section-title"><ha-icon icon="mdi:format-list-bulleted"></ha-icon> Entitäten (Koordinaten per Drag & Drop)</div>
            <div class="rp-entity-list">`;

      entities.forEach((ent, i) => {
        const listId = 'rp-entity-list-' + i;
        const x = Number(ent.x) || 50;
        const y = Number(ent.y) || 50;
        const scale = Math.min(2, Math.max(0.3, Number(ent.scale) || 1));
        const color = ent.color || '';
        html += `<div class="rp-entity-row" data-index="${i}">
          <input type="text" data-field="entity" list="${listId}" value="${ent.entity}" placeholder="light.wohnzimmer" />
          <datalist id="${listId}">${entityIds.slice(0, 200).map(eid => `<option value="${eid}">${getFriendlyName(this._hass, eid)}</option>`).join('')}</datalist>
          <input type="number" data-field="scale" min="0.3" max="2" step="0.1" value="${scale}" placeholder="1" title="Skalierung" />
          <input type="color" data-field="color" value="${color || '#03a9f4'}" title="Farbe" />
          <span class="rp-entity-pos">${x.toFixed(1)}%, ${y.toFixed(1)}%</span>
          <button type="button" class="rp-btn-remove rp-remove-entity" data-index="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
        </div>`;
      });

      html += `
            </div>
            <button type="button" class="rp-btn-add" id="rp-add-entity"><ha-icon icon="mdi:plus"></ha-icon> Entität hinzufügen</button>
          </div>
          <div class="rp-section">
            <div class="rp-section-title"><ha-icon icon="mdi:gesture"></ha-icon> Position setzen</div>
            <div class="rp-hint">Klicke den Button, um die Positionen im Vollbild zu setzen. Exakt gleiche Darstellung wie die Card.</div>
            <button type="button" class="rp-btn-position" id="rp-btn-position" ${!img ? 'disabled' : ''}>
              <ha-icon icon="mdi:fullscreen"></ha-icon>
              <span>Positionierung öffnen</span>
            </button>
          </div>
        </div>`;

      this.innerHTML = html;

      const positionBtn = this.querySelector('#rp-btn-position');
      if (positionBtn && img) {
        positionBtn.addEventListener('click', () => this._openPositionFullscreen());
      }

      this.querySelector('#rp-image-url').addEventListener('input', (e) => {
        const v = e.target.value.trim();
        this._config.image = v;
        this._fireConfigChanged(this._config);
        const positionBtn = this.querySelector('#rp-btn-position');
        if (positionBtn) positionBtn.disabled = !v;
      });

      const rotEl = this.querySelector('#rp-rotation');
      if (rotEl) {
        rotEl.addEventListener('change', () => {
          this._config.rotation = Number(rotEl.value) || 0;
          this._fireConfigChanged(this._config);
        });
      }

      this.querySelectorAll('.rp-entity-row input').forEach(input => {
        input.addEventListener('change', () => this._syncEntities());
        input.addEventListener('input', (e) => {
          if (e.target.dataset.field === 'scale' || e.target.dataset.field === 'color') this._syncEntities();
        });
      });

      this.querySelectorAll('.rp-remove-entity').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.index, 10);
          this._config.entities.splice(i, 1);
          this._fireConfigChanged(this._config);
        });
      });

      this.querySelector('#rp-add-entity').addEventListener('click', () => {
        this._config.entities.push({ entity: '', x: 50, y: 50 });
        this._fireConfigChanged(this._config);
      });

      if (!this._dragListenersAdded) {
        this._dragListenersAdded = true;
        document.addEventListener('mousemove', (e) => this._onDrag(e));
        document.addEventListener('mouseup', () => this._endDrag());
        document.addEventListener('touchmove', (e) => this._onDrag(e), { passive: false });
        document.addEventListener('touchend', () => this._endDrag());
      }

      this._injectEditorStyles();
    }

    _syncEntities() {
      const rows = this.querySelectorAll('.rp-entity-row');
      const entities = [];
      rows.forEach((row, i) => {
        const entityInput = row.querySelector('input[data-field="entity"]');
        const scaleInput = row.querySelector('input[data-field="scale"]');
        const colorInput = row.querySelector('input[data-field="color"]');
        const ent = this._config.entities[i] || {};
        const scale = scaleInput ? Math.min(2, Math.max(0.3, Number(scaleInput.value) || 1)) : (ent.scale ?? 1);
        const colorVal = colorInput?.value?.trim() || '';
        const hadColor = !!ent.color;
        const color = (colorVal && (colorVal !== '#03a9f4' || hadColor)) ? colorVal : undefined;
        entities.push({
          entity: (entityInput?.value || '').trim() || ent.entity || '',
          x: ent.x ?? 50,
          y: ent.y ?? 50,
          icon: ent.icon,
          scale: scale,
          color: color
        });
      });
      this._config.entities = entities;
      this._fireConfigChanged(this._config);
    }

    _startDrag(ev, dot) {
      ev.preventDefault();
      ev.stopPropagation();
      const idx = parseInt(dot.dataset.index, 10);
      const ent = this._config.entities[idx];
      if (!ent) return;
      const rect = dot.parentElement.getBoundingClientRect();
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const leftPct = (clientX - rect.left) / rect.width * 100;
      const topPct = (clientY - rect.top) / rect.height * 100;
      this._dragOffset = { x: leftPct - (Number(ent.x) || 50), y: topPct - (Number(ent.y) || 50) };
      this._dragging = { index: idx, element: dot };
    }

    _onDrag(ev) {
      if (!this._dragging) return;
      if (!this._dragging.element.isConnected) { this._dragging = null; return; }
      ev.preventDefault();
      const overlay = this._dragging.element.parentElement;
      const rect = overlay && (overlay.classList.contains('rp-preview-overlay') || overlay.classList.contains('rp-position-overlay'))
        ? overlay.getBoundingClientRect() : null;
      if (!rect || rect.width === 0) return;
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
      let x = (clientX - rect.left) / rect.width * 100 - this._dragOffset.x;
      let y = (clientY - rect.top) / rect.height * 100 - this._dragOffset.y;
      x = Math.min(100, Math.max(0, x));
      y = Math.min(100, Math.max(0, y));
      const ent = this._config.entities[this._dragging.index];
      ent.x = Math.round(x * 10) / 10;
      ent.y = Math.round(y * 10) / 10;
      this._dragging.element.style.left = ent.x + '%';
      this._dragging.element.style.top = ent.y + '%';
      const posSpan = this.querySelectorAll('.rp-entity-pos')[this._dragging.index];
      if (posSpan) posSpan.textContent = ent.x.toFixed(1) + '%, ' + ent.y.toFixed(1) + '%';
    }

    _endDrag() {
      if (this._dragging) {
        this._fireConfigChanged(this._config);
        const posSpan = this.querySelectorAll('.rp-entity-pos')[this._dragging.index];
        if (posSpan) {
          const ent = this._config.entities[this._dragging.index];
          if (ent) posSpan.textContent = ent.x.toFixed(1) + '%, ' + ent.y.toFixed(1) + '%';
        }
        this._dragging = null;
      }
    }

    _openPositionFullscreen() {
      this._syncEntities();
      const img = typeof this._config.image === 'string' ? this._config.image : (this._config.image?.location || '');
      if (!img) return;
      const rotation = Number(this._config.rotation) || 0;
      const entities = this._config.entities || [];

      if (!document.getElementById('rp-position-fullscreen-styles')) {
        const style = document.createElement('style');
        style.id = 'rp-position-fullscreen-styles';
        style.textContent = `
          .rp-position-fullscreen { position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.95); display: flex;
            flex-direction: column; padding: 16px; box-sizing: border-box; }
          .rp-position-fullscreen .rp-position-close { position: absolute; top: 16px; right: 16px; z-index: 10; padding: 10px 16px;
            border-radius: 8px; border: none; background: var(--primary-color, #03a9f4); color: white; font-size: 14px; cursor: pointer;
            display: flex; align-items: center; gap: 8px; }
          .rp-position-fullscreen .rp-position-close:hover { opacity: 0.9; }
          .rp-position-fullscreen .rp-position-close ha-icon { --mdc-icon-size: 20px; }
          .rp-position-fullscreen .rp-position-card { position: relative; flex: 1; width: 100%; height: 100%; min-width: 0; min-height: 0;
            overflow: hidden; border-radius: 12px; border: 2px solid var(--primary-color, #03a9f4); }
          .rp-position-fullscreen .rp-position-card > img { width: 100%; height: 100%; object-fit: fill; object-position: center; display: block;
            filter: brightness(0.92) contrast(1.05) saturate(0.9); }
          .rp-position-fullscreen .rp-position-theme-tint { position: absolute; inset: 0; pointer-events: none; z-index: 0;
            background: var(--primary-color, #03a9f4); opacity: 0.06; mix-blend-mode: overlay; }
          .rp-position-fullscreen .rp-position-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; }
          .rp-position-fullscreen .rp-position-overlay > * { pointer-events: auto; }
          .rp-position-fullscreen .rp-editor-dot { position: absolute; width: 44px; height: 44px; left: 0; top: 0;
            transform: translate(-50%,-50%); border-radius: 50%; background: var(--primary-color, #03a9f4); color: white;
            display: flex; align-items: center; justify-content: center; cursor: grab; box-shadow: 0 2px 12px rgba(0,0,0,0.25);
            z-index: 10; user-select: none; touch-action: none; border: 3px solid rgba(255,255,255,0.9); }
          .rp-position-fullscreen .rp-editor-dot:hover { transform: translate(-50%,-50%) scale(1.08); }
          .rp-position-fullscreen .rp-editor-dot:active { cursor: grabbing; }
          .rp-position-fullscreen .rp-editor-dot ha-icon { --mdc-icon-size: 22px; }
        `;
        document.head.appendChild(style);
      }

      const overlay = document.createElement('div');
      overlay.className = 'rp-position-fullscreen';
      overlay.innerHTML = `
        <button type="button" class="rp-position-close" id="rp-position-close" title="Schließen">
          <ha-icon icon="mdi:close"></ha-icon> Schließen
        </button>
        <div class="rp-position-card" style="transform: rotate(${rotation}deg);">
          <img src="${img}" alt="Raumplan" />
          <div class="rp-position-theme-tint"></div>
          <div class="rp-position-overlay">
            ${entities.map((ent, i) => {
              const x = Math.min(100, Math.max(0, Number(ent.x) || 50));
              const y = Math.min(100, Math.max(0, Number(ent.y) || 50));
              const scale = Math.min(2, Math.max(0.3, Number(ent.scale) || 1));
              const size = Math.round(44 * scale);
              const iconSize = Math.round(22 * scale);
              const icon = ent.icon || getEntityIcon(this._hass, ent.entity);
              let dotStyle = `left:${x}%;top:${y}%;width:${size}px;height:${size}px;`;
              if (ent.color) dotStyle += `background:${ent.color};`;
              return `<div class="rp-editor-dot editor-dot" data-index="${i}" style="${dotStyle}" title="${ent.entity}"><ha-icon icon="${icon}" style="--mdc-icon-size:${iconSize}px;"></ha-icon></div>`;
            }).join('')}
          </div>
        </div>`;
      document.body.appendChild(overlay);

      overlay.querySelectorAll('.editor-dot').forEach(dot => {
        dot.addEventListener('mousedown', (e) => this._startDrag(e, dot));
        dot.addEventListener('touchstart', (e) => this._startDrag(e, dot), { passive: false });
      });

      const close = () => {
        if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
        document.removeEventListener('keydown', escHandler);
      };
      const escHandler = (e) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', escHandler);
      overlay.querySelector('#rp-position-close').addEventListener('click', close);
    }
  }

  customElements.define(CARD_TAG, RoomPlanCard);
  customElements.define(EDITOR_TAG, RoomPlanEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'custom:' + CARD_TAG,
    name: 'Interaktiver Raumplan',
    description: 'Raumplan als Bild mit Entitäten per Koordinaten (x,y). Kreise mit Icons, Drag & Drop.',
    preview: true
  });
})();
