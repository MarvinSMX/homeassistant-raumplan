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
        entities: [
          { entity: 'light.example', x: 20, y: 30 },
          { entity: 'sensor.example_temperature', x: 80, y: 25 }
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
      if (!config || !config.image) {
        throw new Error('Bitte ein Bild für den Raumplan angeben (image).');
      }
      this._config = {
        image: config.image,
        entities: Array.isArray(config.entities) ? config.entities : [],
        title: config.title || ''
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
        .room-plan-container .room-plan-image {
          display: block; width: 100%; height: auto; vertical-align: top;
        }
        .room-plan-container .room-plan-entity {
          position: absolute; transform: translate(-50%,-50%);
          min-width: 40px; min-height: 40px; padding: 6px 10px;
          border-radius: 12px; background: var(--ha-card-background, #fff);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          font-size: 11px; color: var(--primary-text-color); cursor: default;
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
      if (!this._container || !this._config.image) return;

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
        .room-plan-editor { padding: 16px; }
        .room-plan-editor label { display: block; margin-top: 12px; margin-bottom: 4px; font-weight: 500; }
        .room-plan-editor input[type="text"] { width: 100%; padding: 8px; box-sizing: border-box; }
        .room-plan-editor .editor-preview { position: relative; width: 100%; min-height: 280px; margin-top: 16px;
          border: 1px solid var(--divider-color); border-radius: 8px; overflow: hidden; background: #f5f5f5; }
        .room-plan-editor .editor-preview img { display: block; width: 100%; height: auto; pointer-events: none; }
        .room-plan-editor .editor-dot { position: absolute; width: 36px; height: 36px; margin-left: -18px; margin-top: -18px;
          border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center;
          cursor: grab; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        .room-plan-editor .editor-dot:active { cursor: grabbing; }
        .room-plan-editor .entity-list { margin-top: 12px; }
        .room-plan-editor .entity-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .room-plan-editor .entity-row input { flex: 1; }
        .room-plan-editor .entity-row button { padding: 6px 12px; }
        .room-plan-editor .add-entity { margin-top: 12px; }
      `;
      document.head.appendChild(style);
    }

    _render() {
      this._injectEditorStyles();
      const img = this._config.image || '';
      const entities = this._config.entities || [];

      let html = `
        <div class="room-plan-editor">
          <label>Bild-URL des Raumplans</label>
          <input type="text" id="room-plan-image-url" value="${img}" placeholder="/local/raumplan.png oder https://..." />
          <p style="margin:4px 0 0; font-size: 12px; color: var(--secondary-text-color);">
            Bild z.B. unter <code>config/www/</code> speichern, dann <code>/local/dateiname.png</code> angeben.
          </p>
          <label class="entity-list">Entitäten (Position per Drag & Drop im Vorschau-Bild setzen)</label>
      `;

      const entityIds = this._hass && this._hass.states ? Object.keys(this._hass.states).sort() : [];
      entities.forEach((ent, i) => {
        const name = getFriendlyName(this._hass, ent.entity) || ent.entity;
        const listId = 'room-plan-entity-list-' + i;
        html += `<div class="entity-row" data-index="${i}">
          <input type="text" value="${ent.entity}" data-field="entity" list="${listId}" placeholder="z.B. light.wohnzimmer" />
          <datalist id="${listId}">${entityIds.slice(0, 200).map(eid => `<option value="${eid}">${getFriendlyName(this._hass, eid)}</option>`).join('')}</datalist>
          <span style="flex:0 0 60px; font-size: 11px;">${Number(ent.x).toFixed(0)}%, ${Number(ent.y).toFixed(0)}%</span>
          <button type="button" class="remove-entity" data-index="${i}">Entfernen</button>
        </div>`;
      });

      html += `
        <div class="add-entity">
          <button type="button" id="room-plan-add-entity">+ Entität hinzufügen</button>
        </div>
        <label>Vorschau – Entitäten auf dem Plan verschieben</label>
        <div class="editor-preview" id="room-plan-preview">
          <img id="room-plan-preview-img" src="${img || ''}" alt="Vorschau" onerror="this.style.display='none'" />
          ${(img ? entities.map((ent, i) => {
            const x = Math.min(100, Math.max(0, Number(ent.x) || 50));
            const y = Math.min(100, Math.max(0, Number(ent.y) || 50));
            const icon = ent.icon || getEntityIcon(this._hass, ent.entity);
            return `<div class="editor-dot" data-index="${i}" style="left:${x}%;top:${y}%;" title="${ent.entity}"><ha-icon icon="${icon}"></ha-icon></div>`;
          }).join('') : '')}
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

      // Drag & Drop auf den Punkten im Vorschau-Bereich
      if (preview) {
        preview.querySelectorAll('.editor-dot').forEach(dot => {
          dot.addEventListener('mousedown', (e) => this._startDrag(e, dot));
        });
      }

      document.addEventListener('mousemove', (e) => this._onDrag(e));
      document.addEventListener('mouseup', () => this._endDrag());
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
      const idx = parseInt(dot.dataset.index, 10);
      const ent = this._config.entities[idx];
      if (!ent) return;
      const rect = dot.parentElement.getBoundingClientRect();
      const leftPct = (ev.clientX - rect.left) / rect.width * 100;
      const topPct = (ev.clientY - rect.top) / rect.height * 100;
      this._dragOffset = { x: leftPct - (Number(ent.x) || 50), y: topPct - (Number(ent.y) || 50) };
      this._dragging = { index: idx, element: dot };
    }

    _onDrag(ev) {
      if (!this._dragging) return;
      const preview = this.querySelector('#room-plan-preview');
      if (!preview) return;
      const rect = preview.getBoundingClientRect();
      let x = (ev.clientX - rect.left) / rect.width * 100 - this._dragOffset.x;
      let y = (ev.clientY - rect.top) / rect.height * 100 - this._dragOffset.y;
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
