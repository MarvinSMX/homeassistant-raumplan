/**
 * Interaktiver Raumplan - Custom Lovelace Card für Home Assistant
 * Bild als Raumplan, Entitäten per Drag & Drop positionierbar.
 */

(function () {
  const CARD_TAG = 'room-plan-card';
  const EDITOR_TAG = 'room-plan-editor';

  // ---------- Hilfsfunktionen ----------
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

  // ---------- Hauptkarte (Anzeige) ----------
  class RoomPlanCard extends HTMLElement {
    static getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }

    static getStubConfig() {
      return {
        image: '/local/raumplan.png',
        entities: []
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
      this._config = {
        image: (config && config.image) ? config.image : '',
        entities: Array.isArray(config && config.entities) ? config.entities : [],
        title: (config && config.title) ? config.title : ''
      };
      if (this._root) this._render();
    }

    set hass(hass) {
      this._hass = hass;
      if (this._root) this._render();
    }

    getCardSize() {
      return 6;
    }

    connectedCallback() {
      if (!this._root) {
        this._root = document.createElement('ha-card');
        this._root.style.overflow = 'hidden';
        this._container = document.createElement('div');
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
        .room-plan-container { position: relative; width: 100%; min-height: 320px; }
        .room-plan-container .room-plan-wrapper {
          position: relative; display: block; width: 100%; line-height: 0;
        }
        .room-plan-container .room-plan-wrapper .room-plan-image {
          display: block; width: 100%; height: auto; vertical-align: top;
        }
        .room-plan-container .room-plan-entity {
          position: absolute; transform: translate(-50%,-50%);
          min-width: 40px; min-height: 40px; padding: 6px 10px;
          border-radius: 12px; background: var(--ha-card-background, #fff);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          font-size: 11px; color: var(--primary-text-color); cursor: default;
          z-index: 2; pointer-events: auto;
        }
        .room-plan-container .room-plan-entity .entity-icon {
          font-size: 22px; margin-bottom: 2px;
        }
        .room-plan-container .room-plan-entity .entity-state {
          font-weight: bold; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .room-plan-container .room-plan-entity .entity-name {
          opacity: 0.85; font-size: 10px;
        }
      `;
      document.head.appendChild(style);
    }

    _render() {
      if (!this._container) return;

      // Kein Bild = Hinweis zur Konfiguration
      if (!this._config.image) {
        this._container.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--secondary-text-color);">
            <ha-icon icon="mdi:cog" style="font-size: 48px; margin-bottom: 16px; display: block;"></ha-icon>
            <p><strong>Interaktiver Raumplan</strong></p>
            <p>Bitte konfigurieren: Karte bearbeiten und Bild-URL eintragen.</p>
          </div>`;
        return;
      }

      const img = this._config.image;
      const entities = this._config.entities || [];
      const title = this._config.title;

      let html = '';
      if (title) html += `<div style="padding: 8px 16px 0; font-weight: 600;">${title}</div>`;
      html += `<div class="room-plan-wrapper" style="position:relative;">`;
      html += `<img class="room-plan-image" src="${img}" alt="Raumplan" />`;

      entities.forEach((ent, i) => {
        const x = Math.min(100, Math.max(0, Number(ent.x) || 50));
        const y = Math.min(100, Math.max(0, Number(ent.y) || 50));
        const iconName = ent.icon || getEntityIcon(this._hass, ent.entity);
        const name = getFriendlyName(this._hass, ent.entity);
        const state = getStateDisplay(this._hass, ent.entity);
        html += `<div class="room-plan-entity" data-entity="${ent.entity}" style="left:${x}%;top:${y}%;">
          <span class="entity-icon"><ha-icon icon="${iconName}"></ha-icon></span>
          <span class="entity-state">${state}</span>
          <span class="entity-name">${name}</span>
        </div>`;
      });

      html += '</div>';
      this._container.innerHTML = html;
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
    }

    setConfig(c) {
      this._config = c ? { ...c } : { image: '', entities: [] };
      if (!Array.isArray(this._config.entities)) this._config.entities = [];
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

    _fireConfigChanged(newConfig) {
      this.dispatchEvent(new CustomEvent('config-changed', { bubbles: true, composed: true, detail: { config: newConfig } }));
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
        .rp-section-title ha-icon { color: var(--primary-color); opacity: 0.9; }
        .rp-field { margin-bottom: 16px; }
        .rp-field label { display: block; font-size: 12px; font-weight: 500; color: var(--secondary-text-color); margin-bottom: 6px; }
        .rp-field input { width: 100%; padding: 12px 14px; border: 1px solid var(--divider-color); border-radius: 8px;
          background: var(--ha-card-background, #fff); color: var(--primary-text-color); font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s; }
        .rp-field input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 2px var(--primary-color); }
        .rp-field input::placeholder { color: var(--secondary-text-color); opacity: 0.7; }
        .rp-hint { font-size: 12px; color: var(--secondary-text-color); margin-top: 6px; line-height: 1.4; }
        .rp-hint code { background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
        .rp-preview-wrap { position: relative; width: 100%; min-height: 260px; margin-top: 12px;
          border-radius: 12px; overflow: hidden; background: var(--card-background-color, #f5f5f5);
          border: 1px solid var(--divider-color); box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); }
        .rp-preview-wrap img { display: block; width: 100%; height: auto; pointer-events: none; vertical-align: top; line-height: 0; }
        .rp-editor-dot { position: absolute; width: 40px; height: 40px; left: 0; top: 0;
          transform: translate(-50%,-50%); border-radius: 50%; background: var(--primary-color);
          color: white; display: flex; align-items: center; justify-content: center; cursor: grab;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25); z-index: 10; user-select: none; touch-action: none;
          border: 3px solid rgba(255,255,255,0.9); transition: transform 0.15s; }
        .rp-editor-dot:hover { transform: translate(-50%,-50%) scale(1.08); }
        .rp-editor-dot:active { cursor: grabbing; }
        .rp-editor-dot ha-icon { --mdc-icon-size: 20px; }
        .rp-entity-list { display: flex; flex-direction: column; gap: 10px; }
        .rp-entity-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px;
          background: var(--ha-card-background, #fff); border: 1px solid var(--divider-color);
          border-radius: 10px; transition: border-color 0.2s, box-shadow 0.2s; }
        .rp-entity-row:hover { border-color: var(--primary-color); }
        .rp-entity-row input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid var(--divider-color);
          border-radius: 8px; font-size: 14px; background: var(--ha-card-background, #fff); }
        .rp-entity-row input:focus { outline: none; border-color: var(--primary-color); }
        .rp-entity-pos { font-size: 11px; color: var(--secondary-text-color); min-width: 52px; text-align: right; }
        .rp-btn-remove { padding: 8px 12px; border-radius: 8px; border: none; background: rgba(244, 67, 54, 0.12);
          color: #f44336; font-size: 13px; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 6px; }
        .rp-btn-remove:hover { background: rgba(244, 67, 54, 0.2); }
        .rp-btn-add { padding: 12px 18px; border-radius: 10px; border: 2px dashed var(--divider-color);
          background: transparent; color: var(--primary-color); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; }
        .rp-btn-add:hover { border-color: var(--primary-color); background: rgba(3, 169, 244, 0.08); }
        .rp-drag-hint { font-size: 12px; color: var(--secondary-text-color); margin-top: 8px; display: flex; align-items: center; gap: 6px; }
      `;
      document.head.appendChild(style);
    }

    _render() {
      this._injectEditorStyles();
      const img = this._config.image || '';
      const entities = this._config.entities || [];

      let html = `
        <div class="rp-editor">
          <div class="rp-section">
            <div class="rp-section-title"><ha-icon icon="mdi:image"></ha-icon> Raumplan-Bild</div>
            <div class="rp-field">
              <label for="room-plan-image-url">Bild-URL</label>
              <input type="text" id="room-plan-image-url" value="${img}" placeholder="/local/raumplan.png oder https://..." />
              <div class="rp-hint">Bild unter <code>config/www/</code> speichern, dann <code>/local/dateiname.png</code> angeben.</div>
            </div>
          </div>
          <div class="rp-section">
            <div class="rp-section-title"><ha-icon icon="mdi:format-list-bulleted"></ha-icon> Entitäten</div>
            <div class="rp-entity-list">`;

      const entityIds = this._hass && this._hass.states ? Object.keys(this._hass.states).sort() : [];
      entities.forEach((ent, i) => {
        const listId = 'room-plan-entity-list-' + i;
        html += `<div class="rp-entity-row" data-index="${i}">
          <input type="text" value="${ent.entity}" data-field="entity" list="${listId}" placeholder="z.B. light.wohnzimmer" />
          <datalist id="${listId}">${entityIds.slice(0, 200).map(eid => `<option value="${eid}">${getFriendlyName(this._hass, eid)}</option>`).join('')}</datalist>
          <span class="rp-entity-pos">${Number(ent.x).toFixed(0)}%, ${Number(ent.y).toFixed(0)}%</span>
          <button type="button" class="rp-btn-remove remove-entity" data-index="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon> Entfernen</button>
        </div>`;
      });

      html += `
            </div>
            <button type="button" class="rp-btn-add" id="room-plan-add-entity"><ha-icon icon="mdi:plus"></ha-icon> Entität hinzufügen</button>
          </div>
          <div class="rp-section">
            <div class="rp-section-title"><ha-icon icon="mdi:arrow-all"></ha-icon> Positionierung</div>
            <div class="rp-drag-hint"><ha-icon icon="mdi:gesture"></ha-icon> Punkte auf dem Plan per Drag & Drop verschieben</div>
            <div class="rp-preview-wrap" id="room-plan-preview">
              <img id="room-plan-preview-img" src="${img || ''}" alt="Vorschau" onerror="this.style.display='none'" />
              ${(img ? entities.map((ent, i) => {
                const x = Math.min(100, Math.max(0, Number(ent.x) || 50));
                const y = Math.min(100, Math.max(0, Number(ent.y) || 50));
                const icon = ent.icon || getEntityIcon(this._hass, ent.entity);
                return `<div class="rp-editor-dot editor-dot" data-index="${i}" style="left:${x}%;top:${y}%;" title="${ent.entity}"><ha-icon icon="${icon}"></ha-icon></div>`;
              }).join('') : '')}
            </div>
          </div>
        </div>`;

      this.innerHTML = html;

      const imgInput = this.querySelector('#room-plan-image-url');
      const previewImg = this.querySelector('#room-plan-preview-img');
      const preview = this.querySelector('#room-plan-preview');

      imgInput.addEventListener('input', () => {
        const v = imgInput.value.trim();
        if (previewImg) previewImg.src = v || '';
        this._config.image = v;
        this._fireConfigChanged(this._config);
      });

      this.querySelectorAll('.entity-row input').forEach(input => {
        input.addEventListener('change', () => this._syncEntitiesFromForm());
      });

      this.querySelectorAll('.remove-entity').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.index, 10);
          this._config.entities.splice(i, 1);
          this._fireConfigChanged(this._config);
        });
      });

      const addBtn = this.querySelector('#room-plan-add-entity');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          this._config.entities.push({ entity: '', x: 50, y: 50 });
          this._fireConfigChanged(this._config);
        });
      }

      // Drag & Drop (Maus + Touch) auf den Punkten im Vorschau-Bereich
      if (preview) {
        preview.querySelectorAll('.editor-dot').forEach(dot => {
          dot.addEventListener('mousedown', (e) => this._startDrag(e, dot));
          dot.addEventListener('touchstart', (e) => this._startDrag(e, dot), { passive: false });
        });
      }
      if (!this._dragListenersAdded) {
        this._dragListenersAdded = true;
        document.addEventListener('mousemove', (e) => this._onDrag(e));
        document.addEventListener('mouseup', () => this._endDrag());
        document.addEventListener('touchmove', (e) => this._onDrag(e), { passive: false });
        document.addEventListener('touchend', () => this._endDrag());
      }
    }

    _syncEntitiesFromForm() {
      const rows = this.querySelectorAll('.entity-row');
      const entities = [];
      rows.forEach((row, i) => {
        const entityInput = row.querySelector('input[data-field="entity"]');
        const ent = this._config.entities[i];
        if (ent) {
          ent.entity = (entityInput && entityInput.value.trim()) || ent.entity;
          entities.push(ent);
        }
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
      const preview = this.querySelector('#room-plan-preview');
      if (!preview) return;
      const rect = preview.getBoundingClientRect();
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
    }

    _endDrag() {
      if (this._dragging) {
        this._fireConfigChanged(this._config);
        this._dragging = null;
      }
    }
  }

  customElements.define(CARD_TAG, RoomPlanCard);
  customElements.define(EDITOR_TAG, RoomPlanEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'custom:' + CARD_TAG,
    name: 'Interaktiver Raumplan',
    description: 'Raumplan als Bild mit per Drag & Drop positionierbaren Entitäten.',
    preview: true
  });
})();
