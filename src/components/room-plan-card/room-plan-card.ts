/**
 * Interaktiver Raumplan – Lovelace-Karte
 */
import { LitElement, html, css, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, hasConfigOrEntityChanged, type LovelaceCardEditor } from 'custom-card-helpers';

import type { RoomPlanCardConfig, RoomPlanEntity } from '../../lib/types';
import { CARD_VERSION } from '../../lib/const';
import { localize } from '../../lib/localize/localize';
import { getEntityIcon, getFriendlyName, getStateDisplay } from '../../lib/utils';

import '../room-plan-editor/room-plan-editor';

const CARD_TAG = 'room-plan-card';
const EDITOR_TAG = 'room-plan-editor';

declare global {
  interface Window {
    customCards: Array<{ type: string; name: string; description: string; preview?: boolean }>;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'custom:' + CARD_TAG,
  name: 'Interaktiver Raumplan',
  description: 'Raumplan als Bild mit Entitäten per Koordinaten (x,y). Kreise mit Icons.',
  preview: false,
});

@customElement(CARD_TAG)
export class RoomPlanCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config: RoomPlanCardConfig = {
    type: '',
    image: '',
    entities: [],
  };

  @state() private _imageLoaded = false;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement(EDITOR_TAG);
  }

  public static getStubConfig(): Record<string, unknown> {
    return {
      image: '/local/raumplan.png',
      rotation: 0,
      entities: [
        { entity: 'light.example', x: 25, y: 30, scale: 1, color: '#ffc107' },
        { entity: 'sensor.example', x: 75, y: 40, scale: 1 },
      ],
    };
  }

  public setConfig(config: RoomPlanCardConfig): void {
    const img =
      config?.image && typeof config.image === 'string'
        ? config.image
        : (config?.image as { location?: string })?.location ?? '';
    this.config = {
      type: config?.type ?? 'custom:room-plan-card',
      image: img,
      entities: Array.isArray(config?.entities) ? config.entities : [],
      title: config?.title ?? '',
      rotation: Number(config?.rotation) ?? 0,
    };
  }

  public getCardSize(): number {
    return 4;
  }

  public getGridOptions(): Record<string, number> {
    return { rows: 4, columns: 6, min_rows: 3, min_columns: 3 };
  }

  protected shouldUpdate(changedProps: Map<string, unknown>): boolean {
    return !!this.config && hasConfigOrEntityChanged(this, changedProps, false);
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.closest('.element-preview')) {
      this.style.display = 'none';
    }
  }

  private _handleEntityClick(entityId: string): void {
    this.dispatchEvent(
      new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId } }),
    );
  }

  private _renderEntity(ent: RoomPlanEntity): TemplateResult {
    const x = Math.min(100, Math.max(0, Number(ent.x) ?? 50));
    const y = Math.min(100, Math.max(0, Number(ent.y) ?? 50));
    const scale = Math.min(2, Math.max(0.3, Number(ent.scale) ?? 1));
    const isOn = this.hass?.states?.[ent.entity]?.state === 'on';
    const size = Math.round(48 * scale);
    const iconSize = Math.round(26 * scale);
    const icon = ent.icon || getEntityIcon(this.hass, ent.entity);
    const title = `${getFriendlyName(this.hass, ent.entity)}: ${getStateDisplay(this.hass, ent.entity)}`;

    return html`
      <div
        class="entity-badge ${isOn ? 'entity-on' : ''}"
        style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;--icon-size:${iconSize}px;${ent.color ? `--entity-color:${ent.color}` : ''}"
        title="${title}"
        @click=${() => this._handleEntityClick(ent.entity)}
      >
        <div class="entity-badge-inner">
          <ha-icon icon="${icon}"></ha-icon>
          ${isOn ? html`<span class="entity-pulse"></span>` : ''}
        </div>
      </div>
    `;
  }

  private _onImageLoad(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w && h && img.parentElement) {
      img.parentElement.style.aspectRatio = `${w}/${h}`;
    }
    this._imageLoaded = true;
  }

  protected render(): TemplateResult {
    if (this.closest('.element-preview')) return html``;

    const { image: img, entities, title, rotation } = this.config;

    if (!img) {
      return html`
        <ha-card header="${title || 'Interaktiver Raumplan'}">
          <div class="empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <p>${localize('common.configure')}</p>
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card .header=${title || undefined}>
        <div class="card-content">
          <div class="image-wrapper" style="transform: rotate(${rotation}deg); aspect-ratio: 16/9;">
            <img
              src="${img}"
              alt="Raumplan"
              class="plan-image"
              @load=${this._onImageLoad}
              ?hidden=${!this._imageLoaded}
            />
            ${!this._imageLoaded ? html`<div class="image-skeleton"></div>` : ''}
            <div class="entities-overlay">
              ${(entities ?? []).map((ent) => this._renderEntity(ent))}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host { display: block; }
      .card-content { padding: 0; overflow: hidden; }
      .image-wrapper { position: relative; max-width: 100%; overflow: hidden; }
      .plan-image { width: 100%; height: 100%; object-fit: contain; object-position: center; display: block; }
      .image-skeleton {
        position: absolute; inset: 0;
        background: var(--ha-card-background, #1e1e1e);
        animation: pulse 1.5s ease-in-out infinite;
      }
      @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.4; } }
      .entities-overlay { position: absolute; inset: 0; pointer-events: none; }
      .entities-overlay > * { pointer-events: auto; }
      .entity-badge {
        position: absolute; transform: translate(-50%, -50%);
        cursor: pointer; z-index: 2; transition: transform 0.2s;
      }
      .entity-badge:hover { transform: translate(-50%, -50%) scale(1.1); }
      .entity-badge-inner {
        width: 100%; height: 100%; border-radius: 50%;
        background: var(--entity-color, var(--card-background-color, #2d2d2d));
        color: var(--primary-text-color, #e1e1e1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        display: flex; align-items: center; justify-content: center;
      }
      .entity-badge ha-icon { --mdc-icon-size: var(--icon-size, 26px); }
      .entity-badge.entity-on .entity-badge-inner {
        color: var(--state-icon-on-color, var(--state-icon-active-color, #ffc107));
      }
      .entity-pulse {
        position: absolute; inset: -4px; border-radius: 50%;
        border: 2px solid var(--state-icon-on-color, #ffc107);
        opacity: 0.5; animation: entity-pulse 2s ease-out infinite;
      }
      @keyframes entity-pulse { 0% { transform: scale(0.9); opacity: 0.6; } 100% { transform: scale(1.2); opacity: 0; } }
      .empty-state { padding: 48px 24px; text-align: center; }
      .empty-state ha-icon { font-size: 64px; color: var(--secondary-text-color); display: block; margin-bottom: 16px; }
      .empty-state p { margin: 0; color: var(--secondary-text-color); }
    `;
  }
}

console.info(`%c RAUMPLAN v${CARD_VERSION}`, 'color: #03a9f4; font-weight: bold');
