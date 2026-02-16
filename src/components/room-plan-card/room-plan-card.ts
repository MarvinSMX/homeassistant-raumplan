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
import { getEntityIcon, getFriendlyName, getStateDisplay, getEntityBoundaries, isPolygonBoundary, getFlattenedEntities, getRoomBoundaryList, getRoomBoundingBox, getRoomShapeCenter, roomRelativeToImagePercentWithShape, type FlattenedEntity } from '../../lib/utils';
import { repeat } from 'lit/directives/repeat.js';
import { actionHandler } from '../../lib/action-handler';

import '../room-plan-editor/room-plan-editor';

const CARD_TAG = 'room-plan-card';
const EDITOR_TAG = 'room-plan-editor';
/** Sentinel für den Heatmap-Tab (kein Domain-Filter) */
const HEATMAP_TAB = '__heatmap__';

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
  /** Overlay-Ausschnitt in % der Container-Breite/Höhe (object-fit: contain) – wie im Editor, damit Position 1:1 stimmt */
  @state() private _contentRect: { left: number; top: number; width: number; height: number } | null = null;
  /** Aktiver Tab: null = Alle, HEATMAP_TAB oder Preset-ID (z. B. smoke_detector) */
  @state() private _activeFilter: string | null = null;
  /** Eindeutiger Key der gerade gehoverten Badge (nur diese bekommt Hover-Effekt). */
  @state() private _hoveredBadgeKey: string | null = null;
  /** Dark Mode (System/Theme), für Bild-Filter oder image_dark */
  @state() private _darkMode = false;

  private _darkModeMedia: MediaQueryList | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _imageAndOverlayRef: HTMLElement | null = null;

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
    // Tiefe Kopie von rooms/entities, damit X/Y-Updates aus dem Editor sicher ankommen und die Karte neu rendert
    const rooms = Array.isArray(config?.rooms)
      ? JSON.parse(JSON.stringify(config.rooms)) as RoomPlanCardConfig['rooms']
      : undefined;
    const entities = Array.isArray(config?.entities)
      ? JSON.parse(JSON.stringify(config.entities))
      : [];
    this.config = {
      type: config?.type ?? 'custom:room-plan-card',
      image: img,
      entities,
      rooms,
      title: config?.title ?? '',
      rotation: Number(config?.rotation) ?? 0,
      full_height: config?.full_height ?? false,
      tap_action: config?.tap_action,
      hold_action: config?.hold_action,
      double_tap_action: config?.double_tap_action,
      entity_filter: Array.isArray(config?.entity_filter) ? config.entity_filter : undefined,
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
    this._contentRect = null;
  }

  /** Preset-ID → Anzeigename für Tabs */
  private static readonly PRESET_LABELS: Record<string, string> = {
    default: 'Standard',
    temperature: 'Temperatur',
    binary_sensor: 'Binary Sensor',
    window_contact: 'Fensterkontakt',
    smoke_detector: 'Rauchmelder',
  };

  /** Reihenfolge der Presets in den Tabs */
  private static readonly PRESET_ORDER: (keyof typeof RoomPlanCard.PRESET_LABELS)[] = [
    'default',
    'temperature',
    'binary_sensor',
    'window_contact',
    'smoke_detector',
  ];

  private _getPreset(ent: RoomPlanEntity): string {
    return ent.preset ?? 'default';
  }

  /** Gefilterte Entitäten inkl. roomIndex für Koordinatenumrechnung (raum-relativ → Bild-%). */
  private _filteredEntities(): FlattenedEntity[] {
    const flattened = getFlattenedEntities(this.config);
    if (this._activeFilter === HEATMAP_TAB) return [];
    if (this._activeFilter === null || this._activeFilter === '') return flattened;
    return flattened.filter((f) => this._getPreset(f.entity) === this._activeFilter);
  }

  /** In der Config vorkommende Presets, in fester Reihenfolge. */
  private _availablePresets(): string[] {
    const flattened = getFlattenedEntities(this.config);
    const used = new Set<string>();
    flattened.forEach((f) => used.add(this._getPreset(f.entity)));
    return RoomPlanCard.PRESET_ORDER.filter((p) => used.has(p));
  }

  /** Zeile der Tab-Optionen: null = Alle, HEATMAP_TAB = Heatmap, dann Presets */
  private _filterTabIds(): (string | null)[] {
    const presets = this._availablePresets();
    const flattened = getFlattenedEntities(this.config);
    const hasHeatmap = flattened.some(
      (f) => f.entity.preset === 'temperature' && (f.room ? getRoomBoundaryList(f.room) : getEntityBoundaries(f.entity)).length > 0
    );
    const ids: (string | null)[] = [null];
    if (hasHeatmap) ids.push(HEATMAP_TAB);
    ids.push(...presets);
    return ids;
  }

  private _presetTabLabel(id: string | null): string {
    if (id === null) return 'Alle';
    if (id === HEATMAP_TAB) return 'Heatmap';
    return RoomPlanCard.PRESET_LABELS[id] ?? id;
  }

  private _showFilterBar(): boolean {
    const hasHeatmap = getFlattenedEntities(this.config).some(
      (f) => f.entity.preset === 'temperature' && (f.room ? getRoomBoundaryList(f.room) : getEntityBoundaries(f.entity)).length > 0
    );
    return (
      this._availablePresets().length > 0 ||
      hasHeatmap ||
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
      changedProps.has('_contentRect') ||
      changedProps.has('_darkMode') ||
      changedProps.has('_hoveredBadgeKey')
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

  firstUpdated(): void {
    if (!this.config?.image) return;
    requestAnimationFrame(() => {
      const wrap = this.renderRoot?.querySelector?.('.image-and-overlay') as HTMLElement | null;
      if (wrap && !this._resizeObserver) {
        this._imageAndOverlayRef = wrap;
        this._resizeObserver = new ResizeObserver(() => this._measureContentRect());
        this._resizeObserver.observe(wrap);
      }
      if (this._imageLoaded) this._measureContentRect();
    });
  }

  updated(changedProps: Map<string, unknown>): void {
    super.updated?.(changedProps);
    if (this._imageLoaded && this.config?.image && !this._contentRect) {
      requestAnimationFrame(() => this._measureContentRect());
    }
  }

  disconnectedCallback(): void {
    if (this._resizeObserver && this._imageAndOverlayRef) {
      this._resizeObserver.unobserve(this._imageAndOverlayRef);
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
      this._imageAndOverlayRef = null;
    }
    if (this._darkModeMedia) {
      this._darkModeMedia.removeEventListener('change', this._onDarkModeChange);
      this._darkModeMedia = null;
    }
    super.disconnectedCallback?.();
  }

  private _onDarkModeChange = (ev: MediaQueryListEvent): void => {
    this._darkMode = ev.matches;
  };

  /**
   * Bild-Prozent (0–100) für ein Entity-Badge.
   * Im Raum: ausschließlich Koordinatensystem des Raums (0–100); keine x/y = Default = Raummitte.
   */
  private _getEntityImagePosition(fl: FlattenedEntity): { x: number; y: number } {
    const ent = fl.entity;
    const room = fl.room;
    if (room) {
      const hasCoords = ent.x != null && ent.y != null;
      if (!hasCoords) {
        const center = getRoomShapeCenter(room);
        return center ?? { x: 50, y: 50 };
      }
      const rx = Math.min(100, Math.max(0, Number(ent.x)));
      const ry = Math.min(100, Math.max(0, Number(ent.y)));
      return roomRelativeToImagePercentWithShape(room, rx, ry);
    }
    const rx = Math.min(100, Math.max(0, Number(ent.x) ?? 50));
    const ry = Math.min(100, Math.max(0, Number(ent.y) ?? 50));
    return { x: rx, y: ry };
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

  /** Badge rendern; Key aus fl (Raum+Index), nicht aus entity id – verhindert falschen Hover bei nebeneinander liegenden Räumen. */
  private _renderEntity(fl: FlattenedEntity, imagePos: { x: number; y: number }): TemplateResult {
    const ent = fl.entity;
    const x = imagePos.x;
    const y = imagePos.y;
    const scale = Math.min(2, Math.max(0.3, Number(ent.scale) ?? 1));
    const isOn = this.hass?.states?.[ent.entity]?.state === 'on';
    const icon = ent.icon || getEntityIcon(this.hass, ent.entity);
    const stateDisplay = getStateDisplay(this.hass, ent.entity);
    const title = `${getFriendlyName(this.hass, ent.entity)}: ${stateDisplay}`;

    const preset = ent.preset ?? 'default';
    let showValue = !!ent.show_value;
    /** Farbe nur für Icons (nicht für Wert-Text). Bei Icon: ent.color, Temperatur-Preset oder „an“. */
    let iconColor = '';

    if (preset === 'temperature') {
      showValue = true;
      /* Wert-Text wird neutral dargestellt; Icon-Farbe hier nicht genutzt */
    } else if (!showValue) {
      if (isOn) iconColor = ent.color || 'var(--state-icon-on-color, var(--state-icon-active-color, #ffc107))';
      else iconColor = ent.color || 'var(--primary-text-color, #e1e1e1)';
    }

    const actionConfig = this._getEntityActionConfig(ent);
    const hasHold = hasAction(actionConfig.hold_action);
    const hasDbl = hasAction(actionConfig.double_tap_action);

    const isHovered = this._hoveredBadgeKey === fl.uniqueKey;
    return html`
      <div
        id="rp-${fl.uniqueKey}"
        class="entity-badge ${isOn ? 'entity-on' : ''} ${showValue ? 'entity-show-value' : ''} ${isHovered ? 'badge-hovered' : ''}"
        data-room-index="${fl.roomIndex ?? ''}"
        data-entity-index="${fl.entityIndexInRoom}"
        data-unique-key="${fl.uniqueKey}"
        style="left:${x}%;top:${y}%;--entity-scale:${scale};--entity-icon-color:${iconColor}"
        title="${title}"
        tabindex="0"
        role="button"
        @mouseenter=${() => { this._hoveredBadgeKey = fl.uniqueKey; }}
        @mouseleave=${() => { if (this._hoveredBadgeKey === fl.uniqueKey) this._hoveredBadgeKey = null; }}
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

  /** Heatmap-Zone: Rechteck oder Polygon in %, Farbe nach Temperatur-Entity; zoneKey = eindeutige ID pro Raum/Boundary. */
  private _renderHeatmapZone(zone: HeatmapZone, zoneKey: string): TemplateResult {
    const opacity = Math.min(1, Math.max(0, Number(zone.opacity) ?? 0.4));
    const state = this.hass?.states?.[zone.entity]?.state;
    const num = typeof state === 'string' ? parseFloat(state.replace(',', '.')) : Number(state);
    const temp = Number.isFinite(num) ? num : 20;
    const color = this._temperatureColor(temp);
    const bg = this._hexToRgba(color, opacity);

    if ('points' in zone && Array.isArray(zone.points) && zone.points.length >= 3) {
      const pts = zone.points.map((p) => `${Math.min(100, Math.max(0, p.x))}% ${Math.min(100, Math.max(0, p.y))}%`).join(', ');
      return html`
        <div
          id="rp-heatmap-${zoneKey}"
          class="heatmap-zone"
          data-zone-key="${zoneKey}"
          style="left:0;top:0;width:100%;height:100%;background:${bg};clip-path:polygon(${pts})"
          title="${zone.entity}: ${state ?? '?'}"
        ></div>
      `;
    }
    const x1 = Math.min(100, Math.max(0, Number(zone.x1) ?? 0));
    const y1 = Math.min(100, Math.max(0, Number(zone.y1) ?? 0));
    const x2 = Math.min(100, Math.max(0, Number(zone.x2) ?? 100));
    const y2 = Math.min(100, Math.max(0, Number(zone.y2) ?? 100));
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const right = Math.max(x1, x2);
    const bottom = Math.max(y1, y2);
    const clip = `${left}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${left}% ${bottom}%`;
    return html`
      <div
        id="rp-heatmap-${zoneKey}"
        class="heatmap-zone"
        data-zone-key="${zoneKey}"
        style="left:0;top:0;width:100%;height:100%;background:${bg};clip-path:polygon(${clip})"
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
    requestAnimationFrame(() => this._measureContentRect());
  }

  /** Misst den sichtbaren Bildinhalt (object-fit: contain) in % des Containers – wie im Editor für 1:1-Position. */
  private _measureContentRect(): void {
    const wrap = this._imageAndOverlayRef ?? this.renderRoot?.querySelector?.('.image-and-overlay');
    const img = wrap?.querySelector?.('.plan-image') as HTMLImageElement | null;
    if (!wrap || !img?.naturalWidth || !img.naturalHeight) {
      this._contentRect = null;
      return;
    }
    const wrapRect = wrap.getBoundingClientRect();
    const rw = wrapRect.width;
    const rh = wrapRect.height;
    if (rw <= 0 || rh <= 0) {
      this._contentRect = null;
      return;
    }
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const scale = Math.min(rw / nw, rh / nh);
    const contentW = nw * scale;
    const contentH = nh * scale;
    const contentLeft = (rw - contentW) / 2;
    const contentTop = (rh - contentH) / 2;
    this._contentRect = {
      left: (contentLeft / rw) * 100,
      top: (contentTop / rh) * 100,
      width: (contentW / rw) * 100,
      height: (contentH / rh) * 100,
    };
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
                          ${this._presetTabLabel(id)}
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
            const cr = this._contentRect;
            const overlayStyle = cr
              ? `left:${cr.left}%;top:${cr.top}%;width:${cr.width}%;height:${cr.height}%`
              : 'left:0;top:0;width:100%;height:100%';
            return html`
          <div class="image-wrapper" style="transform: rotate(${rotation}deg);">
            <div class="image-and-overlay ${useDark ? 'dark' : ''}" style="--image-aspect: ${this._imageAspect}; --plan-dark-filter: ${darkFilter};">
              <div class="plan-content-overlay" style="${overlayStyle}">
                ${(() => {
                  const zoneList: { key: string; zone: HeatmapZone }[] = [];
                  const flattened = getFlattenedEntities(this.config);
                  for (const fl of flattened) {
                    const ent = fl.entity;
                    if (ent.preset !== 'temperature') continue;
                    const boundaries = fl.room ? getRoomBoundaryList(fl.room) : getEntityBoundaries(ent);
                    boundaries.forEach((b, bi) => {
                      const key = `${fl.uniqueKey}-zone-${bi}`;
                      if (isPolygonBoundary(b)) {
                        zoneList.push({ key, zone: { entity: ent.entity, points: b.points, opacity: b.opacity ?? 0.4 } });
                      } else {
                        const r = b as { x1: number; y1: number; x2: number; y2: number };
                        zoneList.push({ key, zone: { entity: ent.entity, x1: r.x1, y1: r.y1, x2: r.x2, y2: r.y2, opacity: r.opacity ?? 0.4 } });
                      }
                    });
                  }
                  return zoneList.length
                    ? html`
                        <div class="heatmap-layer heatmap-layer-behind">
                          ${repeat(zoneList, (z) => z.key, (z) => this._renderHeatmapZone(z.zone, z.key))}
                        </div>
                      `
                    : '';
                })()}
                <div class="entities-overlay">
                  ${repeat(
                    this._filteredEntities(),
                    (fl) => fl.uniqueKey,
                    (fl) => this._renderEntity(fl, this._getEntityImagePosition(fl))
                  )}
                </div>
              </div>
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
      /* Ein gemeinsamer Block für Bild + Overlay, Größe nur aus Breite + Aspect-Ratio (padding-Trick), damit Overlay 1:1 am Bild bleibt */
      .image-and-overlay {
        position: relative;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        flex-shrink: 0;
        overflow: hidden;
        /* Höhe aus Aspect-Ratio (padding % = Prozent der eigenen width); Bild + Overlay teilen dieselbe absolute Box */
        height: 0;
        padding-bottom: calc(100% / var(--image-aspect, 1.778));
      }
      .image-and-overlay .plan-content-overlay,
      .image-and-overlay .heatmap-layer,
      .image-and-overlay .plan-image,
      .image-and-overlay .image-skeleton,
      .image-and-overlay .image-error,
      .image-and-overlay .entities-overlay {
        position: absolute;
        margin: 0;
        box-sizing: border-box;
      }
      .image-and-overlay .plan-content-overlay {
        top: 0;
        left: 0;
        z-index: 1;
      }
      .image-and-overlay .heatmap-layer,
      .image-and-overlay .plan-image,
      .image-and-overlay .image-skeleton,
      .image-and-overlay .image-error,
      .image-and-overlay .entities-overlay {
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      .heatmap-layer-behind {
        z-index: -1;
      }
      .image-and-overlay .plan-image {
        z-index: 0;
      }
      .image-and-overlay .image-skeleton,
      .image-and-overlay .image-error {
        z-index: 0;
      }
      .image-and-overlay .entities-overlay {
        z-index: 1;
        isolation: isolate;
      }
      .plan-image {
        object-fit: contain;
        object-position: center;
        display: block;
      }
      .image-skeleton {
        background: var(--ha-card-background, #1e1e1e);
      }
      .entities-overlay {
        pointer-events: none;
      }
      .entities-overlay > * {
        pointer-events: auto;
      }
      .heatmap-layer {
        pointer-events: none;
        position: absolute;
        inset: 0;
      }
      .heatmap-zone {
        position: absolute;
        pointer-events: none;
        border-radius: 0;
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
        isolation: isolate;
      }
      .entity-badge.badge-hovered {
        transform: translate(-50%, -50%) scale(1.08);
      }
      .entity-badge-inner {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: #fff;
        color: var(--primary-text-color, #212121);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
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
        color: var(--entity-icon-color, var(--primary-text-color, #424242));
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
        color: var(--primary-text-color, #212121);
      }
      .entity-badge.entity-show-value .entity-badge-inner .entity-value {
        white-space: normal;
        word-break: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        line-clamp: 3;
      }
      .entity-badge.entity-on .entity-badge-inner ha-icon {
        color: var(--entity-icon-color, var(--state-icon-on-color, var(--state-icon-active-color, #ffc107)));
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
