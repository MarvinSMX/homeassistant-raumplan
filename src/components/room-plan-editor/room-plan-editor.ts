/**
 * Editor für die Raumplan-Karte
 */
import { LitElement, html, css, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, fireEvent, type LovelaceCardEditor } from 'custom-card-helpers';

import type { RoomPlanCardConfig, RoomPlanEntity } from '../../lib/types';
import type { RoomBoundary } from '../../lib/utils';
import { getFriendlyName, getEntityBoundaries } from '../../lib/utils';

@customElement('room-plan-editor')
export class RoomPlanEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config: RoomPlanCardConfig = {
    type: '',
    image: '',
    entities: [],
  };

  /** „Auf Plan einzeichnen“: wofür und Zeichen-Vorschau */
  @state() private _pickerFor:
    | { type: 'position'; entityIndex: number }
    | { type: 'rect'; entityIndex: number; boundaryIndex: number }
    | { type: 'rectNew'; entityIndex: number }
    | { type: 'line'; entityIndex: number; lineIndex: number }
    | { type: 'lineNew'; entityIndex: number }
    | null = null;
  @state() private _drawStart: { x: number; y: number } | null = null;
  @state() private _drawCurrent: { x: number; y: number } | null = null;
  private _pickerImageNatural: { w: number; h: number } | null = null;

  public setConfig(config: RoomPlanCardConfig): void {
    const base = config ?? { type: '', image: '', entities: [] };
    const img =
      typeof base.image === 'string'
        ? base.image
        : ((base.image as { location?: string } | undefined)?.location ?? '');
    const entities = Array.isArray(base.entities)
      ? base.entities.map((ent) => {
          if (ent.room_boundary && !(ent.room_boundaries?.length)) {
            return { ...ent, room_boundaries: [ent.room_boundary!] };
          }
          return { ...ent };
        })
      : [];
    this._config = {
      ...base,
      image: img,
      entities,
      entity_filter: Array.isArray(base.entity_filter) ? base.entity_filter : undefined,
      temperature_zones: Array.isArray(base.temperature_zones) ? [...base.temperature_zones] : undefined,
      alert_entities: Array.isArray(base.alert_entities) ? base.alert_entities : undefined,
      alert_badge_action: base.alert_badge_action,
      image_dark: base.image_dark,
      dark_mode_filter: base.dark_mode_filter,
      dark_mode: base.dark_mode,
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

  private _updateEntityBoundary(entityIndex: number, boundaryIndex: number, updates: Partial<RoomBoundary>): void {
    const entities = [...(this._config.entities ?? [])];
    const ent = entities[entityIndex];
    const list = [...(getEntityBoundaries(ent))];
    if (boundaryIndex >= list.length) return;
    list[boundaryIndex] = { ...list[boundaryIndex], ...updates };
    entities[entityIndex] = { ...ent, room_boundaries: list };
    this._updateConfig({ entities });
  }

  private _addEntityBoundary(entityIndex: number, isTemperature: boolean): void {
    const entities = [...(this._config.entities ?? [])];
    const ent = entities[entityIndex];
    const list = [...getEntityBoundaries(ent)];
    list.push(isTemperature ? { x1: 10, y1: 10, x2: 40, y2: 40, opacity: 0.4 } : { x1: 0, y1: 0, x2: 100, y2: 0 });
    entities[entityIndex] = { ...ent, room_boundaries: list };
    this._updateConfig({ entities });
  }

  private _removeEntityBoundary(entityIndex: number, boundaryIndex: number): void {
    const entities = [...(this._config.entities ?? [])];
    const ent = entities[entityIndex];
    const list = getEntityBoundaries(ent);
    if (boundaryIndex >= list.length) return;
    const next = list.filter((_, i) => i !== boundaryIndex);
    const updated = next.length ? { ...ent, room_boundaries: next } : { ...ent, room_boundaries: undefined, room_boundary: undefined };
    entities[entityIndex] = updated;
    this._updateConfig({ entities });
  }

  /** Koordinaten in % aus Klick/Drag relativ zum Plan-Bild (object-fit: contain) */
  private _getPercentFromEvent(e: MouseEvent): { x: number; y: number } | null {
    const wrap = (e.currentTarget as HTMLElement)?.querySelector?.('img') as HTMLImageElement | null;
    const img = wrap || (e.currentTarget as HTMLImageElement);
    if (!img) return null;
    if (!this._pickerImageNatural && img.naturalWidth && img.naturalHeight) {
      this._pickerImageNatural = { w: img.naturalWidth, h: img.naturalHeight };
    }
    if (!this._pickerImageNatural) return null;
    const rect = img.getBoundingClientRect();
    const nw = this._pickerImageNatural.w;
    const nh = this._pickerImageNatural.h;
    const rw = rect.width;
    const rh = rect.height;
    const scale = Math.min(rw / nw, rh / nh);
    const contentW = nw * scale;
    const contentH = nh * scale;
    const left = (rw - contentW) / 2;
    const top = (rh - contentH) / 2;
    const px = e.clientX - rect.left - left;
    const py = e.clientY - rect.top - top;
    if (px < 0 || py < 0 || px > contentW || py > contentH) return null;
    const x = Math.min(100, Math.max(0, (px / contentW) * 100));
    const y = Math.min(100, Math.max(0, (py / contentH) * 100));
    return { x, y };
  }

  private _openPickerPosition(entityIndex: number): void {
    this._pickerFor = { type: 'position', entityIndex };
    this._drawStart = null;
    this._drawCurrent = null;
  }

  private _openPickerRect(entityIndex: number, boundaryIndex?: number): void {
    this._pickerFor =
      boundaryIndex !== undefined
        ? { type: 'rect', entityIndex, boundaryIndex }
        : { type: 'rectNew', entityIndex };
    this._drawStart = null;
    this._drawCurrent = null;
  }

  private _openPickerLine(entityIndex: number, lineIndex?: number): void {
    this._pickerFor =
      lineIndex !== undefined
        ? { type: 'line', entityIndex, lineIndex }
        : { type: 'lineNew', entityIndex };
    this._drawStart = null;
    this._drawCurrent = null;
  }

  private _closePicker(): void {
    this._pickerFor = null;
    this._drawStart = null;
    this._drawCurrent = null;
  }

  private _onPickerImageLoad(e: Event): void {
    const img = e.target as HTMLImageElement;
    if (img?.naturalWidth && img?.naturalHeight) {
      this._pickerImageNatural = { w: img.naturalWidth, h: img.naturalHeight };
    }
  }

  private _onPickerImageClick(e: MouseEvent): void {
    const p = this._getPercentFromEvent(e);
    if (!p || !this._pickerFor) return;
    if (this._pickerFor.type === 'position') {
      this._updateEntity(this._pickerFor.entityIndex, { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });
      this._closePicker();
      return;
    }
    if (this._pickerFor.type === 'line' || this._pickerFor.type === 'lineNew') {
      if (!this._drawStart) {
        this._drawStart = p;
        this._drawCurrent = p;
        return;
      }
      const x1 = this._drawStart.x;
      const y1 = this._drawStart.y;
      const x2 = p.x;
      const y2 = p.y;
      if (this._pickerFor.type === 'line') {
        this._updateEntityBoundary(this._pickerFor.entityIndex, this._pickerFor.lineIndex, { x1, y1, x2, y2 });
      } else {
        this._addEntityBoundary(this._pickerFor.entityIndex, false);
        const ent = this._config.entities?.[this._pickerFor.entityIndex];
        const list = ent ? getEntityBoundaries(ent) : [];
        this._updateEntityBoundary(this._pickerFor.entityIndex, list.length - 1, { x1, y1, x2, y2 });
      }
      this._closePicker();
    }
  }

  private _onPickerImageMouseDown(e: MouseEvent): void {
    const p = this._getPercentFromEvent(e);
    if (!p || !this._pickerFor) return;
    if (this._pickerFor.type === 'rect' || this._pickerFor.type === 'rectNew') {
      this._drawStart = p;
      this._drawCurrent = p;
    }
  }

  private _onPickerImageMouseMove(e: MouseEvent): void {
    const p = this._getPercentFromEvent(e);
    if (!this._pickerFor || (this._pickerFor.type !== 'rect' && this._pickerFor.type !== 'rectNew' && this._pickerFor.type !== 'line')) return;
    if (this._pickerFor.type === 'line' && this._drawStart) {
      this._drawCurrent = p ?? this._drawStart;
      return;
    }
    if (this._drawStart) this._drawCurrent = p ?? this._drawStart;
  }

  private _onPickerImageMouseUp(e: MouseEvent): void {
    const p = this._getPercentFromEvent(e);
    if (!p || !this._pickerFor || (this._pickerFor.type !== 'rect' && this._pickerFor.type !== 'rectNew')) return;
    if (!this._drawStart) return;
    const x1 = Math.min(this._drawStart.x, p.x);
    const y1 = Math.min(this._drawStart.y, p.y);
    const x2 = Math.max(this._drawStart.x, p.x);
    const y2 = Math.max(this._drawStart.y, p.y);
    const w = x2 - x1 || 1;
    const h = y2 - y1 || 1;
    if (w < 2 && h < 2) {
      this._drawStart = null;
      this._drawCurrent = null;
      return;
    }
    if (this._pickerFor.type === 'rect') {
      this._updateEntityBoundary(this._pickerFor.entityIndex, this._pickerFor.boundaryIndex, {
        x1,
        y1,
        x2,
        y2,
        opacity: 0.4,
      });
    } else {
      this._addEntityBoundary(this._pickerFor.entityIndex, true);
      const ent = this._config.entities?.[this._pickerFor.entityIndex];
      const list = ent ? getEntityBoundaries(ent) : [];
      this._updateEntityBoundary(this._pickerFor.entityIndex, list.length - 1, { x1, y1, x2, y2, opacity: 0.4 });
    }
    this._closePicker();
  }

  private _updateHeatmapZone(index: number, updates: Partial<{ entity: string; x1: number; y1: number; x2: number; y2: number; opacity?: number }>): void {
    const zones = [...(this._config.temperature_zones ?? [])];
    zones[index] = { ...zones[index], ...updates };
    this._updateConfig({ temperature_zones: zones });
  }

  private _removeHeatmapZone(index: number): void {
    const zones = [...(this._config.temperature_zones ?? [])];
    zones.splice(index, 1);
    this._updateConfig({ temperature_zones: zones.length ? zones : undefined });
  }

  private _addHeatmapZone(): void {
    const zones = [...(this._config.temperature_zones ?? []), { entity: '', x1: 10, y1: 10, x2: 40, y2: 40 }];
    this._updateConfig({ temperature_zones: zones });
  }

  private _updateAlertEntity(index: number, entityId: string): void {
    const list = [...(this._config.alert_entities ?? [])];
    list[index] = entityId.trim();
    this._updateConfig({ alert_entities: list });
  }

  private _removeAlertEntity(index: number): void {
    const list = [...(this._config.alert_entities ?? [])];
    list.splice(index, 1);
    this._updateConfig({ alert_entities: list.length ? list : undefined });
  }

  private _addAlertEntity(): void {
    const list = [...(this._config.alert_entities ?? []), ''];
    this._updateConfig({ alert_entities: list });
  }

  protected render(): TemplateResult {
    const img = typeof this._config.image === 'string' ? this._config.image : '';
    const title = this._config.title ?? '';
    const rotation = Number(this._config.rotation) ?? 0;
    const entities = this._config.entities ?? [];
    const entityIds = this.hass?.states ? Object.keys(this.hass.states).sort() : [];

    const pickerEntity = this._pickerFor ? this._config.entities?.[this._pickerFor.entityIndex] : null;
    const pickerBoundaries = pickerEntity ? getEntityBoundaries(pickerEntity) : [];

    return html`
      <div class="editor">
        ${this._pickerFor && img ? html`
        <div class="picker-modal-backdrop" @click=${(e: MouseEvent) => e.target === e.currentTarget && this._closePicker()}>
          <div class="picker-modal" @click=${(e: MouseEvent) => e.stopPropagation()}>
            <div class="picker-header">
              <span class="picker-title">
                ${this._pickerFor.type === 'position' ? 'Position auf Plan klicken' : ''}
                ${this._pickerFor.type === 'rect' || this._pickerFor.type === 'rectNew' ? 'Rechteck auf Plan ziehen (Zone)' : ''}
                ${this._pickerFor.type === 'line' || this._pickerFor.type === 'lineNew' ? 'Zwei Punkte für Linie klicken' : ''}
              </span>
              <button type="button" class="btn-cancel" @click=${() => this._closePicker()}>Abbrechen</button>
            </div>
            <div
              class="picker-image-wrap"
              @mousedown=${(e: MouseEvent) => (this._pickerFor?.type === 'rect' || this._pickerFor?.type === 'rectNew') ? this._onPickerImageMouseDown(e) : null}
              @mousemove=${(e: MouseEvent) => this._onPickerImageMouseMove(e)}
              @mouseup=${(e: MouseEvent) => (this._pickerFor?.type === 'rect' || this._pickerFor?.type === 'rectNew') ? this._onPickerImageMouseUp(e) : null}
              @mouseleave=${() => { if (this._pickerFor?.type !== 'position' && this._pickerFor?.type !== 'line' && this._pickerFor?.type !== 'lineNew') { this._drawStart = null; this._drawCurrent = null; } }}
            >
              <img
                class="picker-image"
                src=${img}
                alt="Plan"
                @load=${(e: Event) => this._onPickerImageLoad(e)}
                @click=${(e: MouseEvent) => this._pickerFor?.type === 'position' || this._pickerFor?.type === 'line' || this._pickerFor?.type === 'lineNew' ? this._onPickerImageClick(e) : null}
              />
              ${this._pickerFor?.type === 'position' && pickerEntity && Number(pickerEntity.x) != null && Number(pickerEntity.y) != null ? html`
                <svg class="picker-overlay picker-overlay-existing" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <circle cx=${Number(pickerEntity.x) ?? 50} cy=${Number(pickerEntity.y) ?? 50} r="2" fill="none" stroke="var(--primary-color, #03a9f4)" stroke-width="0.6" />
                </svg>
              ` : ''}
              ${(this._pickerFor?.type === 'rect' || this._pickerFor?.type === 'rectNew' || this._pickerFor?.type === 'line' || this._pickerFor?.type === 'lineNew') && pickerBoundaries.length > 0 ? html`
                <svg class="picker-overlay picker-overlay-existing" viewBox="0 0 100 100" preserveAspectRatio="none">
                  ${pickerBoundaries.map((b, bi) => {
                    const isEditing = this._pickerFor?.type === 'rect' && this._pickerFor.boundaryIndex === bi
                      || this._pickerFor?.type === 'line' && this._pickerFor.lineIndex === bi;
                    if (this._pickerFor?.type === 'line' || this._pickerFor?.type === 'lineNew') {
                      return html`<line x1=${b.x1} y1=${b.y1} x2=${b.x2} y2=${b.y2}
                        stroke=${isEditing ? 'var(--primary-color, #03a9f4)' : 'rgba(255,255,255,0.5)'}
                        stroke-width=${isEditing ? 1.2 : 0.8}
                        stroke-dasharray=${isEditing ? 'none' : '2,2'}
                      />`;
                    }
                    const left = Math.min(b.x1, b.x2);
                    const top = Math.min(b.y1, b.y2);
                    const w = Math.abs((b.x2 ?? 100) - (b.x1 ?? 0)) || 1;
                    const h = Math.abs((b.y2 ?? 100) - (b.y1 ?? 0)) || 1;
                    return html`<rect x=${left} y=${top} width=${w} height=${h}
                      fill="rgba(255,255,255,0.08)" stroke=${isEditing ? 'var(--primary-color, #03a9f4)' : 'rgba(255,255,255,0.45)'}
                      stroke-width=${isEditing ? 0.8 : 0.5}
                      stroke-dasharray=${isEditing ? 'none' : '2,2'}
                    />`;
                  })}
                </svg>
              ` : ''}
              ${this._drawStart && this._drawCurrent ? html`
                <svg class="picker-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
                  ${this._pickerFor?.type === 'rect' || this._pickerFor?.type === 'rectNew'
                    ? html`<rect
                        x=${Math.min(this._drawStart.x, this._drawCurrent.x)}
                        y=${Math.min(this._drawStart.y, this._drawCurrent.y)}
                        width=${Math.abs(this._drawCurrent.x - this._drawStart.x) || 1}
                        height=${Math.abs(this._drawCurrent.y - this._drawStart.y) || 1}
                        fill="rgba(3,169,244,0.25)"
                        stroke="var(--primary-color, #03a9f4)"
                        stroke-width="0.5"
                      />`
                    : (this._pickerFor?.type === 'line' || this._pickerFor?.type === 'lineNew')
                      ? html`<line x1=${this._drawStart.x} y1=${this._drawStart.y} x2=${this._drawCurrent.x} y2=${this._drawCurrent.y} stroke="var(--primary-color, #03a9f4)" stroke-width="1" />`
                      : ''}
                </svg>
              ` : ''}
            </div>
          </div>
        </div>
        ` : ''}
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
          <div class="field">
            <label>Dark Mode</label>
            <select .value=${this._config.dark_mode === true ? 'dark' : this._config.dark_mode === false ? 'light' : 'auto'}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value;
                this._updateConfig({ dark_mode: v === 'auto' ? undefined : v === 'dark' });
              }}>
              <option value="auto">Auto (System/Theme)</option>
              <option value="light">Immer Hell</option>
              <option value="dark">Immer Dunkel</option>
            </select>
            <span class="hint">Auto nutzt die Systemeinstellung (prefers-color-scheme).</span>
          </div>
          <div class="field">
            <label>Bild-URL (Dark Mode, optional)</label>
            <input type="text" .value=${this._config.image_dark ?? ''} placeholder="z. B. /local/raumplan_dark.svg"
              @change=${(e: Event) => this._updateConfig({ image_dark: (e.target as HTMLInputElement).value.trim() || undefined })} />
            <span class="hint">Anderes Bild bei Dark Mode (z. B. invertierte SVG).</span>
          </div>
          <div class="field">
            <label>CSS-Filter (Dark Mode, optional)</label>
            <input type="text" .value=${this._config.dark_mode_filter ?? ''} placeholder="z. B. brightness(0.88) contrast(1.05)"
              @change=${(e: Event) => this._updateConfig({ dark_mode_filter: (e.target as HTMLInputElement).value.trim() || undefined })} />
            <span class="hint">Standard bei Auto: leichte Abdunklung. Für Inversion: <code>invert(1)</code>.</span>
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
                <select class="entity-preset" title="Preset"
                  .value=${ent.preset ?? 'default'}
                  @change=${(e: Event) => {
                    const preset = (e.target as HTMLSelectElement).value as RoomPlanEntity['preset'];
                    this._updateEntity(i, preset === 'smoke_detector' ? { preset, show_name: false } : { preset });
                  }}>
                  <option value="default">Standard</option>
                  <option value="temperature">Temperatur</option>
                  <option value="binary_sensor">Binary Sensor</option>
                  <option value="window_contact">Fensterkontakt</option>
                  <option value="smoke_detector">Rauchmelder</option>
                </select>
                ${(ent.preset === 'temperature') ? html`
                <div class="entity-boundaries" title="Raum-/Heatmap-Zonen (mehrere für Ecken möglich)">
                  <span class="boundaries-label">Zonen:</span>
                  ${getEntityBoundaries(ent).map((b, bi) => html`
                    <div class="entity-coords room-boundary">
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(b.x1) ?? 0)} placeholder="x1"
                        @change=${(e: Event) => this._updateEntityBoundary(i, bi, { x1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(b.y1) ?? 0)} placeholder="y1"
                        @change=${(e: Event) => this._updateEntityBoundary(i, bi, { y1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(b.x2) ?? 100)} placeholder="x2"
                        @change=${(e: Event) => this._updateEntityBoundary(i, bi, { x2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(b.y2) ?? 100)} placeholder="y2"
                        @change=${(e: Event) => this._updateEntityBoundary(i, bi, { y2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <input type="number" min="0" max="1" step="0.01" class="entity-opacity" .value=${String(Math.min(1, Math.max(0, Number(b.opacity) ?? 0.4)))} title="Deckkraft"
                        @change=${(e: Event) => this._updateEntityBoundary(i, bi, { opacity: Math.min(1, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0.4)) })} />
                      <button type="button" class="btn-draw" @click=${() => this._openPickerRect(i, bi)} title="Zone auf Plan einzeichnen"><ha-icon icon="mdi:draw"></ha-icon></button>
                      <button type="button" class="btn-remove" @click=${() => this._removeEntityBoundary(i, bi)} title="Zone entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                  `)}
                  <button type="button" class="btn-add-small" @click=${() => this._addEntityBoundary(i, true)} title="Zone hinzufügen"><ha-icon icon="mdi:plus"></ha-icon></button>
                  <button type="button" class="btn-draw-small" @click=${() => this._openPickerRect(i)} title="Neue Zone durch Zeichnen"><ha-icon icon="mdi:draw"></ha-icon> Zeichnen</button>
                </div>
                ` : ''}
                ${(ent.preset === 'window_contact') ? html`
                <div class="entity-boundaries" title="Linien (x1,y1)→(x2,y2) in %, mehrere pro Entität möglich">
                  <span class="boundaries-label">Linien:</span>
                  ${getEntityBoundaries(ent).map((b, bi) => html`
                    <div class="entity-coords room-boundary">
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(b.x1) ?? 0)} placeholder="x1"
                        @change=${(e: Event) => this._updateEntityBoundary(i, bi, { x1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(b.y1) ?? 0)} placeholder="y1"
                        @change=${(e: Event) => this._updateEntityBoundary(i, bi, { y1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(b.x2) ?? 100)} placeholder="x2"
                        @change=${(e: Event) => this._updateEntityBoundary(i, bi, { x2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(b.y2) ?? 100)} placeholder="y2"
                        @change=${(e: Event) => this._updateEntityBoundary(i, bi, { y2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <button type="button" class="btn-draw" @click=${() => this._openPickerLine(i, bi)} title="Linie auf Plan einzeichnen"><ha-icon icon="mdi:draw"></ha-icon></button>
                      <button type="button" class="btn-remove" @click=${() => this._removeEntityBoundary(i, bi)} title="Linie entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                  `)}
                  <button type="button" class="btn-add-small" @click=${() => this._addEntityBoundary(i, false)} title="Linie hinzufügen"><ha-icon icon="mdi:plus"></ha-icon></button>
                  <button type="button" class="btn-draw-small" @click=${() => this._openPickerLine(i)} title="Neue Linie durch Zeichnen"><ha-icon icon="mdi:draw"></ha-icon> Zeichnen</button>
                </div>
                <input type="number" min="0.2" max="3" step="0.1" .value=${String(Math.min(3, Math.max(0.2, Number(ent.line_thickness) ?? 1)))} title="Liniendicke"
                  @change=${(e: Event) => this._updateEntity(i, { line_thickness: Math.min(3, Math.max(0.2, Number((e.target as HTMLInputElement).value) || 1)) })} />
                <input type="color" .value=${ent.line_color_open ?? '#f44336'} title="Farbe wenn offen"
                  @change=${(e: Event) => this._updateEntity(i, { line_color_open: (e.target as HTMLInputElement).value })} />
                <input type="color" .value=${ent.line_color_closed ?? '#9e9e9e'} title="Farbe wenn zu"
                  @change=${(e: Event) => this._updateEntity(i, { line_color_closed: (e.target as HTMLInputElement).value })} />
                ` : ''}
                <div class="entity-coords">
                  <input type="number" min="0" max="100" step="0.1" .value=${String(Number(ent.x) || 50)} title="X (%)"
                    @change=${(e: Event) => this._updateEntity(i, { x: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50)) })} />
                  <input type="number" min="0" max="100" step="0.1" .value=${String(Number(ent.y) || 50)} title="Y (%)"
                    @change=${(e: Event) => this._updateEntity(i, { y: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50)) })} />
                  <button type="button" class="btn-draw" @click=${() => this._openPickerPosition(i)} title="Position auf Plan klicken"><ha-icon icon="mdi:crosshairs-gps"></ha-icon></button>
                </div>
                <input type="number" class="entity-scale" min="0.3" max="2" step="0.1" .value=${String(Math.min(2, Math.max(0.3, Number(ent.scale) || 1)))} title="Skalierung"
                  @change=${(e: Event) => this._updateEntity(i, { scale: Math.min(2, Math.max(0.3, parseFloat((e.target as HTMLInputElement).value) || 1)) })} />
                <input type="color" .value=${ent.color || '#03a9f4'} title="Farbe"
                  @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; this._updateEntity(i, { color: v === '#03a9f4' && !ent.color ? undefined : v }); }} />
                <input type="number" class="entity-opacity" min="0" max="1" step="0.01" .value=${String(Math.min(1, Math.max(0, Number(ent.background_opacity) ?? 1)))} title="Deckkraft"
                  @change=${(e: Event) => this._updateEntity(i, { background_opacity: Math.min(1, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 1)) })} />
                <label class="entity-check">
                  <input type="checkbox" .checked=${!!ent.show_value} title="Wert anzeigen"
                    @change=${(e: Event) => this._updateEntity(i, { show_value: (e.target as HTMLInputElement).checked })} />
                  Wert
                </label>
                <label class="entity-check">
                  <input type="checkbox" .checked=${ent.show_name !== false} title="Text (Name) anzeigen"
                    @change=${(e: Event) => this._updateEntity(i, { show_name: (e.target as HTMLInputElement).checked })} />
                  Text
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
        <section class="editor-section heatmap-legacy">
          <h4 class="section-title"><ha-icon icon="mdi:thermometer"></ha-icon> Temperatur-Heatmap (Legacy)</h4>
          <p class="section-hint">Heatmap-Zonen werden jetzt pro Temperatur-Entität unter „Raum-/Heatmap-Zonen“ (Zonen) gepflegt. Alte Einträge hier bleiben für Abwärtskompatibilität erhalten.</p>
          <div class="entity-list">
            ${(this._config.temperature_zones ?? []).map((zone, i) => html`
              <div class="entity-row heatmap-row">
                <input type="text" list="rp-heatmap-${i}" .value=${zone.entity} placeholder="sensor.temperatur_raum"
                  @change=${(e: Event) => this._updateHeatmapZone(i, { entity: (e.target as HTMLInputElement).value.trim() })} />
                <datalist id="rp-heatmap-${i}">
                  ${entityIds.slice(0, 200).map((eid) => html`<option value="${eid}">${getFriendlyName(this.hass!, eid)}</option>`)}
                </datalist>
                <div class="entity-coords" title="Punkt 1 (x,y)">
                  <input type="number" min="0" max="100" step="0.01" .value=${String(Number(zone.x1) ?? 0)} placeholder="x1"
                    @change=${(e: Event) => this._updateHeatmapZone(i, { x1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                  <input type="number" min="0" max="100" step="0.01" .value=${String(Number(zone.y1) ?? 0)} placeholder="y1"
                    @change=${(e: Event) => this._updateHeatmapZone(i, { y1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                </div>
                <div class="entity-coords" title="Punkt 2 (x,y)">
                  <input type="number" min="0" max="100" step="0.01" .value=${String(Number(zone.x2) ?? 100)} placeholder="x2"
                    @change=${(e: Event) => this._updateHeatmapZone(i, { x2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                  <input type="number" min="0" max="100" step="0.01" .value=${String(Number(zone.y2) ?? 100)} placeholder="y2"
                    @change=${(e: Event) => this._updateHeatmapZone(i, { y2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                </div>
                <input type="number" class="entity-opacity" min="0" max="1" step="0.01" .value=${String(Math.min(1, Math.max(0, Number(zone.opacity) ?? 0.4)))} title="Deckkraft"
                  @change=${(e: Event) => this._updateHeatmapZone(i, { opacity: Math.min(1, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0.4)) })} />
                <button type="button" class="btn-remove" @click=${() => this._removeHeatmapZone(i)} title="Zone entfernen">
                  <ha-icon icon="mdi:delete-outline"></ha-icon>
                </button>
              </div>
            `)}
          </div>
          <button type="button" class="btn-add" @click=${this._addHeatmapZone}>
            <ha-icon icon="mdi:plus"></ha-icon> Legacy-Zone hinzufügen
          </button>
        </section>
        <section class="editor-section">
          <h4 class="section-title"><ha-icon icon="mdi:bell-badge-outline"></ha-icon> Meldungen (Badge)</h4>
          <p class="section-hint">Entitäten für das Meldungs-Badge (z. B. Rauchmelder). Badge erscheint rechts in der Tab-Leiste, zeigt die Anzahl aktiver Meldungen (state on/triggered).</p>
          <div class="entity-list">
            ${(this._config.alert_entities ?? []).map((eid, i) => html`
              <div class="entity-row">
                <input type="text" list="rp-alert-${i}" .value=${eid} placeholder="binary_sensor.smoke_wohnzimmer"
                  @change=${(e: Event) => this._updateAlertEntity(i, (e.target as HTMLInputElement).value)} />
                <datalist id="rp-alert-${i}">
                  ${entityIds.slice(0, 200).map((id) => html`<option value="${id}">${getFriendlyName(this.hass!, id)}</option>`)}
                </datalist>
                <button type="button" class="btn-remove" @click=${() => this._removeAlertEntity(i)} title="Entfernen">
                  <ha-icon icon="mdi:delete-outline"></ha-icon>
                </button>
              </div>
            `)}
          </div>
          <button type="button" class="btn-add" @click=${this._addAlertEntity}>
            <ha-icon icon="mdi:plus"></ha-icon> Meldungs-Entität hinzufügen
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
      .entity-row select.entity-preset {
        width: auto;
        min-width: 100px;
      }
      .entity-coords {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      .entity-coords input {
        width: clamp(44px, 12vw, 52px);
      }
      .entity-boundaries {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        width: 100%;
      }
      .entity-boundaries .room-boundary {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .boundaries-label {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        margin-right: 4px;
        flex-shrink: 0;
      }
      .btn-add-small {
        padding: 6px 10px;
        border: 1px dashed var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 8px;
        background: transparent;
        color: var(--primary-color, #03a9f4);
        cursor: pointer;
        flex-shrink: 0;
      }
      .btn-add-small:hover {
        border-color: var(--primary-color, #03a9f4);
      }
      .editor-section.heatmap-legacy {
        opacity: 0.9;
      }
      .picker-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }
      .picker-modal {
        background: var(--ha-card-background, #1e1e1e);
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 16px;
        padding: 20px;
        max-width: min(96vw, 520px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }
      .picker-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }
      .picker-title {
        font-size: 1rem;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      .btn-cancel {
        padding: 8px 14px;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
        font-size: 0.85rem;
      }
      .btn-cancel:hover {
        background: rgba(255, 255, 255, 0.06);
      }
      .picker-image-wrap {
        position: relative;
        max-width: 100%;
        width: 100%;
        min-width: 280px;
        aspect-ratio: 16 / 10;
        max-height: min(60vh, 320px);
        border-radius: 10px;
        overflow: hidden;
        cursor: crosshair;
        background: var(--secondary-background-color, #2a2a2a);
      }
      .picker-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      .picker-overlay,
      .picker-overlay-existing {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
      .picker-overlay-existing {
        z-index: 1;
      }
      .picker-overlay {
        z-index: 2;
      }
      .btn-draw {
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid var(--primary-color, #03a9f4);
        background: rgba(3, 169, 244, 0.12);
        color: var(--primary-color, #03a9f4);
        cursor: pointer;
        flex-shrink: 0;
      }
      .btn-draw:hover {
        background: rgba(3, 169, 244, 0.2);
      }
      .btn-draw-small {
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px dashed var(--primary-color, #03a9f4);
        background: transparent;
        color: var(--primary-color, #03a9f4);
        cursor: pointer;
        font-size: 0.8rem;
      }
      .btn-draw-small:hover {
        background: rgba(3, 169, 244, 0.1);
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
