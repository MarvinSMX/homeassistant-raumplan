/**
 * Interaktiver Raumplan – Karte mit Bild und positionierten Entitäten
 * Vollständig überarbeitetes Design
 */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, hasConfigOrEntityChanged, LovelaceCardEditor } from 'custom-card-helpers';

import type { RoomPlanCardConfig, RoomPlanEntity } from './types';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

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

function getEntityIcon(hass: HomeAssistant | undefined, entityId: string): string {
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

function getFriendlyName(hass: HomeAssistant | undefined, entityId: string): string {
  const state = hass?.states?.[entityId];
  return state?.attributes?.friendly_name || entityId;
}

function getStateDisplay(hass: HomeAssistant | undefined, entityId: string): string {
  const state = hass?.states?.[entityId];
  if (!state) return '—';
  const uom = state.attributes?.unit_of_measurement;
  if (uom) return state.state + ' ' + uom;
  return state.state;
}

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
    await import('./editor');
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
        : (config?.image as { location?: string })?.location || (config?.image as string) || '';
    this.config = {
      type: config?.type || 'custom:room-plan-card',
      image: img,
      entities: Array.isArray(config?.entities) ? config.entities : [],
      title: config?.title || '',
      rotation: Number(config?.rotation) || 0,
    };
  }

  public getCardSize(): number {
    return 4;
  }

  public getGridOptions(): Record<string, number> {
    return {
      rows: 4,
      columns: 6,
      min_rows: 3,
      min_columns: 3,
    };
  }

  protected shouldUpdate(changedProps: Map<string, unknown>): boolean {
    if (!this.config) return false;
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.closest('.element-preview')) {
      this.style.display = 'none';
    }
  }

  firstUpdated(): void {
    if (!this.closest('.element-preview')) {
      this._removeCardChrome();
      requestAnimationFrame(() => this._removeCardChrome());
      [100, 300, 500].forEach((t) => setTimeout(() => this._removeCardChrome(), t));
    }
  }

  updated(changedProps: Map<string, unknown>): void {
    super.updated(changedProps);
    if (!this.closest('.element-preview')) {
      this._removeCardChrome();
    }
  }

  private _removeCardChrome(): void {
    const styleTransparent = (el: HTMLElement): void => {
      el.style.setProperty('background', 'none', 'important');
      el.style.setProperty('background-color', 'transparent', 'important');
      el.style.setProperty('--ha-card-background', 'transparent', 'important');
      el.style.setProperty('--card-background-color', 'transparent', 'important');
      el.style.setProperty('border', 'none', 'important');
      el.style.setProperty('box-shadow', 'none', 'important');
      el.style.setProperty('padding', '0', 'important');
    };
    const injectShadowStyle = (haCard: HTMLElement): void => {
      const shadow = (haCard as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
      if (!shadow) return;
      if (shadow.querySelector?.('style[data-room-plan-bg]')) return;
      const style = document.createElement('style');
      style.setAttribute('data-room-plan-bg', '1');
      style.textContent =
        ':host{background:none!important;background-color:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}';
      shadow.appendChild(style);
    };
    let el: Element | null = this.parentElement ?? ((this.getRootNode?.() as ShadowRoot)?.host ?? null);
    while (el && el !== document.body) {
      styleTransparent(el as HTMLElement);
      if ((el as HTMLElement).tagName === 'HA-CARD') injectShadowStyle(el as HTMLElement);
      const shadow = (el as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
      shadow?.querySelectorAll?.('ha-card')?.forEach?.((el) => {
        styleTransparent(el as HTMLElement);
        injectShadowStyle(el as HTMLElement);
      });
      el = el.parentElement || ((el.getRootNode?.() as ShadowRoot)?.host ?? null);
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
    const state = this.hass?.states?.[ent.entity]?.state;
    const isOn = state === 'on';
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

  protected render(): TemplateResult {
    if (this.closest('.element-preview')) {
      return html``;
    }

    const img = this.config.image;
    const entities = this.config.entities || [];
    const title = this.config.title;
    const rotation = Number(this.config.rotation) || 0;

    if (!img) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
          </div>
          <h3 class="empty-state-title">Interaktiver Raumplan</h3>
          <p class="empty-state-text">${localize('common.configure')}</p>
        </div>
      `;
    }

    return html`
      <div class="card-root">
        ${title ? html`<div class="card-title">${title}</div>` : ''}
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
              ${entities.map((ent) => this._renderEntity(ent))}
            </div>
          </div>
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

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        background: none !important;
      }

      .card-root {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }

      .card-title {
        padding: 12px 20px;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--ha-card-header-color, var(--primary-text-color));
      }

      .card-content {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .image-wrapper {
        position: relative;
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        overflow: hidden;
      }

      .plan-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
      }

      .image-skeleton {
        position: absolute;
        inset: 0;
        background: var(--ha-card-background, #1e1e1e);
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 0.4; }
      }

      .entities-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .entities-overlay > * {
        pointer-events: auto;
      }

      .entity-badge {
        position: absolute;
        transform: translate(-50%, -50%);
        cursor: pointer;
        z-index: 2;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .entity-badge:hover {
        transform: translate(-50%, -50%) scale(1.12);
      }

      .entity-badge-inner {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: var(--entity-color, var(--card-background-color, #2d2d2d));
        color: var(--primary-text-color, #e1e1e1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: box-shadow 0.2s;
      }

      .entity-badge:hover .entity-badge-inner {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(255, 255, 255, 0.15);
      }

      .entity-badge ha-icon {
        --mdc-icon-size: var(--icon-size, 26px);
        position: relative;
        z-index: 1;
      }

      .entity-badge.entity-on .entity-badge-inner {
        color: var(--state-icon-on-color, var(--state-icon-active-color, #ffc107));
      }

      .entity-pulse {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 2px solid var(--state-icon-on-color, #ffc107);
        opacity: 0.5;
        animation: entity-pulse 2s ease-out infinite;
      }

      @keyframes entity-pulse {
        0% { transform: scale(0.9); opacity: 0.6; }
        100% { transform: scale(1.2); opacity: 0; }
      }

      .empty-state {
        padding: 48px 24px;
        text-align: center;
      }

      .empty-state-icon {
        margin-bottom: 20px;
      }

      .empty-state-icon ha-icon {
        font-size: 64px;
        color: var(--secondary-text-color, #9e9e9e);
        opacity: 0.7;
      }

      .empty-state-title {
        margin: 0 0 12px;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .empty-state-text {
        margin: 0;
        font-size: 0.9rem;
        color: var(--secondary-text-color);
        line-height: 1.5;
      }
    `;
  }
}

console.info(
  `%c RAUMPLAN %c v${CARD_VERSION} `,
  'color: #fff; background: #03a9f4; padding: 2px 8px; border-radius: 4px; font-weight: bold',
  'color: #fff; background: #555; padding: 2px 8px; border-radius: 4px',
);
