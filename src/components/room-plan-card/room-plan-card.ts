/**
 * Interaktiver Raumplan – Lovelace-Karte
 * Funktional orientiert an ha-floorplan (tap_action, hold_action, double_tap_action)
 */
import { LitElement, html, css, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  handleAction,
  hasAction,
  type LovelaceCardEditor,
  type ActionHandlerEvent,
  forwardHaptic,
} from 'custom-card-helpers';

import type { RoomPlanCardConfig, RoomPlanEntity } from '../../lib/types';
import { CARD_VERSION } from '../../lib/const';
import { localize } from '../../lib/localize/localize';
import { getEntityIcon, getFriendlyName, getStateDisplay } from '../../lib/utils';
import { actionHandler } from '../../lib/action-handler';

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
  @state() private _imageError = false;
  /** Lokaler Filter-State (Filter-Buttons auf der Karte) */
  @state() private _activeFilter: string[] = [];

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
      full_height: config?.full_height ?? false,
      tap_action: config?.tap_action,
      hold_action: config?.hold_action,
      double_tap_action: config?.double_tap_action,
      entity_filter: Array.isArray(config?.entity_filter) ? config.entity_filter : undefined,
    };
    this._activeFilter = Array.isArray(config?.entity_filter) ? [...config.entity_filter] : [];
    this._imageLoaded = false;
    this._imageError = false;
  }

  private _getEntityDomain(entityId: string): string {
    const idx = entityId.indexOf('.');
    return idx > 0 ? entityId.slice(0, idx) : '';
  }

  private _filteredEntities(): RoomPlanEntity[] {
    const entities = this.config?.entities ?? [];
    const filter = this._activeFilter.length > 0 ? this._activeFilter : (this.config?.entity_filter ?? []);
    if (!filter || filter.length === 0) return entities;
    return entities.filter((ent) => filter.includes(this._getEntityDomain(ent.entity)));
  }

  private _availableDomains(): string[] {
    const entities = this.config?.entities ?? [];
    const doms = new Set<string>();
    entities.forEach((e) => {
      const d = this._getEntityDomain(e.entity);
      if (d) doms.add(d);
    });
    return Array.from(doms).sort();
  }

  private _toggleFilter(domain: string): void {
    this._activeFilter = this._activeFilter.includes(domain)
      ? this._activeFilter.filter((d) => d !== domain)
      : [...this._activeFilter, domain].sort();
  }

  public getCardSize(): number {
    return this.config?.full_height ? 1 : 4;
  }

  public getGridOptions(): Record<string, number> {
    return this.config?.full_height
      ? { rows: 1, columns: 1, min_rows: 1, min_columns: 1 }
      : { rows: 4, columns: 6, min_rows: 3, min_columns: 3 };
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

  private _getEntityActionConfig(ent: RoomPlanEntity): {
    entity: string;
    tap_action?: import('custom-card-helpers').ActionConfig;
    hold_action?: import('custom-card-helpers').ActionConfig;
    double_tap_action?: import('custom-card-helpers').ActionConfig;
  } {
    const def = this.config?.tap_action ?? { action: 'more-info' as const };
    return {
      entity: ent.entity,
      tap_action: ent.tap_action ?? this.config?.tap_action ?? def,
      hold_action: ent.hold_action ?? this.config?.hold_action,
      double_tap_action: ent.double_tap_action ?? this.config?.double_tap_action,
    };
  }

  private _handleEntityAction(ev: ActionHandlerEvent, ent: RoomPlanEntity): void {
    const config = this._getEntityActionConfig(ent);
    if (this.hass && ev.detail?.action) {
      handleAction(this, this.hass, config, ev.detail.action);
      forwardHaptic('light');
    }
  }

  private _renderEntity(ent: RoomPlanEntity): TemplateResult {
    const x = Math.min(100, Math.max(0, Number(ent.x) ?? 50));
    const y = Math.min(100, Math.max(0, Number(ent.y) ?? 50));
    const scale = Math.min(2, Math.max(0.3, Number(ent.scale) ?? 1));
    const isOn = this.hass?.states?.[ent.entity]?.state === 'on';
    const icon = ent.icon || getEntityIcon(this.hass, ent.entity);
    const title = `${getFriendlyName(this.hass, ent.entity)}: ${getStateDisplay(this.hass, ent.entity)}`;

    const actionConfig = this._getEntityActionConfig(ent);
    const hasHold = hasAction(actionConfig.hold_action);
    const hasDbl = hasAction(actionConfig.double_tap_action);

    return html`
      <div
        class="entity-badge ${isOn ? 'entity-on' : ''}"
        style="left:${x}%;top:${y}%;--entity-scale:${scale};${ent.color ? `--entity-color:${ent.color}` : ''}"
        title="${title}"
        tabindex="0"
        role="button"
        .actionHandler=${actionHandler({ hasHold, hasDoubleClick: hasDbl })}
        @action=${(e: ActionHandlerEvent) => this._handleEntityAction(e, ent)}
      >
        <div class="entity-badge-inner">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
      </div>
    `;
  }

  private _onImageLoad(): void {
    this._imageLoaded = true;
    this._imageError = false;
  }

  private _onImageError(): void {
    this._imageError = true;
    this._imageLoaded = false;
  }

  protected render(): TemplateResult {
    if (this.closest('.element-preview')) return html``;

    const { image: img, entities, title, rotation } = this.config;

    if (!img) {
      return html`
        <ha-card>
          <div class="empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <p>${localize('common.configure')}</p>
          </div>
        </ha-card>
      `;
    }

    const domains = this._availableDomains();
    const showFilterBar = domains.length > 0;

    return html`
      <ha-card class=${this.config?.full_height ? 'full-height' : ''}>
        <div class="card-content">
          ${showFilterBar
            ? html`
                <div class="filter-bar">
                  ${domains.map(
                    (d) => html`
                      <button
                        type="button"
                        class="filter-chip ${this._activeFilter.includes(d) ? 'active' : ''}"
                        @click=${() => this._toggleFilter(d)}
                      >
                        ${d}
                      </button>
                    `,
                  )}
                </div>
              `
            : ''}
          <div class="image-wrapper" style="transform: rotate(${rotation}deg);">
            <img
              src="${img}"
              alt="Raumplan"
              class="plan-image"
              @load=${this._onImageLoad}
              @error=${this._onImageError}
            />
            ${!this._imageLoaded && !this._imageError ? html`<div class="image-skeleton" aria-hidden="true"></div>` : ''}
            ${this._imageError ? html`<div class="image-error">Bild konnte nicht geladen werden</div>` : ''}
            <div class="entities-overlay">
              ${this._filteredEntities().map((ent) => this._renderEntity(ent))}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        height: 100%;
        min-height: 0;
        box-sizing: border-box;
      }
      ha-card {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        width: 100%;
        height: 100%;
        min-height: 0;
        box-sizing: border-box;
      }
      ha-card.full-height {
        flex: 1;
        min-height: 0;
      }
      .card-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        padding: 0;
        overflow: hidden;
        width: 100%;
        box-sizing: border-box;
      }
      .filter-bar {
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 12px;
        background: var(--ha-card-background, #1e1e1e);
        border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.12));
      }
      .filter-chip {
        padding: 4px 12px;
        border-radius: 16px;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
        background: var(--card-background-color, #2d2d2d);
        color: var(--primary-text-color, #e1e1e1);
        font-size: 0.8rem;
        cursor: pointer;
      }
      .filter-chip:hover {
        border-color: var(--primary-color, #03a9f4);
      }
      .filter-chip.active {
        background: var(--primary-color, #03a9f4);
        border-color: var(--primary-color, #03a9f4);
      }
      .image-error {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ha-card-background, #1e1e1e);
        color: var(--secondary-text-color);
        font-size: 0.9rem;
      }
      .image-wrapper {
        position: relative;
        flex: 1;
        min-height: 0;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .plan-image {
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
      }
      .image-skeleton {
        position: absolute;
        inset: 0;
        background: var(--ha-card-background, #1e1e1e);
      }
      .entities-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        width: 100%;
        height: 100%;
      }
      .entities-overlay > * {
        pointer-events: auto;
      }
      .entity-badge {
        --size: clamp(28px, 8vw, 48px);
        --icon-size: calc(clamp(16px, 4.5vw, 26px) * var(--entity-scale, 1));
        position: absolute;
        transform: translate(-50%, -50%);
        width: calc(var(--size) * var(--entity-scale, 1));
        height: calc(var(--size) * var(--entity-scale, 1));
        min-width: 20px;
        min-height: 20px;
        cursor: pointer;
        z-index: 2;
        transition: transform 0.2s ease;
      }
      .entity-badge:hover {
        transform: translate(-50%, -50%) scale(1.08);
      }
      .entity-badge-inner {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: var(--entity-color, var(--card-background-color, #2d2d2d));
        color: var(--primary-text-color, #e1e1e1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .entity-badge ha-icon {
        --mdc-icon-size: var(--icon-size);
        width: var(--icon-size);
        height: var(--icon-size);
      }
      .entity-badge.entity-on .entity-badge-inner {
        color: var(--state-icon-on-color, var(--state-icon-active-color, #ffc107));
      }
      .entity-badge,
      .entity-badge *,
      .entity-badge-inner,
      .entity-badge ha-icon {
        animation: none !important;
      }
      .empty-state {
        padding: clamp(24px, 6vw, 48px) clamp(16px, 4vw, 24px);
        text-align: center;
      }
      .empty-state ha-icon {
        font-size: clamp(48px, 12vw, 64px);
        color: var(--secondary-text-color);
        display: block;
        margin-bottom: 16px;
      }
      .empty-state p {
        margin: 0;
        color: var(--secondary-text-color);
        font-size: clamp(0.9rem, 2.5vw, 1rem);
      }
      @media (max-width: 480px) {
        .entity-badge {
          --size: clamp(24px, 10vw, 40px);
          --icon-size: clamp(14px, 5vw, 22px);
        }
      }
    `;
  }
}

console.info(`%c RAUMPLAN v${CARD_VERSION}`, 'color: #03a9f4; font-weight: bold');
