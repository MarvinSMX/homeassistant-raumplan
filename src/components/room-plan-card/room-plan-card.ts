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

import type { RoomPlanCardConfig, RoomPlanEntity, HeatmapZone } from '../../lib/types';
import { CARD_VERSION } from '../../lib/const';
import { localize } from '../../lib/localize/localize';
import { getEntityIcon, getFriendlyName, getStateDisplay } from '../../lib/utils';
import { actionHandler } from '../../lib/action-handler';

import '../room-plan-editor/room-plan-editor';

const CARD_TAG = 'room-plan-card';
const EDITOR_TAG = 'room-plan-editor';
/** Sentinel für den Heatmap-Tab (kein Domain-Filter) */
const HEATMAP_TAB = '__heatmap__';

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
  /** Seitenverhältnis des Bildes (width/height), damit Overlay exakt aligned */
  @state() private _imageAspect = 16 / 9;
  /** Aktiver Tab: null = Alle, sonst Domain (nur einer aktiv) */
  @state() private _activeFilter: string | null = null;
  /** Dark Mode (System/Theme), für Bild-Filter oder image_dark */
  @state() private _darkMode = false;

  private _darkModeMedia: MediaQueryList | null = null;

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
      temperature_zones: Array.isArray(config?.temperature_zones) ? config.temperature_zones : undefined,
      alert_entities: Array.isArray(config?.alert_entities) ? config.alert_entities : undefined,
      alert_badge_action: config?.alert_badge_action,
      image_dark: config?.image_dark,
      dark_mode_filter: config?.dark_mode_filter,
      dark_mode: config?.dark_mode,
    };
    const pf = config?.entity_filter;
    this._activeFilter = Array.isArray(pf) && pf.length === 1 ? pf[0] : null;
    this._imageLoaded = false;
    this._imageError = false;
    this._imageAspect = 16 / 9;
  }

  private _getEntityDomain(entityId: string): string {
    const idx = entityId.indexOf('.');
    return idx > 0 ? entityId.slice(0, idx) : '';
  }

  private _filteredEntities(): RoomPlanEntity[] {
    const entities = this.config?.entities ?? [];
    if (this._activeFilter === HEATMAP_TAB) return []; // Nur Heatmap anzeigen
    if (this._activeFilter === null || this._activeFilter === '') return entities;
    return entities.filter((ent) => this._getEntityDomain(ent.entity) === this._activeFilter);
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

  /** Zeile der Tab-Optionen: null = Alle, HEATMAP_TAB = Heatmap (wenn Zonen), dann Domains */
  private _filterTabIds(): (string | null)[] {
    const domains = this._availableDomains();
    const hasHeatmap = (this.config?.temperature_zones ?? []).length > 0;
    const ids: (string | null)[] = [null];
    if (hasHeatmap) ids.push(HEATMAP_TAB);
    ids.push(...domains);
    return ids;
  }

  private _showFilterBar(): boolean {
    return (
      this._availableDomains().length > 0 ||
      (this.config?.temperature_zones ?? []).length > 0 ||
      (this.config?.alert_entities ?? []).length > 0
    );
  }

  /** Anzahl Entitäten in alert_entities mit aktivem Alarm (z. B. state on/triggered) */
  private _alertCount(): number {
    const ids = this.config?.alert_entities ?? [];
    if (!this.hass?.states || ids.length === 0) return 0;
    return ids.filter((eid) => {
      const state = this.hass!.states[eid]?.state;
      return state === 'on' || state === 'triggered' || state === 'active';
    }).length;
  }

  private _handleAlertBadgeAction(ev: ActionHandlerEvent): void {
    const action = this.config?.alert_badge_action ?? { action: 'more-info' as const };
    const entity = (this.config?.alert_entities ?? [])[0] ?? '';
    if (this.hass && ev.detail?.action) {
      handleAction(this, this.hass, { entity, tap_action: action }, ev.detail.action);
      forwardHaptic('light');
    }
  }

  private _selectFilter(domain: string | null): void {
    this._activeFilter = domain;
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
    if (!this.config) return false;
    if (
      changedProps.has('_activeFilter') ||
      changedProps.has('_imageLoaded') ||
      changedProps.has('_imageError') ||
      changedProps.has('_imageAspect') ||
      changedProps.has('_darkMode')
    )
      return true;
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (this.closest('.element-preview')) {
      this.style.display = 'none';
      return;
    }
    this._darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    this._darkMode = this._darkModeMedia.matches;
    this._darkModeMedia.addEventListener('change', this._onDarkModeChange);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback?.();
    if (this._darkModeMedia) {
      this._darkModeMedia.removeEventListener('change', this._onDarkModeChange);
      this._darkModeMedia = null;
    }
  }

  private _onDarkModeChange = (ev: MediaQueryListEvent): void => {
    this._darkMode = ev.matches;
  };

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

  private _hexToRgba(hex: string, alpha: number): string {
    const m = hex.replace(/^#/, '').match(/(.{2})/g);
    if (!m || m.length !== 3) return `rgba(45, 45, 45, ${alpha})`;
    const [r, g, b] = m.map((x) => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /** Farbe für Temperatur-Preset: blau kalt, orange warm, rot ab 24°C */
  private _temperatureColor(temp: number): string {
    if (temp < 18) return '#2196f3';   // blau (kalt)
    if (temp < 24) return '#ff9800';  // orange
    return '#f44336';                  // rot (ab 24°C)
  }

  private _renderEntity(ent: RoomPlanEntity): TemplateResult {
    const x = Math.min(100, Math.max(0, Number(ent.x) ?? 50));
    const y = Math.min(100, Math.max(0, Number(ent.y) ?? 50));
    const scale = Math.min(2, Math.max(0.3, Number(ent.scale) ?? 1));
    const isOn = this.hass?.states?.[ent.entity]?.state === 'on';
    const icon = ent.icon || getEntityIcon(this.hass, ent.entity);
    const stateDisplay = getStateDisplay(this.hass, ent.entity);
    const title = `${getFriendlyName(this.hass, ent.entity)}: ${stateDisplay}`;
    const opacity = Math.min(1, Math.max(0, Number(ent.background_opacity) ?? 1));

    const preset = ent.preset ?? 'default';
    let bgColor: string;
    let showValue = !!ent.show_value;

    if (preset === 'temperature') {
      showValue = true;
      const state = this.hass?.states?.[ent.entity]?.state;
      const num = typeof state === 'string' ? parseFloat(state.replace(',', '.')) : Number(state);
      const temp = Number.isFinite(num) ? num : 20;
      const presetColor = this._temperatureColor(temp);
      bgColor = this._hexToRgba(presetColor, opacity);
    } else {
      bgColor = ent.color
        ? this._hexToRgba(ent.color, opacity)
        : `rgba(45, 45, 45, ${opacity})`;
    }

    const actionConfig = this._getEntityActionConfig(ent);
    const hasHold = hasAction(actionConfig.hold_action);
    const hasDbl = hasAction(actionConfig.double_tap_action);

    return html`
      <div
        class="entity-badge ${isOn ? 'entity-on' : ''} ${showValue ? 'entity-show-value' : ''}"
        style="left:${x}%;top:${y}%;--entity-scale:${scale};--entity-bg:${bgColor}"
        title="${title}"
        tabindex="0"
        role="button"
        .actionHandler=${actionHandler({ hasHold, hasDoubleClick: hasDbl })}
        @action=${(e: ActionHandlerEvent) => this._handleEntityAction(e, ent)}
      >
        <div class="entity-badge-inner">
          ${showValue
            ? html`<span class="entity-value">${stateDisplay}</span>`
            : html`<ha-icon icon="${icon}"></ha-icon>`}
        </div>
      </div>
    `;
  }

  /** Heatmap-Zone: Rechteck (x1,y1)–(x2,y2) in %, Farbe nach Temperatur-Entity */
  private _renderHeatmapZone(zone: HeatmapZone): TemplateResult {
    const x1 = Math.min(100, Math.max(0, Number(zone.x1) ?? 0));
    const y1 = Math.min(100, Math.max(0, Number(zone.y1) ?? 0));
    const x2 = Math.min(100, Math.max(0, Number(zone.x2) ?? 100));
    const y2 = Math.min(100, Math.max(0, Number(zone.y2) ?? 100));
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const width = Math.abs(x2 - x1) || 1;
    const height = Math.abs(y2 - y1) || 1;
    const opacity = Math.min(1, Math.max(0, Number(zone.opacity) ?? 0.4));

    const state = this.hass?.states?.[zone.entity]?.state;
    const num = typeof state === 'string' ? parseFloat(state.replace(',', '.')) : Number(state);
    const temp = Number.isFinite(num) ? num : 20;
    const color = this._temperatureColor(temp);
    const bg = this._hexToRgba(color, opacity);

    return html`
      <div
        class="heatmap-zone"
        style="left:${left}%;top:${top}%;width:${width}%;height:${height}%;background:${bg}"
        title="${zone.entity}: ${state ?? '?'}"
      ></div>
    `;
  }

  private _onImageLoad(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (img.naturalWidth && img.naturalHeight) {
      this._imageAspect = img.naturalWidth / img.naturalHeight;
    }
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

    const tabIds = this._filterTabIds();
    const showFilterBar = this._showFilterBar();
    const activeTab =
      this._activeFilter !== null && tabIds.includes(this._activeFilter) ? this._activeFilter : null;

    return html`
      <ha-card class=${this.config?.full_height ? 'full-height' : ''}>
        <div class="card-content">
          ${showFilterBar
            ? html`
                <div class="filter-tabs">
                  <div class="filter-tabs-left">
                    ${tabIds.map(
                      (id) => html`
                        <button
                          type="button"
                          class="filter-tab ${activeTab === id ? 'active' : ''}"
                          @click=${() => this._selectFilter(id)}
                        >
                          ${id === null ? 'Alle' : id === HEATMAP_TAB ? 'Heatmap' : id}
                        </button>
                      `,
                    )}
                  </div>
                  ${(this.config?.alert_entities ?? []).length > 0
                    ? html`
                        <button
                          type="button"
                          class="alert-badge ${this._alertCount() > 0 ? 'alert-badge-active' : ''}"
                          title="Meldungen"
                          .actionHandler=${actionHandler({ hasHold: false, hasDoubleClick: false })}
                          @action=${(e: ActionHandlerEvent) => this._handleAlertBadgeAction(e)}
                        >
                          <ha-icon icon="mdi:bell-badge-outline"></ha-icon>
                          <span class="alert-badge-count">${this._alertCount()}</span>
                        </button>
                      `
                    : ''}
                </div>
              `
            : ''}
          ${(() => {
            const useDark = this.config?.dark_mode !== undefined ? !!this.config.dark_mode : this._darkMode;
            const darkFilter = useDark ? (this.config?.dark_mode_filter ?? 'brightness(0.88) contrast(1.05)') : 'none';
            const imgSrc = useDark && this.config?.image_dark ? this.config.image_dark : img;
            return html`
          <div class="image-wrapper" style="transform: rotate(${rotation}deg);">
            <div class="image-and-overlay ${useDark ? 'dark' : ''}" style="--image-aspect: ${this._imageAspect}; --plan-dark-filter: ${darkFilter};">
              <img
                src="${imgSrc}"
                alt="Raumplan"
                class="plan-image"
                style="filter: var(--plan-dark-filter, none);"
                @load=${this._onImageLoad}
                @error=${this._onImageError}
              />
              ${!this._imageLoaded && !this._imageError ? html`<div class="image-skeleton" aria-hidden="true"></div>` : ''}
              ${this._imageError ? html`<div class="image-error">Bild konnte nicht geladen werden</div>` : ''}
              <div class="entities-overlay">
                ${(this.config?.temperature_zones ?? []).length
                  ? html`
                      <div class="heatmap-layer">
                        ${(this.config.temperature_zones ?? []).map((zone) => this._renderHeatmapZone(zone))}
                      </div>
                    `
                  : ''}
                ${this._filteredEntities().map((ent) => this._renderEntity(ent))}
              </div>
            </div>
          </div>
            `;
          })()}
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
      .filter-tabs {
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 16px 12px;
        background: var(--ha-card-background, var(--card-background-color, #1e1e1e));
        border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      }
      .filter-tabs-left {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .alert-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: none;
        border-radius: 16px;
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.05));
        color: var(--secondary-text-color, rgba(255, 255, 255, 0.7));
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
      }
      .alert-badge:hover {
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.08));
        color: var(--primary-text-color, rgba(255, 255, 255, 0.9));
      }
      .alert-badge.alert-badge-active {
        background: var(--error-color, #db4437);
        color: #fff;
      }
      .alert-badge.alert-badge-active:hover {
        opacity: 0.9;
      }
      .alert-badge ha-icon {
        width: 20px;
        height: 20px;
      }
      .alert-badge-count {
        min-width: 1.2em;
        text-align: center;
        font-weight: 600;
      }
      .filter-tab {
        padding: 6px 14px;
        border: none;
        border-radius: 16px;
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.05));
        color: var(--secondary-text-color, rgba(255, 255, 255, 0.7));
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s, color 0.2s;
        font-family: inherit;
        -webkit-tap-highlight-color: transparent;
      }
      .filter-tab:hover {
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.08));
        color: var(--primary-text-color, rgba(255, 255, 255, 0.9));
      }
      .filter-tab.active {
        background: var(--primary-color, #03a9f4);
        color: #fff;
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
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        min-height: 120px;
        min-width: 0;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
      }
      .image-and-overlay {
        position: relative;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        aspect-ratio: var(--image-aspect, 16 / 9);
        flex-shrink: 0;
        overflow: hidden;
      }
      .plan-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: fill;
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
        box-sizing: border-box;
      }
      .entities-overlay > * {
        pointer-events: auto;
      }
      .heatmap-layer {
        pointer-events: none;
        position: absolute;
        inset: 0;
        z-index: 0;
      }
      .heatmap-zone {
        position: absolute;
        pointer-events: none;
        border-radius: 0;
        z-index: 0;
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
        background: var(--entity-bg, rgba(45, 45, 45, 0.9));
        color: var(--primary-text-color, #e1e1e1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .entity-badge-inner ha-icon {
        --mdc-icon-size: var(--icon-size);
        width: var(--icon-size);
        height: var(--icon-size);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .entity-badge-inner .entity-value {
        font-size: calc(var(--icon-size) * 0.5);
        line-height: 1.1;
        font-weight: 500;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding: 0 2px;
      }
      .entity-badge.entity-show-value .entity-badge-inner .entity-value {
        white-space: normal;
        word-break: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        line-clamp: 3;
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
