/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant, hasConfigOrEntityChanged, LovelaceCardEditor } from 'custom-card-helpers';

import type { RoomPlanCardConfig, RoomPlanEntity } from './types';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

const CARD_TAG = 'room-plan-card';
const EDITOR_TAG = 'room-plan-editor';

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
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
        : (config?.image as any)?.location || (config?.image as string) || '';
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
      const shadow = (haCard as any).shadowRoot;
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
      const shadow = (el as any).shadowRoot;
      shadow?.querySelectorAll?.('ha-card')?.forEach?.((haCard: HTMLElement) => {
        styleTransparent(haCard);
        injectShadowStyle(haCard);
      });
      el = el.parentElement || ((el.getRootNode?.() as ShadowRoot)?.host ?? null);
    }
  }

  private _handleEntityClick(entityId: string): void {
    const ev = new Event('hass-more-info', { bubbles: true, composed: true });
    (ev as any).detail = { entityId };
    this.dispatchEvent(ev);
  }

  private _renderEntity(ent: RoomPlanEntity): TemplateResult {
    const x = Math.min(100, Math.max(0, Number(ent.x) || 50));
    const y = Math.min(100, Math.max(0, Number(ent.y) || 50));
    const scale = Math.min(2, Math.max(0.3, Number(ent.scale) || 1));
    const state = this.hass?.states?.[ent.entity]?.state;
    const stateClass = state === 'on' ? ' state-on' : '';
    const baseSize = 44;
    const size = Math.round(baseSize * scale);
    const iconSize = Math.round(24 * scale);
    let entStyle = `left:${x}%;top:${y}%;width:${size}px;height:${size}px;`;
    if (ent.color) entStyle += `background:${ent.color};color:#fff;`;
    const icon = ent.icon || getEntityIcon(this.hass, ent.entity);
    const title = `${getFriendlyName(this.hass, ent.entity)}: ${getStateDisplay(this.hass, ent.entity)}`;

    return html`
      <div
        class="room-plan-entity${stateClass}"
        data-entity="${ent.entity}"
        style="${entStyle}"
        title="${title}"
        @click=${() => this._handleEntityClick(ent.entity)}
      >
        <ha-icon icon="${icon}" style="--mdc-icon-size:${iconSize}px;"></ha-icon>
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
        <div class="room-plan-config-prompt">
          <ha-icon icon="mdi:cog"></ha-icon>
          <p><strong>Interaktiver Raumplan</strong></p>
          <p>${localize('common.configure')}</p>
        </div>
      `;
    }

    return html`
      <div class="room-plan-ha-card">
        <div class="room-plan-container">
          ${title ? html`<div class="room-plan-title">${title}</div>` : ''}
          <div class="room-plan-wrapper">
            <div class="room-plan-inner" style="transform: rotate(${rotation}deg); aspect-ratio: 16/9;">
              <img src="${img}" alt="Raumplan" class="room-plan-img" @load=${this._onImageLoad} />
              <div class="room-plan-theme-tint"></div>
              <div class="room-plan-overlay">
                ${entities.map((ent) => this._renderEntity(ent))}
              </div>
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
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        max-width: 100%;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        box-sizing: border-box;
        background: none !important;
      }

      .room-plan-ha-card {
        padding: 0 !important;
        overflow: hidden !important;
        flex: 1 1 0;
        min-height: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: none !important;
      }

      .room-plan-container {
        position: relative;
        flex: 1 1 0;
        min-height: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: none !important;
      }

      .room-plan-wrapper {
        position: relative;
        flex: 1 1 0;
        min-height: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none !important;
      }

      .room-plan-inner {
        position: relative;
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        height: auto;
        min-height: 0;
        background: none !important;
      }

      .room-plan-inner > img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
        filter: brightness(0.92) contrast(1.05) saturate(0.9);
      }

      .room-plan-theme-tint {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background: var(--primary-color, #03a9f4);
        opacity: 0.06;
        mix-blend-mode: overlay;
      }

      .room-plan-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }

      .room-plan-overlay > * {
        pointer-events: auto;
      }

      .room-plan-entity {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--card-background-color, var(--ha-card-background, #1e1e1e));
        color: var(--primary-text-color, #e1e1e1);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2;
        border: 3px solid rgba(255, 255, 255, 0.15);
        transition: transform 0.15s;
      }

      .room-plan-entity:hover {
        transform: translate(-50%, -50%) scale(1.1);
      }

      .room-plan-entity.state-on {
        color: var(--state-icon-on-color, var(--state-icon-active-color, #ffc107)) !important;
      }

      .room-plan-config-prompt {
        padding: 24px;
        text-align: center;
        color: var(--secondary-text-color);
      }

      .room-plan-config-prompt ha-icon {
        font-size: 48px;
        margin-bottom: 16px;
        display: block;
      }

      .room-plan-title {
        padding: 8px 16px;
        font-weight: 600;
        color: var(--primary-text-color, #e1e1e1);
      }
    `;
  }
}

console.info(
  `%c  RAUMPLAN-CARD  %c  ${localize('common.version')} ${CARD_VERSION}  `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);
