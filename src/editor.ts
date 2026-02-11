/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import type { RoomPlanCardConfig, RoomPlanEntity } from './types';

function getFriendlyName(hass: HomeAssistant | undefined, entityId: string): string {
  const state = hass?.states?.[entityId];
  return state?.attributes?.friendly_name || entityId;
}

@customElement('room-plan-editor')
export class RoomPlanEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config: RoomPlanCardConfig = {
    type: '',
    image: '',
    entities: [],
  };

  public setConfig(config: RoomPlanCardConfig): void {
    const next = config
      ? {
          ...config,
          image: typeof config.image === 'string' ? config.image : (config.image as any)?.location || '',
          entities: Array.isArray(config.entities) ? [...config.entities] : [],
        }
      : { type: '', image: '', entities: [] };
    this._config = next;
  }

  private _fireConfigChanged(cfg: RoomPlanCardConfig): void {
    fireEvent(this, 'config-changed', { config: cfg });
  }

  private _imageChanged(ev: Event): void {
    const target = ev.target as HTMLInputElement;
    const v = target.value.trim();
    this._config = { ...this._config, image: v };
    this._fireConfigChanged(this._config);
  }

  private _syncEntities(): void {
    const rows = this.shadowRoot?.querySelectorAll('.rp-entity-row');
    if (!rows) return;
    const entities: RoomPlanEntity[] = [];
    rows.forEach((row, i) => {
      const entityInput = row.querySelector('input[data-field="entity"]') as HTMLInputElement;
      const xInput = row.querySelector('input[data-field="x"]') as HTMLInputElement;
      const yInput = row.querySelector('input[data-field="y"]') as HTMLInputElement;
      const scaleInput = row.querySelector('input[data-field="scale"]') as HTMLInputElement;
      const colorInput = row.querySelector('input[data-field="color"]') as HTMLInputElement;
      const ent: RoomPlanEntity = this._config.entities?.[i] ?? { entity: '' };
      const x = xInput ? Math.min(100, Math.max(0, Number(xInput.value) || 50)) : ent.x ?? 50;
      const y = yInput ? Math.min(100, Math.max(0, Number(yInput.value) || 50)) : ent.y ?? 50;
      const scale = scaleInput ? Math.min(2, Math.max(0.3, Number(scaleInput.value) || 1)) : ent.scale ?? 1;
      const colorVal = colorInput?.value?.trim() || '';
      const hadColor = !!ent.color;
      const color = colorVal && (colorVal !== '#03a9f4' || hadColor) ? colorVal : undefined;
      entities.push({
        entity: (entityInput?.value || '').trim() || ent.entity || '',
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        icon: ent.icon,
        scale,
        color,
      });
    });
    this._config = { ...this._config, entities };
    this._fireConfigChanged(this._config);
  }

  private _removeEntity(i: number): void {
    const entities = [...(this._config.entities || [])];
    entities.splice(i, 1);
    this._config = { ...this._config, entities };
    this._fireConfigChanged(this._config);
  }

  private _addEntity(): void {
    const entities = [...(this._config.entities || []), { entity: '', x: 50, y: 50 }];
    this._config = { ...this._config, entities };
    this._fireConfigChanged(this._config);
  }

  protected render(): TemplateResult {
    const img = typeof this._config.image === 'string' ? this._config.image : (this._config.image as any)?.location || '';
    const entities = this._config.entities || [];
    const entityIds = this.hass?.states ? Object.keys(this.hass.states).sort() : [];

    return html`
      <div class="rp-editor">
        <div class="rp-section">
          <div class="rp-section-title">
            <ha-icon icon="mdi:image"></ha-icon>
            Raumplan-Bild
          </div>
          <div class="rp-field">
            <label>Bild-URL</label>
            <input
              type="text"
              .value=${img}
              placeholder="/local/raumplan.png"
              @change=${this._imageChanged}
            />
            <div class="rp-hint">
              Bild unter <code>config/www/</code> speichern, dann <code>/local/dateiname.png</code> angeben.
            </div>
          </div>
        </div>
        <div class="rp-section">
          <div class="rp-section-title">
            <ha-icon icon="mdi:format-list-bulleted"></ha-icon>
            Entitäten mit Koordinaten
          </div>
          <div class="rp-hint" style="margin-bottom: 12px;">
            X und Y = Position in Prozent (0–100), Skalierung = Größe des Kreises.
          </div>
          <div class="rp-entity-list">
            ${entities.map(
              (ent, i) => html`
                <div class="rp-entity-row" data-index="${i}">
                  <input
                    type="text"
                    data-field="entity"
                    list="rp-entity-list-${i}"
                    .value=${ent.entity}
                    placeholder="light.wohnzimmer"
                    @change=${() => this._syncEntities()}
                  />
                  <datalist id="rp-entity-list-${i}">
                    ${entityIds.slice(0, 200).map((eid) => html`<option value="${eid}">${getFriendlyName(this.hass, eid)}</option>`)}
                  </datalist>
                  <input
                    type="number"
                    data-field="x"
                    min="0"
                    max="100"
                    step="0.1"
                    .value=${String(Number(ent.x) || 50)}
                    placeholder="X"
                    title="X (%)"
                    @change=${() => this._syncEntities()}
                  />
                  <input
                    type="number"
                    data-field="y"
                    min="0"
                    max="100"
                    step="0.1"
                    .value=${String(Number(ent.y) || 50)}
                    placeholder="Y"
                    title="Y (%)"
                    @change=${() => this._syncEntities()}
                  />
                  <input
                    type="number"
                    data-field="scale"
                    min="0.3"
                    max="2"
                    step="0.1"
                    .value=${String(Math.min(2, Math.max(0.3, Number(ent.scale) || 1)))}
                    placeholder="1"
                    title="Skalierung"
                    @change=${() => this._syncEntities()}
                  />
                  <input
                    type="color"
                    data-field="color"
                    .value=${ent.color || '#03a9f4'}
                    title="Farbe"
                    @change=${() => this._syncEntities()}
                  />
                  <button type="button" class="rp-btn-remove" @click=${() => this._removeEntity(i)}>
                    <ha-icon icon="mdi:delete-outline"></ha-icon>
                  </button>
                </div>
              `,
            )}
          </div>
          <button type="button" class="rp-btn-add" @click=${this._addEntity}>
            <ha-icon icon="mdi:plus"></ha-icon>
            Entität hinzufügen
          </button>
        </div>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      .rp-editor {
        padding: 20px;
        max-width: 560px;
      }

      .rp-editor * {
        box-sizing: border-box;
      }

      .rp-section {
        margin-bottom: 24px;
      }

      .rp-section-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color, #e1e1e1);
      }

      .rp-section-title ha-icon {
        color: var(--primary-color, #03a9f4);
      }

      .rp-field {
        margin-bottom: 16px;
      }

      .rp-field label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color, #9e9e9e);
        margin-bottom: 6px;
      }

      .rp-field input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        background: var(--ha-card-background, #1e1e1e);
        color: var(--primary-text-color, #e1e1e1);
        font-size: 14px;
      }

      .rp-field input:focus {
        outline: none;
        border-color: var(--primary-color, #03a9f4);
      }

      .rp-hint {
        font-size: 12px;
        color: var(--secondary-text-color, #9e9e9e);
        margin-top: 6px;
        line-height: 1.4;
      }

      .rp-hint code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
      }

      .rp-entity-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .rp-entity-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: var(--ha-card-background, #1e1e1e);
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 10px;
      }

      .rp-entity-row input[data-field] {
        flex: 1;
        min-width: 120px;
        padding: 10px 12px;
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        font-size: 14px;
        background: var(--ha-card-background, #1e1e1e);
        color: var(--primary-text-color, #e1e1e1);
      }

      .rp-entity-row input[type='number'] {
        width: 70px;
        flex: none;
      }

      .rp-entity-row input[type='color'] {
        width: 36px;
        height: 36px;
        padding: 2px;
        flex: none;
        cursor: pointer;
        border-radius: 6px;
      }

      .rp-entity-row input:focus {
        outline: none;
        border-color: var(--primary-color, #03a9f4);
      }

      .rp-entity-row input[data-field='x'],
      .rp-entity-row input[data-field='y'] {
        width: 56px;
        flex: none;
      }

      .rp-btn-remove {
        padding: 8px 12px;
        border-radius: 8px;
        border: none;
        background: rgba(244, 67, 54, 0.2);
        color: #f44336;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .rp-btn-remove:hover {
        background: rgba(244, 67, 54, 0.3);
      }

      .rp-btn-add {
        padding: 12px 18px;
        border-radius: 10px;
        border: 2px dashed var(--divider-color, rgba(255, 255, 255, 0.12));
        background: transparent;
        color: var(--primary-color, #03a9f4);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        justify-content: center;
        margin-top: 12px;
      }

      .rp-btn-add:hover {
        border-color: var(--primary-color, #03a9f4);
        background: rgba(3, 169, 244, 0.08);
      }
    `;
  }
}
