/**
 * Editor für die Raumplan-Karte
 */
import { LitElement, html, css, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, fireEvent, type LovelaceCardEditor } from 'custom-card-helpers';

import type { RoomPlanCardConfig, RoomPlanEntity } from '../../lib/types';
import { getFriendlyName } from '../../lib/utils';

@customElement('room-plan-editor')
export class RoomPlanEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config: RoomPlanCardConfig = {
    type: '',
    image: '',
    entities: [],
  };

  public setConfig(config: RoomPlanCardConfig): void {
    const base = config ?? { type: '', image: '', entities: [] };
    const img =
      typeof base.image === 'string'
        ? base.image
        : ((base.image as { location?: string } | undefined)?.location ?? '');
    this._config = {
      ...base,
      image: img,
      entities: Array.isArray(base.entities) ? [...base.entities] : [],
      entity_filter: Array.isArray(base.entity_filter) ? base.entity_filter : undefined,
    };
  }

  private _emitConfig(): void {
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _updateConfig(updates: Partial<RoomPlanCardConfig>): void {
    this._config = { ...this._config, ...updates };
    this._emitConfig();
  }

  private _updateEntity(index: number, updates: Partial<RoomPlanEntity>): void {
    const entities = [...(this._config.entities ?? [])];
    entities[index] = { ...entities[index], ...updates };
    this._updateConfig({ entities });
  }

  private _removeEntity(index: number): void {
    const entities = [...(this._config.entities ?? [])];
    entities.splice(index, 1);
    this._updateConfig({ entities });
  }

  private _addEntity(): void {
    const entities = [...(this._config.entities ?? []), { entity: '', x: 50, y: 50 }];
    this._updateConfig({ entities });
  }

  protected render(): TemplateResult {
    const img = typeof this._config.image === 'string' ? this._config.image : '';
    const title = this._config.title ?? '';
    const rotation = Number(this._config.rotation) ?? 0;
    const entities = this._config.entities ?? [];
    const entityIds = this.hass?.states ? Object.keys(this.hass.states).sort() : [];

    return html`
      <div class="editor">
        <section class="editor-section">
          <h4 class="section-title"><ha-icon icon="mdi:image"></ha-icon> Bild</h4>
          <div class="field">
            <label>Bild-URL</label>
            <input type="text" .value=${img} placeholder="/local/raumplan.png"
              @change=${(e: Event) => this._updateConfig({ image: (e.target as HTMLInputElement).value.trim() })} />
            <span class="hint">Bild unter <code>config/www/</code> speichern, dann <code>/local/dateiname.png</code> angeben.</span>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Titel</label>
              <input type="text" .value=${title} placeholder="Optional" @change=${(e: Event) => this._updateConfig({ title: (e.target as HTMLInputElement).value.trim() })} />
            </div>
            <div class="field">
              <label>Drehung</label>
              <select .value=${String(rotation)} @change=${(e: Event) => this._updateConfig({ rotation: Number((e.target as HTMLSelectElement).value) })}>
                <option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option>
              </select>
            </div>
          </div>
        </section>
        <section class="editor-section">
          <h4 class="section-title"><ha-icon icon="mdi:map-marker"></ha-icon> Entitäten</h4>
          <p class="section-hint">X/Y = Position (0–100), Skalierung, Icon optional (z.B. mdi:lightbulb).</p>
          <div class="entity-list">
            ${entities.map((ent, i) => html`
              <div class="entity-row">
                <input type="text" list="rp-entities-${i}" .value=${ent.entity} placeholder="light.wohnzimmer"
                  @change=${(e: Event) => this._updateEntity(i, { entity: (e.target as HTMLInputElement).value.trim() })} />
                <datalist id="rp-entities-${i}">
                  ${entityIds.slice(0, 200).map((eid) => html`<option value="${eid}">${getFriendlyName(this.hass, eid)}</option>`)}
                </datalist>
                <input type="text" class="entity-icon" .value=${ent.icon ?? ''} placeholder="Icon (mdi:...)"
                  title="Icon (optional)"
                  @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); this._updateEntity(i, { icon: v || undefined }); }} />
                <div class="entity-coords">
                  <input type="number" min="0" max="100" step="0.1" .value=${String(Number(ent.x) || 50)} title="X (%)"
                    @change=${(e: Event) => this._updateEntity(i, { x: Math.min(100, Math.max(0, Number((e.target as HTMLInputElement).value) || 50)) })} />
                  <input type="number" min="0" max="100" step="0.1" .value=${String(Number(ent.y) || 50)} title="Y (%)"
                    @change=${(e: Event) => this._updateEntity(i, { y: Math.min(100, Math.max(0, Number((e.target as HTMLInputElement).value) || 50)) })} />
                </div>
                <input type="number" class="entity-scale" min="0.3" max="2" step="0.1" .value=${String(Math.min(2, Math.max(0.3, Number(ent.scale) || 1)))} title="Skalierung"
                  @change=${(e: Event) => this._updateEntity(i, { scale: Math.min(2, Math.max(0.3, Number((e.target as HTMLInputElement).value) || 1)) })} />
                <input type="color" .value=${ent.color || '#03a9f4'} title="Farbe"
                  @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; this._updateEntity(i, { color: v === '#03a9f4' && !ent.color ? undefined : v }); }} />
                <input type="number" class="entity-opacity" min="0" max="1" step="0.1" .value=${String(Math.min(1, Math.max(0, Number(ent.background_opacity) ?? 1)))} title="Deckkraft"
                  @change=${(e: Event) => this._updateEntity(i, { background_opacity: Math.min(1, Math.max(0, Number((e.target as HTMLInputElement).value) || 1)) })} />
                <label class="entity-check">
                  <input type="checkbox" .checked=${!!ent.show_value} title="Wert anzeigen"
                    @change=${(e: Event) => this._updateEntity(i, { show_value: (e.target as HTMLInputElement).checked })} />
                  Wert
                </label>
                <button type="button" class="btn-remove" @click=${() => this._removeEntity(i)} title="Entfernen">
                  <ha-icon icon="mdi:delete-outline"></ha-icon>
                </button>
              </div>
            `)}
          </div>
          <button type="button" class="btn-add" @click=${this._addEntity}>
            <ha-icon icon="mdi:plus"></ha-icon> Entität hinzufügen
          </button>
        </section>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }
      .editor {
        padding: clamp(12px, 3vw, 20px);
        max-width: 560px;
        width: 100%;
        box-sizing: border-box;
      }
      .editor * {
        box-sizing: border-box;
      }
      .editor-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
      }
      .editor-header ha-icon {
        color: var(--primary-color, #03a9f4);
        flex-shrink: 0;
      }
      .editor-header h3 {
        margin: 0;
        font-size: clamp(1rem, 2.5vw, 1.1rem);
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .editor-section {
        margin-bottom: 28px;
      }
      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 0 0 12px;
        font-size: clamp(0.9rem, 2.2vw, 0.95rem);
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .section-title ha-icon {
        color: var(--primary-color, #03a9f4);
        flex-shrink: 0;
      }
      .section-hint {
        margin: 0 0 12px;
        font-size: clamp(0.8rem, 2vw, 0.85rem);
        color: var(--secondary-text-color);
        line-height: 1.4;
      }
      .field {
        margin-bottom: 16px;
      }
      .field-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 16px;
      }
      @media (max-width: 480px) {
        .field-row {
          grid-template-columns: 1fr;
        }
      }
      .field label {
        display: block;
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--secondary-text-color);
        margin-bottom: 6px;
      }
      .field input,
      .field select {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        background: var(--ha-card-background, #1e1e1e);
        color: var(--primary-text-color);
        font-size: clamp(14px, 3.5vw, 16px);
      }
      .field input:focus,
      .field select:focus {
        outline: none;
        border-color: var(--primary-color, #03a9f4);
      }
      .hint {
        display: block;
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        margin-top: 6px;
      }
      .hint code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
      }
      .entity-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .entity-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: var(--ha-card-background, #1e1e1e);
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 10px;
      }
      .entity-row input,
      .entity-row select,
      .entity-row button {
        padding: 8px 10px;
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        background: var(--ha-card-background, #1e1e1e);
        color: var(--primary-text-color, #e1e1e1);
        font-size: 14px;
        font-family: inherit;
      }
      .entity-row input:focus,
      .entity-row select:focus {
        outline: none;
        border-color: var(--primary-color, #03a9f4);
      }
      .entity-row input[list],
      .entity-row input[type='text'] {
        flex: 1 1 140px;
        min-width: 0;
      }
      .entity-row input.entity-icon {
        width: clamp(90px, 22vw, 120px);
      }
      .entity-coords {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      .entity-coords input {
        width: clamp(44px, 12vw, 52px);
      }
      .entity-row input.entity-scale {
        width: clamp(50px, 14vw, 60px);
      }
      .entity-row input.entity-opacity {
        width: 56px;
      }
      .entity-row .entity-check {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: var(--secondary-text-color);
        cursor: pointer;
        white-space: nowrap;
      }
      .entity-row .entity-check input[type='checkbox'] {
        width: auto;
        padding: 0;
      }
      .entity-row input[type='color'] {
        width: 36px;
        height: 36px;
        min-width: 36px;
        padding: 2px;
        cursor: pointer;
      }
      .btn-remove {
        padding: 8px 10px;
        border: none;
        border-radius: 8px;
        background: rgba(244, 67, 54, 0.15);
        color: #f44336;
        cursor: pointer;
        flex-shrink: 0;
      }
      .btn-remove:hover {
        background: rgba(244, 67, 54, 0.3);
      }
      .btn-add {
        padding: 12px 18px;
        width: 100%;
        margin-top: 12px;
        border: 2px dashed var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 10px;
        background: transparent;
        color: var(--primary-color, #03a9f4);
        font-size: clamp(13px, 3.2vw, 14px);
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .btn-add:hover {
        border-color: var(--primary-color, #03a9f4);
        background: rgba(3, 169, 244, 0.08);
      }
    `;
  }
}
