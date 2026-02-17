/**
 * Editor für die Raumplan-Karte
 */
import { LitElement, html, css, type TemplateResult, type CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, fireEvent, type LovelaceCardEditor } from 'custom-card-helpers';

import type { RoomPlanCardConfig, RoomPlanEntity, RoomPlanRoom, RoomPlanBuilding } from '../../lib/types';
import type { RoomBoundary } from '../../lib/utils';
import { getFriendlyName, getEntityBoundaries, isPolygonBoundary, getRooms, getRoomBoundingBox, getEffectiveCategories, getEntityCategoryId, getBuildings, getBuildingAndRoomIndex } from '../../lib/utils';

@customElement('room-plan-editor')
export class RoomPlanEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config: RoomPlanCardConfig = {
    type: '',
    image: '',
    rooms: [],
  };

  /** „Auf Plan einzeichnen“: roomIndex + entityIndex (in Raum) oder boundaryIndex (Raum-Zone). */
  @state() private _pickerFor:
    | { type: 'position'; roomIndex: number; entityIndex: number }
    | { type: 'rect'; roomIndex: number; boundaryIndex: number }
    | { type: 'rectNew'; roomIndex: number }
    | { type: 'polygon'; roomIndex: number; boundaryIndex: number }
    | { type: 'polygonNew'; roomIndex: number }
    | { type: 'line'; roomIndex: number; entityIndex: number; lineIndex: number }
    | { type: 'lineNew'; roomIndex: number; entityIndex: number }
    | null = null;
  /** Gebäude-Platzierung im Editor verschieben (Drag in Preview oder Vollbild). viewScale = 1 in Preview, im Vollbild die Skalierung des Layers. */
  @state() private _buildingDrag: { buildingIndex: number; startX: number; startY: number; startBX: number; startBY: number; previewW: number; previewH: number; viewScale: number } | null = null;
  /** Gebäude-Platzierung im Vollbild (buildingIndex wenn geöffnet). */
  @state() private _buildingPlacementPicker: number | null = null;
  /** Gesamtplan verschieben (alle Gebäude gemeinsam). */
  @state() private _planDrag: { startX: number; startY: number; startOffsetX: number; startOffsetY: number; previewW: number; previewH: number; viewScale: number } | null = null;
  @state() private _drawStart: { x: number; y: number } | null = null;
  @state() private _drawCurrent: { x: number; y: number } | null = null;
  /** Beim Polygon-Picker: gesetzte Punkte (Reihenfolge). */
  @state() private _pickerPolygonPoints: { x: number; y: number }[] = [];
  private _pickerImageNatural: { w: number; h: number } | null = null;
  @state() private _pickerImageAspect: number | null = null;
  /** Overlay-Ausschnitt in % der Wrap-Breite/Höhe, damit 0–100 % exakt wie in der Card (Bildinhalt object-fit: contain) */
  @state() private _pickerContentRect: { left: number; top: number; width: number; height: number } | null = null;
  /** Eingeklappte Räume (Indizes) zur Übersicht. */
  @state() private _roomCollapsed = new Set<number>();
  /** Eingeklappte Gebäude (Indizes) zur Übersicht. */
  @state() private _buildingCollapsed = new Set<number>();
  /** Neue Kategorie (ID / Label) beim Hinzufügen. */
  @state() private _newCategoryId = '';
  @state() private _newCategoryLabel = '';

  /** Beim Ziehen eines bestehenden Punkts (Position / Rechteck-Ecke / Linien-Endpunkt / Polygon-Ecke) */
  @state() private _pickerDrag:
    | { kind: 'position' }
    | { kind: 'rect'; boundaryIndex: number; corner: 0 | 1 }
    | { kind: 'line'; lineIndex: number; end: 0 | 1 }
    | { kind: 'polygon'; boundaryIndex: number; pointIndex: number }
    | null = null;
  private _pickerDocMove = (e: MouseEvent) => this._onPickerDocMove(e);
  private _pickerDocUp = () => this._onPickerDocUp();

  /** Debounce für X/Y-Input: Feinjustierung mit sofortiger Vorschau */
  private _xyDebounceTimer: number | null = null;
  private _xyPending: Map<string, { roomIndex: number; entityIndex: number; updates: Partial<RoomPlanEntity> }> = new Map();
  private static readonly XY_DEBOUNCE_MS = 250;

  private _scheduleXyUpdate(roomIndex: number, entityIndex: number, updates: Partial<RoomPlanEntity>): void {
    const key = `${roomIndex}-${entityIndex}`;
    const existing = this._xyPending.get(key);
    const merged = { ...existing?.updates, ...updates };
    this._xyPending.set(key, { roomIndex, entityIndex, updates: merged });
    if (this._xyDebounceTimer !== null) window.clearTimeout(this._xyDebounceTimer);
    this._xyDebounceTimer = window.setTimeout(() => this._flushXyPending(), RoomPlanEditor.XY_DEBOUNCE_MS);
  }

  private _flushXyPending(): void {
    this._xyDebounceTimer = null;
    this._xyPending.forEach(({ roomIndex, entityIndex, updates }) => {
      this._updateRoomEntity(roomIndex, entityIndex, updates);
    });
    this._xyPending.clear();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback?.();
    if (this._xyDebounceTimer !== null) {
      window.clearTimeout(this._xyDebounceTimer);
      this._xyDebounceTimer = null;
    }
    this._xyPending.clear();
    if (this._buildingDrag) {
      this._buildingDrag = null;
      document.removeEventListener('mousemove', this._buildingDragMove);
      document.removeEventListener('mouseup', this._buildingDragUp);
    }
  }

  public setConfig(config: RoomPlanCardConfig): void {
    const base = config ?? { type: '', image: '', rooms: [] };
    const img =
      typeof base.image === 'string'
        ? base.image
        : ((base.image as { location?: string } | undefined)?.location ?? '');
    let rooms = Array.isArray(base.rooms) ? base.rooms : [];
    if (rooms.length === 0 && Array.isArray(base.entities) && base.entities.length > 0) {
      const entities = base.entities.map((ent) => {
        if (ent.room_boundary && !(ent.room_boundaries?.length)) {
          return { ...ent, room_boundaries: [ent.room_boundary!] };
        }
        return { ...ent };
      });
      rooms = [{ name: '', boundary: [], entities }];
    }
    if (rooms.length === 0) rooms = [{ name: '', boundary: [], entities: [] }];
    const buildings = Array.isArray(base.buildings) ? base.buildings : undefined;
    this._config = {
      ...base,
      image: img,
      rooms,
      buildings,
      entities: undefined,
      entity_filter: Array.isArray(base.entity_filter) ? base.entity_filter : undefined,
      alert_entities: Array.isArray(base.alert_entities) ? base.alert_entities : undefined,
      alert_badge_action: base.alert_badge_action,
      categories: Array.isArray(base.categories) ? base.categories : undefined,
      image_dark: base.image_dark,
      dark_mode_filter: base.dark_mode_filter,
      dark_mode: base.dark_mode,
    };
  }

  private _getEffectiveCategories(): { id: string; label: string }[] {
    return getEffectiveCategories(this._config);
  }

  private _removeCategory(categoryId: string): void {
    const list = Array.isArray(this._config.categories) ? [...this._config.categories] : [];
    const next = list.filter((c) => c.id !== categoryId);
    this._updateConfig({ categories: next });
  }

  private _addCategory(): void {
    const id = this._newCategoryId.trim();
    const label = this._newCategoryLabel.trim();
    if (!id || !label) return;
    const list = Array.isArray(this._config.categories) ? [...this._config.categories] : [];
    if (list.some((c) => c.id === id)) return;
    list.push({ id, label });
    this._updateConfig({ categories: list });
    this._newCategoryId = '';
    this._newCategoryLabel = '';
  }

  private _emitConfig(): void {
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _updateConfig(updates: Partial<RoomPlanCardConfig>): void {
    this._config = { ...this._config, ...updates };
    this._emitConfig();
  }

  private _getRooms(): RoomPlanRoom[] {
    return getRooms(this._config);
  }

  private _getBuildings(): RoomPlanBuilding[] {
    return getBuildings(this._config);
  }

  private _updateRoom(roomIndex: number, updates: Partial<RoomPlanRoom>): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) =>
        bi !== buildingPos.buildingIndex
          ? b
          : {
              ...b,
              rooms: b.rooms.map((r, ri) =>
                ri !== buildingPos.roomIndexInBuilding ? r : { ...r, ...updates }
              ),
            }
      );
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    rooms[roomIndex] = { ...rooms[roomIndex], ...updates };
    this._updateConfig({ rooms });
  }

  private _addRoom(): void {
    const rooms = [...this._getRooms(), { name: '', boundary: [], entities: [] }];
    this._updateConfig({ rooms });
  }

  private _addRoomToBuilding(buildingIndex: number): void {
    const buildings = [...(this._config.buildings ?? [])];
    if (buildingIndex >= buildings.length) return;
    const building = buildings[buildingIndex];
    buildings[buildingIndex] = {
      ...building,
      rooms: [...(building.rooms ?? []), { name: '', boundary: [], entities: [] }],
    };
    this._updateConfig({ buildings });
  }

  private _removeRoom(roomIndex: number): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) =>
        bi !== buildingPos.buildingIndex
          ? b
          : { ...b, rooms: b.rooms.filter((_, ri) => ri !== buildingPos.roomIndexInBuilding) },
      );
      this._updateConfig({ buildings });
      return;
    }
    const rooms = this._getRooms().filter((_, i) => i !== roomIndex);
    this._updateConfig({ rooms: rooms.length ? rooms : [{ name: '', boundary: [], entities: [] }] });
  }

  private _removeBuilding(buildingIndex: number): void {
    const buildings = (this._config.buildings ?? []).filter((_, i) => i !== buildingIndex);
    this._updateConfig({ buildings });
  }

  private _updateBuilding(buildingIndex: number, updates: Partial<RoomPlanBuilding>): void {
    const buildings = [...(this._config.buildings ?? [])];
    if (buildingIndex >= buildings.length) return;
    buildings[buildingIndex] = { ...buildings[buildingIndex], ...updates };
    this._updateConfig({ buildings });
  }

  private _onBuildingImageLoad(buildingIndex: number, e: Event): void {
    const img = e.target as HTMLImageElement;
    if (img?.naturalWidth && img?.naturalHeight)
      this._updateBuilding(buildingIndex, { aspect_ratio: img.naturalWidth / img.naturalHeight });
  }

  private _addBuilding(): void {
    const buildings = [...(this._config.buildings ?? []), { name: '', image: '', x: 10, y: 10, width: 25, height: 25, rooms: [] }];
    this._updateConfig({ buildings });
  }

  private _startBuildingDrag(buildingIndex: number, e: MouseEvent, viewScale: number = 1): void {
    e.preventDefault();
    const preview = (e.target as HTMLElement).closest('.building-placement-wrap') as HTMLElement | null;
    if (!preview) return;
    const rect = preview.getBoundingClientRect();
    const b = this._getBuildings()[buildingIndex];
    if (!b) return;
    this._buildingDrag = {
      buildingIndex,
      startX: e.clientX,
      startY: e.clientY,
      startBX: Number(b.x) ?? 0,
      startBY: Number(b.y) ?? 0,
      previewW: rect.width,
      previewH: rect.height,
      viewScale,
    };
    document.addEventListener('mousemove', this._buildingDragMove);
    document.addEventListener('mouseup', this._buildingDragUp);
  }
  private _buildingDragMove = (e: MouseEvent): void => {
    const d = this._buildingDrag;
    if (!d) return;
    /* Im Vollbild ist der Layer mit viewScale skaliert → Maus-Delta durch viewScale teilen für korrekte %-Bewegung */
    const dx = ((e.clientX - d.startX) / d.previewW) * 100 / d.viewScale;
    const dy = ((e.clientY - d.startY) / d.previewH) * 100 / d.viewScale;
    const b = this._getBuildings()[d.buildingIndex];
    if (!b) return;
    const w = Number(b.width) ?? 20;
    const ar = Number(b.aspect_ratio) > 0 ? b.aspect_ratio! : null;
    const h = ar != null ? w / ar : (Number(b.height) ?? 20);
    const newX = Math.min(100 - w, Math.max(0, d.startBX + dx));
    const newY = Math.min(100 - h, Math.max(0, d.startBY + dy));
    this._updateBuilding(d.buildingIndex, { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
  };
  private _buildingDragUp = (): void => {
    this._buildingDrag = null;
    document.removeEventListener('mousemove', this._buildingDragMove);
    document.removeEventListener('mouseup', this._buildingDragUp);
  };

  private _startPlanDrag(e: MouseEvent, viewScale: number = 1): void {
    e.preventDefault();
    const wrap = (e.target as HTMLElement).closest('.building-placement-wrap') as HTMLElement | null;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const ox = Number(this._config.plan_offset_x) || 0;
    const oy = Number(this._config.plan_offset_y) || 0;
    this._planDrag = { startX: e.clientX, startY: e.clientY, startOffsetX: ox, startOffsetY: oy, previewW: rect.width, previewH: rect.height, viewScale };
    document.addEventListener('mousemove', this._planDragMove);
    document.addEventListener('mouseup', this._planDragUp);
  }
  private _planDragMove = (e: MouseEvent): void => {
    const d = this._planDrag;
    if (!d) return;
    const dx = ((e.clientX - d.startX) / d.previewW) * 100 / d.viewScale;
    const dy = ((e.clientY - d.startY) / d.previewH) * 100 / d.viewScale;
    const newX = Math.round((d.startOffsetX + dx) * 10) / 10;
    const newY = Math.round((d.startOffsetY + dy) * 10) / 10;
    this._updateConfig({ plan_offset_x: newX, plan_offset_y: newY });
  };
  private _planDragUp = (): void => {
    this._planDrag = null;
    document.removeEventListener('mousemove', this._planDragMove);
    document.removeEventListener('mouseup', this._planDragUp);
  };

  private _getRoomEntities(roomIndex: number): RoomPlanEntity[] {
    const rooms = this._getRooms();
    const room = rooms[roomIndex];
    return room?.entities ?? [];
  }

  private _updateRoomEntity(roomIndex: number, entityIndex: number, updates: Partial<RoomPlanEntity>): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const entities = [...(b.rooms[buildingPos.roomIndexInBuilding]?.entities ?? [])];
        if (entityIndex >= entities.length) return b;
        entities[entityIndex] = { ...entities[entityIndex], ...updates };
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], entities };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const entities = [...(rooms[roomIndex].entities ?? [])];
    if (entityIndex >= entities.length) return;
    entities[entityIndex] = { ...entities[entityIndex], ...updates };
    rooms[roomIndex] = { ...rooms[roomIndex], entities };
    this._updateConfig({ rooms });
  }

  private _removeRoomEntity(roomIndex: number, entityIndex: number): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const entities = (b.rooms[buildingPos.roomIndexInBuilding]?.entities ?? []).filter((_, i) => i !== entityIndex);
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], entities };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const entities = rooms[roomIndex].entities?.filter((_, i) => i !== entityIndex) ?? [];
    rooms[roomIndex] = { ...rooms[roomIndex], entities };
    this._updateConfig({ rooms });
  }

  private _addRoomEntity(roomIndex: number): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const entities = [...(b.rooms[buildingPos.roomIndexInBuilding]?.entities ?? []), { entity: '' }];
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], entities };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const entities = [...(rooms[roomIndex].entities ?? []), { entity: '' }];
    rooms[roomIndex] = { ...rooms[roomIndex], entities };
    this._updateConfig({ rooms });
  }

  private _getRoomBoundaries(roomIndex: number): RoomBoundary[] {
    const rooms = this._getRooms();
    const room = rooms[roomIndex];
    return Array.isArray(room?.boundary) ? room.boundary : [];
  }

  private _updateRoomBoundary(roomIndex: number, boundaryIndex: number, updates: Partial<RoomBoundary>): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const list = [...(b.rooms[buildingPos.roomIndexInBuilding]?.boundary ?? [])];
        if (boundaryIndex >= list.length) return b;
        list[boundaryIndex] = { ...list[boundaryIndex], ...updates };
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], boundary: list };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const list = [...this._getRoomBoundaries(roomIndex)];
    if (boundaryIndex >= list.length) return;
    list[boundaryIndex] = { ...list[boundaryIndex], ...updates };
    rooms[roomIndex] = { ...rooms[roomIndex], boundary: list };
    this._updateConfig({ rooms });
  }

  private _addRoomBoundary(roomIndex: number, isTemperature: boolean): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const list = [...(b.rooms[buildingPos.roomIndexInBuilding]?.boundary ?? [])];
        list.push(isTemperature ? { x1: 10, y1: 10, x2: 40, y2: 40, opacity: 0.4 } : { x1: 0, y1: 0, x2: 100, y2: 0 });
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], boundary: list };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const list = [...this._getRoomBoundaries(roomIndex)];
    list.push(isTemperature ? { x1: 10, y1: 10, x2: 40, y2: 40, opacity: 0.4 } : { x1: 0, y1: 0, x2: 100, y2: 0 });
    rooms[roomIndex] = { ...rooms[roomIndex], boundary: list };
    this._updateConfig({ rooms });
  }

  private _addRoomBoundaryPolygon(roomIndex: number, points: { x: number; y: number }[]): void {
    if (points.length < 3) return;
    const round = (v: number) => Math.round(v * 10) / 10;
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const list = [...(b.rooms[buildingPos.roomIndexInBuilding]?.boundary ?? [])];
        list.push({ points: points.map((p) => ({ x: round(p.x), y: round(p.y) })), opacity: 0.4 });
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], boundary: list };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const list = [...this._getRoomBoundaries(roomIndex)];
    list.push({ points: points.map((p) => ({ x: round(p.x), y: round(p.y) })), opacity: 0.4 });
    rooms[roomIndex] = { ...rooms[roomIndex], boundary: list };
    this._updateConfig({ rooms });
  }

  private _removeRoomBoundary(roomIndex: number, boundaryIndex: number): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const list = (b.rooms[buildingPos.roomIndexInBuilding]?.boundary ?? []).filter((_, i) => i !== boundaryIndex);
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], boundary: list };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const list = this._getRoomBoundaries(roomIndex).filter((_, i) => i !== boundaryIndex);
    rooms[roomIndex] = { ...rooms[roomIndex], boundary: list };
    this._updateConfig({ rooms });
  }

  /** Entity-Boundary (Fensterkontakt-Linien) – bleibt an der Entität. */
  private _updateEntityBoundary(roomIndex: number, entityIndex: number, boundaryIndex: number, updates: Partial<RoomBoundary>): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const entities = [...(b.rooms[buildingPos.roomIndexInBuilding]?.entities ?? [])];
        const ent = entities[entityIndex];
        if (!ent) return b;
        const list = [...getEntityBoundaries(ent)];
        if (boundaryIndex >= list.length) return b;
        list[boundaryIndex] = { ...list[boundaryIndex], ...updates };
        entities[entityIndex] = { ...ent, room_boundaries: list };
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], entities };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const entities = [...(rooms[roomIndex].entities ?? [])];
    const ent = entities[entityIndex];
    if (!ent) return;
    const list = [...getEntityBoundaries(ent)];
    if (boundaryIndex >= list.length) return;
    list[boundaryIndex] = { ...list[boundaryIndex], ...updates };
    entities[entityIndex] = { ...ent, room_boundaries: list };
    rooms[roomIndex] = { ...rooms[roomIndex], entities };
    this._updateConfig({ rooms });
  }

  private _addEntityBoundary(roomIndex: number, entityIndex: number, isTemperature: boolean): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const entities = [...(b.rooms[buildingPos.roomIndexInBuilding]?.entities ?? [])];
        const ent = entities[entityIndex];
        if (!ent) return b;
        const list = [...getEntityBoundaries(ent)];
        list.push(isTemperature ? { x1: 10, y1: 10, x2: 40, y2: 40, opacity: 0.4 } : { x1: 0, y1: 0, x2: 100, y2: 0 });
        entities[entityIndex] = { ...ent, room_boundaries: list };
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], entities };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const entities = [...(rooms[roomIndex].entities ?? [])];
    const ent = entities[entityIndex];
    if (!ent) return;
    const list = [...getEntityBoundaries(ent)];
    list.push(isTemperature ? { x1: 10, y1: 10, x2: 40, y2: 40, opacity: 0.4 } : { x1: 0, y1: 0, x2: 100, y2: 0 });
    entities[entityIndex] = { ...ent, room_boundaries: list };
    rooms[roomIndex] = { ...rooms[roomIndex], entities };
    this._updateConfig({ rooms });
  }

  private _addEntityBoundaryPolygon(roomIndex: number, entityIndex: number, points: { x: number; y: number }[]): void {
    if (points.length < 3) return;
    const round = (v: number) => Math.round(v * 10) / 10;
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const entities = [...(b.rooms[buildingPos.roomIndexInBuilding]?.entities ?? [])];
        const ent = entities[entityIndex];
        if (!ent) return b;
        const list = [...getEntityBoundaries(ent)];
        list.push({ points: points.map((p) => ({ x: round(p.x), y: round(p.y) })), opacity: 0.4 });
        entities[entityIndex] = { ...ent, room_boundaries: list };
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], entities };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const entities = [...(rooms[roomIndex].entities ?? [])];
    const ent = entities[entityIndex];
    if (!ent) return;
    const list = [...getEntityBoundaries(ent)];
    list.push({ points: points.map((p) => ({ x: round(p.x), y: round(p.y) })), opacity: 0.4 });
    entities[entityIndex] = { ...ent, room_boundaries: list };
    rooms[roomIndex] = { ...rooms[roomIndex], entities };
    this._updateConfig({ rooms });
  }

  private _removeEntityBoundary(roomIndex: number, entityIndex: number, boundaryIndex: number): void {
    const buildingPos = getBuildingAndRoomIndex(this._config, roomIndex);
    if (buildingPos) {
      const buildings = this._config.buildings!.map((b, bi) => {
        if (bi !== buildingPos.buildingIndex) return b;
        const entities = [...(b.rooms[buildingPos.roomIndexInBuilding]?.entities ?? [])];
        const ent = entities[entityIndex];
        if (!ent) return b;
        const next = getEntityBoundaries(ent).filter((_, i) => i !== boundaryIndex);
        const updated = next.length ? { ...ent, room_boundaries: next } : { ...ent, room_boundaries: undefined, room_boundary: undefined };
        entities[entityIndex] = updated;
        const rooms = [...b.rooms];
        rooms[buildingPos.roomIndexInBuilding] = { ...rooms[buildingPos.roomIndexInBuilding], entities };
        return { ...b, rooms };
      });
      this._updateConfig({ buildings });
      return;
    }
    const rooms = [...this._getRooms()];
    if (roomIndex >= rooms.length) return;
    const entities = [...(rooms[roomIndex].entities ?? [])];
    const ent = entities[entityIndex];
    if (!ent) return;
    const list = getEntityBoundaries(ent);
    if (boundaryIndex >= list.length) return;
    const next = list.filter((_, i) => i !== boundaryIndex);
    const updated = next.length ? { ...ent, room_boundaries: next } : { ...ent, room_boundaries: undefined, room_boundary: undefined };
    entities[entityIndex] = updated;
    rooms[roomIndex] = { ...rooms[roomIndex], entities };
    this._updateConfig({ rooms });
  }

  /** Koordinaten in % aus Klick/Drag relativ zum Plan-Bild (object-fit: contain) */
  private _getPercentFromEvent(e: MouseEvent): { x: number; y: number } | null {
    const target = e.currentTarget as HTMLElement;
    const img =
      (target?.querySelector?.('img') as HTMLImageElement) ||
      (target?.closest?.('.picker-image-wrap')?.querySelector?.('img') as HTMLImageElement) ||
      (target as HTMLImageElement);
    if (!img || !img.naturalWidth) return null;
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

  /** Wie _getPercentFromEvent, nutzt aber Picker-Img aus dem Shadow DOM (für Document-Mouse-Events beim Ziehen). */
  private _getPercentFromPickerEvent(e: MouseEvent): { x: number; y: number } | null {
    const wrap = this.renderRoot?.querySelector?.('.picker-image-wrap');
    const img = wrap?.querySelector?.('img') as HTMLImageElement | null;
    if (!img || !this._pickerImageNatural) return null;
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

  private _openPickerPosition(roomIndex: number, entityIndex: number): void {
    this._pickerFor = { type: 'position', roomIndex, entityIndex };
    this._drawStart = null;
    this._drawCurrent = null;
  }

  private _openPickerRect(roomIndex: number, boundaryIndex?: number): void {
    this._pickerFor =
      boundaryIndex !== undefined
        ? { type: 'rect', roomIndex, boundaryIndex }
        : { type: 'rectNew', roomIndex };
    this._drawStart = null;
    this._drawCurrent = null;
  }

  private _openPickerLine(roomIndex: number, entityIndex: number, lineIndex?: number): void {
    this._pickerFor =
      lineIndex !== undefined
        ? { type: 'line', roomIndex, entityIndex, lineIndex }
        : { type: 'lineNew', roomIndex, entityIndex };
    this._drawStart = null;
    this._drawCurrent = null;
  }

  private _openPickerPolygon(roomIndex: number, boundaryIndex?: number): void {
    if (boundaryIndex !== undefined) {
      const list = this._getRoomBoundaries(roomIndex);
      const b = list[boundaryIndex];
      this._pickerPolygonPoints = isPolygonBoundary(b) ? b.points.map((p) => ({ ...p })) : [];
      this._pickerFor = { type: 'polygon', roomIndex, boundaryIndex };
    } else {
      this._pickerPolygonPoints = [];
      this._pickerFor = { type: 'polygonNew', roomIndex };
    }
    this._drawStart = null;
    this._drawCurrent = null;
  }

  private _closePicker(): void {
    this._pickerFor = null;
    this._drawStart = null;
    this._drawCurrent = null;
    this._pickerPolygonPoints = [];
    this._pickerImageAspect = null;
    this._pickerContentRect = null;
    if (this._pickerDrag) {
      this._pickerDrag = null;
      document.removeEventListener('mousemove', this._pickerDocMove);
      document.removeEventListener('mouseup', this._pickerDocUp);
    }
  }

  private _startPickerDragPosition(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this._pickerFor || this._pickerFor.type !== 'position') return;
    this._pickerDrag = { kind: 'position' };
    document.addEventListener('mousemove', this._pickerDocMove);
    document.addEventListener('mouseup', this._pickerDocUp);
  }

  private _startPickerDragRect(boundaryIndex: number, corner: 0 | 1, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this._pickerFor || this._pickerFor.type !== 'rect') return;
    this._pickerDrag = { kind: 'rect', boundaryIndex, corner };
    document.addEventListener('mousemove', this._pickerDocMove);
    document.addEventListener('mouseup', this._pickerDocUp);
  }

  private _startPickerDragLine(lineIndex: number, end: 0 | 1, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this._pickerFor || this._pickerFor.type !== 'line') return;
    this._pickerDrag = { kind: 'line', lineIndex, end };
    document.addEventListener('mousemove', this._pickerDocMove);
    document.addEventListener('mouseup', this._pickerDocUp);
  }

  private _startPickerDragPolygon(boundaryIndex: number, pointIndex: number, e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this._pickerFor || this._pickerFor.type !== 'polygon') return;
    this._pickerDrag = { kind: 'polygon', boundaryIndex, pointIndex };
    document.addEventListener('mousemove', this._pickerDocMove);
    document.addEventListener('mouseup', this._pickerDocUp);
  }

  private _finishPickerPolygon(): void {
    if (!this._pickerFor || (this._pickerFor.type !== 'polygon' && this._pickerFor.type !== 'polygonNew')) return;
    if (this._pickerPolygonPoints.length < 3) return;
    const round = (v: number) => Math.round(v * 10) / 10;
    const points = this._pickerPolygonPoints.map((p) => ({ x: round(p.x), y: round(p.y) }));
    const roomIndex = this._pickerFor.roomIndex;
    if (this._pickerFor.type === 'polygon') {
      this._updateRoomBoundary(roomIndex, this._pickerFor.boundaryIndex, { points });
    } else {
      this._addRoomBoundaryPolygon(roomIndex, points);
    }
    this._closePicker();
  }

  private _onPickerDocMove(e: MouseEvent): void {
    const p = this._getPercentFromPickerEvent(e);
    if (!p || !this._pickerDrag || !this._pickerFor) return;
    const roomIndex = this._pickerFor.roomIndex;
    const round = (v: number) => Math.round(v * 10) / 10;
    if (this._pickerDrag.kind === 'position' && this._pickerFor.type === 'position') {
      const entityIndex = this._pickerFor.entityIndex;
      this._updateRoomEntity(roomIndex, entityIndex, { x: round(p.x), y: round(p.y) });
      return;
    }
    if (this._pickerDrag.kind === 'rect') {
      const boundaries = this._getRoomBoundaries(roomIndex);
      if (this._pickerDrag.boundaryIndex >= boundaries.length) return;
      const b = boundaries[this._pickerDrag.boundaryIndex] as { x1?: number; y1?: number; x2?: number; y2?: number };
      const x1 = this._pickerDrag.corner === 0 ? p.x : (b.x1 ?? 0);
      const y1 = this._pickerDrag.corner === 0 ? p.y : (b.y1 ?? 0);
      const x2 = this._pickerDrag.corner === 1 ? p.x : (b.x2 ?? 100);
      const y2 = this._pickerDrag.corner === 1 ? p.y : (b.y2 ?? 100);
      const rx1 = Math.min(x1, x2);
      const ry1 = Math.min(y1, y2);
      const rx2 = Math.max(x1, x2);
      const ry2 = Math.max(y1, y2);
      this._updateRoomBoundary(roomIndex, this._pickerDrag.boundaryIndex, {
        x1: round(rx1),
        y1: round(ry1),
        x2: round(rx2),
        y2: round(ry2),
      });
      return;
    }
    if (this._pickerDrag.kind === 'line' && this._pickerFor.type === 'line') {
      const entityIndex = this._pickerFor.entityIndex;
      const ent = this._getRoomEntities(roomIndex)[entityIndex];
      if (!ent) return;
      const boundaries = getEntityBoundaries(ent);
      if (this._pickerDrag.lineIndex >= boundaries.length) return;
      const b = boundaries[this._pickerDrag.lineIndex] as { x1?: number; y1?: number; x2?: number; y2?: number };
      const x1 = this._pickerDrag.end === 0 ? p.x : (b.x1 ?? 0);
      const y1 = this._pickerDrag.end === 0 ? p.y : (b.y1 ?? 0);
      const x2 = this._pickerDrag.end === 1 ? p.x : (b.x2 ?? 0);
      const y2 = this._pickerDrag.end === 1 ? p.y : (b.y2 ?? 0);
      this._updateEntityBoundary(roomIndex, entityIndex, this._pickerDrag.lineIndex, {
        x1: round(x1),
        y1: round(y1),
        x2: round(x2),
        y2: round(y2),
      });
      return;
    }
    if (this._pickerDrag.kind === 'polygon') {
      const idx = this._pickerDrag.pointIndex;
      const pts = [...this._pickerPolygonPoints];
      if (idx >= 0 && idx < pts.length) {
        pts[idx] = { x: round(p.x), y: round(p.y) };
        this._pickerPolygonPoints = pts;
        this._updateRoomBoundary(roomIndex, this._pickerDrag.boundaryIndex, { points: pts });
      }
    }
  }

  private _onPickerDocUp(): void {
    this._pickerDrag = null;
    document.removeEventListener('mousemove', this._pickerDocMove);
    document.removeEventListener('mouseup', this._pickerDocUp);
  }

  private _onPickerImageLoad(e: Event): void {
    const img = e.target as HTMLImageElement;
    if (!img?.naturalWidth || !img?.naturalHeight) return;
    this._pickerImageNatural = { w: img.naturalWidth, h: img.naturalHeight };
    this._pickerImageAspect = img.naturalWidth / img.naturalHeight;
    this._pickerContentRect = null;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const wrap = (img.closest && img.closest('.picker-image-wrap')) as HTMLElement | null;
    const measure = (): void => {
      if (!wrap || !this._pickerImageNatural) return;
      const wrapRect = wrap.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();
      const rw = imgRect.width;
      const rh = imgRect.height;
      const scale = Math.min(rw / nw, rh / nh);
      const contentW = nw * scale;
      const contentH = nh * scale;
      const contentLeft = imgRect.left + (rw - contentW) / 2;
      const contentTop = imgRect.top + (rh - contentH) / 2;
      const left = ((contentLeft - wrapRect.left) / wrapRect.width) * 100;
      const top = ((contentTop - wrapRect.top) / wrapRect.height) * 100;
      const width = (contentW / wrapRect.width) * 100;
      const height = (contentH / wrapRect.height) * 100;
      this._pickerContentRect = { left, top, width, height };
    };
    requestAnimationFrame(() => {
      measure();
      this.requestUpdate();
    });
  }

  private _onPickerImageClick(e: MouseEvent): void {
    e.preventDefault();
    const p = this._getPercentFromEvent(e) ?? this._getPercentFromPickerEvent(e);
    if (!p || !this._pickerFor) return;
    const roomIndex = this._pickerFor.roomIndex;
    if (this._pickerFor.type === 'position') {
      this._updateRoomEntity(roomIndex, this._pickerFor.entityIndex, { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });
      this._closePicker();
      return;
    }
    /* Polygon: nur beim Neu-Zeichnen (polygonNew) fügt ein Klick einen Punkt hinzu; beim Bearbeiten nur Verschieben */
    if (this._pickerFor.type === 'polygon' || this._pickerFor.type === 'polygonNew') {
      if (this._pickerFor.type === 'polygonNew') {
        this._pickerPolygonPoints = [...this._pickerPolygonPoints, { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }];
      }
      return;
    }
    /* Linie und Rechteck: zwei Klicks (Punkt – Punkt, Linie verbunden) */
    if (
      this._pickerFor.type === 'line' ||
      this._pickerFor.type === 'lineNew' ||
      this._pickerFor.type === 'rect' ||
      this._pickerFor.type === 'rectNew'
    ) {
      if (!this._drawStart) {
        this._drawStart = p;
        this._drawCurrent = p;
        return;
      }
      const x1 = this._drawStart.x;
      const y1 = this._drawStart.y;
      const x2 = p.x;
      const y2 = p.y;
      if (this._pickerFor.type === 'line' || this._pickerFor.type === 'lineNew') {
        const entityIndex = this._pickerFor.entityIndex;
        if (this._pickerFor.type === 'line') {
          this._updateEntityBoundary(roomIndex, entityIndex, this._pickerFor.lineIndex, { x1, y1, x2, y2 });
        } else {
          this._addEntityBoundary(roomIndex, entityIndex, false);
          const list = getEntityBoundaries(this._getRoomEntities(roomIndex)[entityIndex]!);
          this._updateEntityBoundary(roomIndex, entityIndex, list.length - 1, { x1, y1, x2, y2 });
        }
      } else {
        const rx1 = Math.min(x1, x2);
        const ry1 = Math.min(y1, y2);
        const rx2 = Math.max(x1, x2);
        const ry2 = Math.max(y1, y2);
        if (Math.abs(rx2 - rx1) < 1 && Math.abs(ry2 - ry1) < 1) {
          this._drawStart = null;
          this._drawCurrent = null;
          return;
        }
        if (this._pickerFor.type === 'rect') {
          this._updateRoomBoundary(roomIndex, this._pickerFor.boundaryIndex, {
            x1: rx1,
            y1: ry1,
            x2: rx2,
            y2: ry2,
            opacity: 0.4,
          });
        } else {
          this._addRoomBoundary(roomIndex, true);
          const list = this._getRoomBoundaries(roomIndex);
          this._updateRoomBoundary(roomIndex, list.length - 1, {
            x1: rx1,
            y1: ry1,
            x2: rx2,
            y2: ry2,
            opacity: 0.4,
          });
        }
      }
      this._closePicker();
    }
  }

  private _onPickerImageMouseMove(e: MouseEvent): void {
    const p = this._getPercentFromEvent(e);
    if (!this._pickerFor || !this._drawStart) return;
    if (
      this._pickerFor.type === 'line' ||
      this._pickerFor.type === 'lineNew' ||
      this._pickerFor.type === 'rect' ||
      this._pickerFor.type === 'rectNew'
    ) {
      this._drawCurrent = p ?? this._drawStart;
    }
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
    const rooms = this._getRooms();
    const entityIds = this.hass?.states ? Object.keys(this.hass.states).sort() : [];

    let pickerEntity: RoomPlanEntity | null = null;
    let pickerBoundaries: RoomBoundary[] = [];
    /** Picker-Bild: bei Raum in Gebäude das Gebäude-Bild, sonst globales Plan-Bild (damit Boundary-Picker auch mit nur Gebäuden funktioniert). */
    let pickerImg = img;
    if (this._pickerFor && 'roomIndex' in this._pickerFor) {
      const buildingPos = getBuildingAndRoomIndex(this._config, this._pickerFor.roomIndex);
      if (buildingPos) {
        const building = this._config.buildings?.[buildingPos.buildingIndex];
        pickerImg = typeof building?.image === 'string' ? building.image : '';
      }
      const ri = this._pickerFor.roomIndex;
      if (this._pickerFor.type === 'position' || this._pickerFor.type === 'line' || this._pickerFor.type === 'lineNew') {
        pickerEntity = this._getRoomEntities(ri)[this._pickerFor.entityIndex] ?? null;
        pickerBoundaries = pickerEntity ? getEntityBoundaries(pickerEntity) : [];
      } else {
        pickerBoundaries = this._getRoomBoundaries(ri);
      }
    }

    return html`
      <div class="editor">
        ${this._pickerFor && pickerImg ? html`
        <div class="picker-modal-backdrop" @click=${(e: MouseEvent) => e.target === e.currentTarget && this._closePicker()}>
          <div class="picker-modal" @click=${(e: MouseEvent) => e.stopPropagation()}>
            <div class="picker-header">
              <span class="picker-title">
                ${this._pickerFor.type === 'position'
                  ? (() => {
                      const r = this._getRooms()[this._pickerFor!.roomIndex];
                      const rel = r && getRoomBoundingBox(r) ? ' (X/Y relativ zum Raum)' : '';
                      return `Position: Punkt klicken oder ziehen${rel}`;
                    })()
                  : ''}
                ${this._pickerFor.type === 'rect' || this._pickerFor.type === 'rectNew' ? 'Zone: zwei Punkte klicken (Ecke – gegenüberliegende Ecke)' : ''}
                ${this._pickerFor.type === 'polygonNew' ? 'Polygon: Klicks setzen Punkte (mind. 3), dann Fertig' : ''}
                ${this._pickerFor.type === 'polygon' ? 'Polygon bearbeiten: Punkte verschieben, dann Fertig' : ''}
                ${this._pickerFor.type === 'line' || this._pickerFor.type === 'lineNew' ? 'Linie: zwei Punkte klicken (Start – Ende)' : ''}
              </span>
              ${this._pickerFor?.type === 'polygon' || this._pickerFor?.type === 'polygonNew'
                ? html`<button type="button" class="btn-confirm" ?disabled=${this._pickerPolygonPoints.length < 3} @click=${() => this._finishPickerPolygon()}>Fertig</button>`
                : ''}
              <button type="button" class="btn-cancel" @click=${() => this._closePicker()}>Abbrechen</button>
            </div>
            <div
              class="picker-image-wrap"
              style=${this._pickerImageAspect != null ? `aspect-ratio: ${this._pickerImageAspect}` : ''}
              @mousedown=${(e: MouseEvent) => e.preventDefault()}
              @mousemove=${(e: MouseEvent) => this._onPickerImageMouseMove(e)}
              @mouseleave=${() => { this._drawStart = null; this._drawCurrent = null; }}
              @click=${(e: MouseEvent) => this._onPickerImageClick(e)}
            >
              <div class="picker-image-layer">
                <img
                  class="picker-image"
                  src=${pickerImg}
                  alt="Plan"
                  draggable="false"
                  @load=${(e: Event) => this._onPickerImageLoad(e)}
                />
              </div>
              <div class="picker-overlay-layer" style=${this._pickerContentRect
                ? `left:${this._pickerContentRect.left}%;top:${this._pickerContentRect.top}%;width:${this._pickerContentRect.width}%;height:${this._pickerContentRect.height}%`
                : 'left:0;top:0;width:100%;height:100%'}
                @click=${(e: MouseEvent) => {
                  const handle = e.target === e.currentTarget ||
                    this._pickerFor?.type === 'rectNew' || this._pickerFor?.type === 'lineNew' || this._pickerFor?.type === 'polygonNew';
                  if (handle) {
                    this._onPickerImageClick(e);
                    e.stopPropagation();
                  }
                }}>
                ${(this._pickerFor?.type === 'polygon' || this._pickerFor?.type === 'polygonNew') && this._pickerPolygonPoints.length > 0 ? (() => {
                  const pts = this._pickerPolygonPoints;
                  const stopClick = (ev: MouseEvent) => { ev.preventDefault(); ev.stopPropagation(); };
                  const canDrag = this._pickerFor?.type === 'polygon';
                  return html`
                    ${pts.length >= 2 ? pts.map((pt, pi) => pi === 0 ? null : html`
                      <div class="picker-line ${canDrag ? 'editing' : ''}" style="left:${pts[pi-1].x}%;top:${pts[pi-1].y}%;width:${Math.hypot(pt.x - pts[pi-1].x, pt.y - pts[pi-1].y)}%;transform:rotate(${Math.atan2(pt.y - pts[pi-1].y, pt.x - pts[pi-1].x) * (180/Math.PI)}deg)"></div>
                    `).filter(Boolean) : ''}
                    ${pts.length >= 3 ? html`<div class="picker-line ${canDrag ? 'editing' : ''}" style="left:${pts[pts.length-1].x}%;top:${pts[pts.length-1].y}%;width:${Math.hypot(pts[0].x - pts[pts.length-1].x, pts[0].y - pts[pts.length-1].y)}%;transform:rotate(${Math.atan2(pts[0].y - pts[pts.length-1].y, pts[0].x - pts[pts.length-1].x) * (180/Math.PI)}deg)"></div>` : ''}
                    ${pts.map((pt, pi) => html`
                      <div class="picker-point ${canDrag ? 'draggable' : ''}" style="left:${pt.x}%;top:${pt.y}%"
                        @mousedown=${canDrag ? (ev: MouseEvent) => { if (this._pickerFor?.type === 'polygon') this._startPickerDragPolygon(this._pickerFor.boundaryIndex, pi, ev); } : undefined} @click=${canDrag ? stopClick : undefined}></div>
                    `)}
                  `;
                })() : ''}
                ${this._pickerFor?.type === 'position' && pickerEntity && Number(pickerEntity.x) != null && Number(pickerEntity.y) != null
                  ? (() => {
                      const px = Math.min(100, Math.max(0, Number(pickerEntity.x) ?? 50));
                      const py = Math.min(100, Math.max(0, Number(pickerEntity.y) ?? 50));
                      return html`<div class="picker-point draggable" style="left:${px}%;top:${py}%"
                        @mousedown=${(e: MouseEvent) => this._startPickerDragPosition(e)} @click=${(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}></div>`;
                    })()
                  : ''}
                ${(this._pickerFor?.type === 'rect' || this._pickerFor?.type === 'rectNew' || this._pickerFor?.type === 'line' || this._pickerFor?.type === 'lineNew') ? pickerBoundaries.map((b, bi) => {
                  if (this._pickerFor?.type === 'rect' || this._pickerFor?.type === 'rectNew') { if (isPolygonBoundary(b)) return null; }
                  const isEditing = this._pickerFor?.type === 'rect' && this._pickerFor.boundaryIndex === bi
                    || this._pickerFor?.type === 'line' && this._pickerFor.lineIndex === bi;
                  const stopClick = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
                  const br = b as { x1?: number; y1?: number; x2?: number; y2?: number };
                  if (this._pickerFor?.type === 'line' || this._pickerFor?.type === 'lineNew') {
                    const len = Math.hypot((br.x2 ?? 0) - (br.x1 ?? 0), (br.y2 ?? 0) - (br.y1 ?? 0)) || 1;
                    const ang = Math.atan2((br.y2 ?? 0) - (br.y1 ?? 0), (br.x2 ?? 0) - (br.x1 ?? 0)) * (180 / Math.PI);
                    const canDrag = this._pickerFor?.type === 'line';
                    return html`
                      <div class="picker-line ${isEditing ? 'editing' : ''}" style="left:${br.x1}%;top:${br.y1}%;width:${len}%;transform:rotate(${ang}deg)"></div>
                      <div class="picker-point ${canDrag ? 'draggable' : ''}" style="left:${br.x1}%;top:${br.y1}%"
                        @mousedown=${canDrag ? (e: MouseEvent) => this._startPickerDragLine(bi, 0, e) : undefined} @click=${canDrag ? stopClick : undefined}></div>
                      <div class="picker-point ${canDrag ? 'draggable' : ''}" style="left:${br.x2}%;top:${br.y2}%"
                        @mousedown=${canDrag ? (e: MouseEvent) => this._startPickerDragLine(bi, 1, e) : undefined} @click=${canDrag ? stopClick : undefined}></div>`;
                  }
                  const left = Math.min(br.x1 ?? 0, br.x2 ?? 100);
                  const top = Math.min(br.y1 ?? 0, br.y2 ?? 100);
                  const w = Math.abs((br.x2 ?? 100) - (br.x1 ?? 0)) || 1;
                  const h = Math.abs((br.y2 ?? 100) - (br.y1 ?? 0)) || 1;
                  const canDrag = this._pickerFor?.type === 'rect';
                  return html`
                    <div class="picker-rect ${isEditing ? 'editing' : ''}" style="left:${left}%;top:${top}%;width:${w}%;height:${h}%"></div>
                    <div class="picker-point ${canDrag ? 'draggable' : ''}" style="left:${left}%;top:${top}%"
                      @mousedown=${canDrag ? (e: MouseEvent) => this._startPickerDragRect(bi, 0, e) : undefined} @click=${canDrag ? stopClick : undefined}></div>
                    <div class="picker-point ${canDrag ? 'draggable' : ''}" style="left:${left + w}%;top:${top + h}%"
                      @mousedown=${canDrag ? (e: MouseEvent) => this._startPickerDragRect(bi, 1, e) : undefined} @click=${canDrag ? stopClick : undefined}></div>`;
                }) : ''}
                ${this._drawStart && this._drawCurrent ? (this._pickerFor?.type === 'rect' || this._pickerFor?.type === 'rectNew'
                  ? (() => {
                      const l = Math.min(this._drawStart.x, this._drawCurrent.x);
                      const t = Math.min(this._drawStart.y, this._drawCurrent.y);
                      const w = Math.abs(this._drawCurrent.x - this._drawStart.x) || 1;
                      const h = Math.abs(this._drawCurrent.y - this._drawStart.y) || 1;
                      return html`
                        <div class="picker-rect draw-preview" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%"></div>
                        <div class="picker-point draw-preview" style="left:${this._drawStart.x}%;top:${this._drawStart.y}%"></div>
                        <div class="picker-point draw-preview" style="left:${this._drawCurrent.x}%;top:${this._drawCurrent.y}%"></div>`;
                    })()
                  : (this._pickerFor?.type === 'line' || this._pickerFor?.type === 'lineNew')
                    ? (() => {
                        const len = Math.hypot(this._drawCurrent.x - this._drawStart.x, this._drawCurrent.y - this._drawStart.y) || 1;
                        const ang = Math.atan2(this._drawCurrent.y - this._drawStart.y, this._drawCurrent.x - this._drawStart.x) * (180 / Math.PI);
                        return html`
                          <div class="picker-line draw-preview" style="left:${this._drawStart.x}%;top:${this._drawStart.y}%;width:${len}%;transform:rotate(${ang}deg)"></div>
                          <div class="picker-point draw-preview" style="left:${this._drawStart.x}%;top:${this._drawStart.y}%"></div>
                          <div class="picker-point draw-preview" style="left:${this._drawCurrent.x}%;top:${this._drawCurrent.y}%"></div>`;
                      })()
                    : '') : ''}
              </div>
            </div>
          </div>
        </div>
        ` : ''}
        ${this._buildingPlacementPicker !== null ? (() => {
          const buildings = this._getBuildings();
          const offsetX = Number(this._config.plan_offset_x) || 0;
          const offsetY = Number(this._config.plan_offset_y) || 0;
          let left = 100, top = 100, right = 0, bottom = 0;
          for (const b of buildings) {
            const x = (Number(b.x) ?? 0) + offsetX;
            const y = (Number(b.y) ?? 0) + offsetY;
            const w = Number(b.width) ?? 20;
            const ar = Number(b.aspect_ratio) > 0 ? b.aspect_ratio! : null;
            const h = ar != null ? w / ar : (Number(b.height) ?? 20);
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x + w);
            bottom = Math.max(bottom, y + h);
          }
          const boxW = Math.max(0.1, right - left);
          const boxH = Math.max(0.1, bottom - top);
          const cx = (left + right) / 2;
          const cy = (top + bottom) / 2;
          const viewScale = Math.min(5, Math.max(1, 100 / boxW, 100 / boxH));
          return html`
        <div class="picker-modal-backdrop" @click=${(e: MouseEvent) => e.target === e.currentTarget && (this._buildingPlacementPicker = null)}>
          <div class="picker-modal" @click=${(e: MouseEvent) => e.stopPropagation()}>
            <div class="picker-header">
              <span class="picker-title">Plan positionieren – alle Gebäude bewegbar, leerer Bereich = Gesamtplan verschieben</span>
              <button type="button" class="btn-cancel" @click=${() => { this._buildingPlacementPicker = null; }}>Schließen</button>
            </div>
            <div
              class="building-placement-wrap building-placement-fullscreen"
              style="position: relative; flex: 1; min-height: 0; width: 100%; max-width: 100%; aspect-ratio: ${Number(this._config.plan_aspect_ratio) > 0 ? this._config.plan_aspect_ratio : 16/9}; border-radius: 8px; overflow: hidden; background: transparent; ${this._planDrag || this._buildingDrag ? 'cursor: grabbing;' : 'cursor: default;'}"
              @mousedown=${(ev: MouseEvent) => { if (!(ev.target as HTMLElement).closest('.building-box')) this._startPlanDrag(ev, viewScale); }}
            >
              <div class="building-placement-inner" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; transform: translate(${50 - cx}%, ${50 - cy}%) scale(${viewScale}); transform-origin: 50% 50%;">
                ${buildings.map((b, bj) => {
                  const rot = Number(b.rotation) ?? 0;
                  const scale = Math.max(0.25, Math.min(3, Number(b.scale) ?? 1));
                  const w = Number(b.width) ?? 20;
                  const ar = Number(b.aspect_ratio) > 0 ? b.aspect_ratio! : null;
                  const h = ar != null ? w / ar : (Number(b.height) ?? 20);
                  const leftPct = (Number(b.x) ?? 0) + offsetX;
                  const topPct = (Number(b.y) ?? 0) + offsetY;
                  const imgSrc = typeof b.image === 'string' ? b.image : '';
                  return html`
                    <div class="building-box"
style="position: absolute; left: ${leftPct}%; top: ${topPct}%; width: ${w}%; height: ${h}%; transform: scale(${scale}) rotate(${rot}deg); transform-origin: 50% 50%; overflow: hidden; box-sizing: border-box; outline: 1px solid var(--divider-color); outline-offset: 0; pointer-events: auto; cursor: grab; display: flex; align-items: center; justify-content: center; background: transparent !important;"
                    aria-hidden
                    @mousedown=${(ev: MouseEvent) => { ev.stopPropagation(); this._startBuildingDrag(bj, ev, viewScale); }}
                    >
                      ${imgSrc ? html`<img src="${imgSrc}" alt="" style="width: 100%; height: 100%; object-fit: ${ar != null ? 'fill' : 'contain'}; object-position: center; display: block; pointer-events: none;" @load=${(e: Event) => this._onBuildingImageLoad(bj, e)} />` : ''}
                    </div>
                  `;
                })}
              </div>
            </div>
          </div>
        </div>
          `;
        })() : ''}
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
          <h4 class="section-title"><ha-icon icon="mdi:tag-multiple"></ha-icon> Kategorien (Filter-Tabs)</h4>
          <p class="section-hint">Kategorien erscheinen als Tabs. Entitäten mit derselben Kategorie werden gemeinsam ein-/ausgeblendet. Standard-Kategorien sind entfernbar.</p>
          <div class="entity-boundaries" style="margin-bottom: 10px;">
            ${this._getEffectiveCategories().map((c) => html`
              <span class="category-chip" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; margin: 4px; border-radius: 8px; background: var(--secondary-background-color); border: 1px solid var(--divider-color);">
                <span>${c.label}</span>
                <button type="button" class="btn-remove" title="Kategorie entfernen" @click=${() => this._removeCategory(c.id)}><ha-icon icon="mdi:close"></ha-icon></button>
              </span>
            `)}
          </div>
          <div class="entity-coords-wrap" style="flex-wrap: wrap; gap: 8px; align-items: center;">
            <input type="text" .value=${this._newCategoryId} @input=${(e: Event) => { this._newCategoryId = (e.target as HTMLInputElement).value; }} placeholder="ID (z. B. lights)"
              style="width: 120px;" />
            <input type="text" .value=${this._newCategoryLabel} @input=${(e: Event) => { this._newCategoryLabel = (e.target as HTMLInputElement).value; }} placeholder="Anzeigename"
              style="width: 140px;" />
            <button type="button" class="btn-add-small" @click=${() => this._addCategory()}><ha-icon icon="mdi:plus"></ha-icon> Kategorie hinzufügen</button>
          </div>
        </section>
        <section class="editor-section">
          ${this._getBuildings().length > 0 ? html`
          <h4 class="section-title"><ha-icon icon="mdi:office-building"></ha-icon> Gebäude</h4>
          <p class="section-hint">Gebäude haben ein eigenes Bild und werden auf dem Hauptplan positioniert. Die Räume liegen in den jeweiligen Gebäuden.</p>
          <div class="entity-coords-wrap" style="flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px;">
            <span class="boundaries-label">Plan-Seitenverhältnis (Breite/Höhe, für exakte Übereinstimmung mit Card):</span>
            <input type="number" step="0.01" min="0.5" max="3" .value=${String(Number(this._config.plan_aspect_ratio) || 1.78)} placeholder="1.78" style="width: 64px;"
              @change=${(e: Event) => this._updateConfig({ plan_aspect_ratio: Math.max(0.5, Math.min(3, parseFloat((e.target as HTMLInputElement).value) || 1.78)) })} />
            <span class="hint" style="font-size: 0.8rem;">(1.78 = 16:9, 1 = Quadrat)</span>
          </div>
          <div class="entity-coords-wrap" style="flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px;">
            <span class="boundaries-label">Plan verschieben (ganze Karte, alle Gebäude gemeinsam):</span>
            <input type="number" step="0.1" .value=${String(Number(this._config.plan_offset_x) || 0)} placeholder="X" style="width: 56px;"
              @change=${(e: Event) => this._updateConfig({ plan_offset_x: parseFloat((e.target as HTMLInputElement).value) || 0 })} />
            <input type="number" step="0.1" .value=${String(Number(this._config.plan_offset_y) || 0)} placeholder="Y" style="width: 56px;"
              @change=${(e: Event) => this._updateConfig({ plan_offset_y: parseFloat((e.target as HTMLInputElement).value) || 0 })} />
          </div>
          <div class="boundaries-label" style="margin-bottom: 4px;">Positionierung (alle Gebäude sichtbar und bewegbar – leerer Bereich ziehen = Plan verschieben):</div>
          <div
            class="building-placement-wrap building-placement-preview"
            style="position: relative; width: 100%; max-width: 500px; aspect-ratio: ${Number(this._config.plan_aspect_ratio) > 0 ? this._config.plan_aspect_ratio : 16/9}; background: transparent; border: 1px solid var(--divider-color); border-radius: 8px; overflow: hidden; margin-bottom: 6px; ${this._planDrag ? 'cursor: grabbing;' : this._buildingDrag ? 'cursor: grabbing;' : 'cursor: default;'}"
            @mousedown=${(ev: MouseEvent) => { if (!(ev.target as HTMLElement).closest('.building-box')) this._startPlanDrag(ev); }}
          >
            ${((): unknown => {
              const offsetX = Number(this._config.plan_offset_x) || 0;
              const offsetY = Number(this._config.plan_offset_y) || 0;
              return this._getBuildings().map((b, bj) => {
                const rot = Number(b.rotation) ?? 0;
                const scale = Math.max(0.25, Math.min(3, Number(b.scale) ?? 1));
                const w = Number(b.width) ?? 20;
                const ar = Number(b.aspect_ratio) > 0 ? b.aspect_ratio! : null;
                const h = ar != null ? w / ar : (Number(b.height) ?? 20);
                const leftPct = (Number(b.x) ?? 0) + offsetX;
                const topPct = (Number(b.y) ?? 0) + offsetY;
                const imgSrc = typeof b.image === 'string' ? b.image : '';
                return html`
                  <div class="building-box"
                    style="position: absolute; left: ${leftPct}%; top: ${topPct}%; width: ${w}%; height: ${h}%; transform: scale(${scale}) rotate(${rot}deg); transform-origin: 50% 50%; overflow: hidden; box-sizing: border-box; outline: 1px solid var(--divider-color); outline-offset: 0; pointer-events: auto; cursor: grab; display: flex; align-items: center; justify-content: center; background: transparent !important;"
                    aria-hidden
                    @mousedown=${(e: MouseEvent) => { e.stopPropagation(); this._startBuildingDrag(bj, e); }}
                  >
                    ${imgSrc ? html`<img src="${imgSrc}" alt="" style="width: 100%; height: 100%; object-fit: ${ar != null ? 'fill' : 'contain'}; object-position: center; display: block; pointer-events: none;" @load=${(ev: Event) => this._onBuildingImageLoad(bj, ev)} />` : ''}
                  </div>
                `;
              });
            })()}
          </div>
          <button type="button" class="btn-draw" style="margin-bottom: 12px;" @click=${() => { this._buildingPlacementPicker = 0; }} title="Positionierung im Vollbild">
            <ha-icon icon="mdi:fullscreen"></ha-icon> Im Vollbild positionieren
          </button>
          <div class="room-list">
            ${this._getBuildings().map((building, bi) => html`
              <div class="room-block building-block">
                <div class="room-header">
                  <button type="button" class="btn-collapse" title="${this._buildingCollapsed.has(bi) ? 'Aufklappen' : 'Einklappen'}"
                    @click=${() => { const s = new Set(this._buildingCollapsed); if (s.has(bi)) s.delete(bi); else s.add(bi); this._buildingCollapsed = s; }}>
                    <ha-icon icon="${this._buildingCollapsed.has(bi) ? 'mdi:chevron-right' : 'mdi:chevron-down'}"></ha-icon>
                  </button>
                  <input type="text" class="room-name" .value=${building.name ?? ''} placeholder="Gebäudename (optional)"
                    @change=${(e: Event) => this._updateBuilding(bi, { name: (e.target as HTMLInputElement).value.trim() || undefined })} />
                  <button type="button" class="btn-remove" @click=${() => this._removeBuilding(bi)} title="Gebäude entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                </div>
                <div class="room-body ${this._buildingCollapsed.has(bi) ? 'collapsed' : ''}">
                  <div class="field" style="margin-bottom: 8px;">
                    <label>Bild-URL des Gebäudeplans</label>
                    <input type="text" .value=${building.image ?? ''} placeholder="/local/gebaeude_a.png"
                      @change=${(e: Event) => this._updateBuilding(bi, { image: (e.target as HTMLInputElement).value.trim() })} />
                  </div>
                  <div class="entity-coords-wrap" style="flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px;">
                    <span class="boundaries-label">Position auf Plan (%):</span>
                    <input type="number" min="0" max="100" step="0.1" .value=${String(Number(building.x) ?? 0)} placeholder="x" style="width: 56px;"
                      @change=${(e: Event) => this._updateBuilding(bi, { x: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                    <input type="number" min="0" max="100" step="0.1" .value=${String(Number(building.y) ?? 0)} placeholder="y" style="width: 56px;"
                      @change=${(e: Event) => this._updateBuilding(bi, { y: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                    <input type="number" min="1" max="100" step="0.1" .value=${String(Number(building.width) ?? 20)} placeholder="Breite" style="width: 56px;"
                      @change=${(e: Event) => this._updateBuilding(bi, { width: Math.min(100, Math.max(1, parseFloat((e.target as HTMLInputElement).value) || 20)) })} />
                    <input type="number" min="1" max="100" step="0.1" .value=${String(Number(building.height) ?? 20)} placeholder="Höhe" style="width: 56px;"
                      @change=${(e: Event) => this._updateBuilding(bi, { height: Math.min(100, Math.max(1, parseFloat((e.target as HTMLInputElement).value) || 20)) })} />
                  </div>
                  <div class="entity-coords-wrap" style="flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px;">
                    <span class="boundaries-label">Drehung (Grad):</span>
                    <input type="number" min="0" max="360" step="15" .value=${String(Number(building.rotation) ?? 0)} placeholder="0" style="width: 56px;"
                      @change=${(e: Event) => this._updateBuilding(bi, { rotation: (parseFloat((e.target as HTMLInputElement).value) || 0) % 360 })} />
                  </div>
                  <div class="entity-coords-wrap" style="flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px;">
                    <span class="boundaries-label">Skalierung (1 = 100 %):</span>
                    <input type="number" min="0.25" max="3" step="0.1" .value=${String(Number(building.scale) ?? 1)} placeholder="1" style="width: 56px;"
                      @change=${(e: Event) => this._updateBuilding(bi, { scale: Math.min(3, Math.max(0.25, parseFloat((e.target as HTMLInputElement).value) || 1)) })} />
                  </div>
                  <span class="boundaries-label">Räume in diesem Gebäude:</span>
                  ${(building.rooms ?? []).map((room, ri) => {
                    const globalRoomIndex = this._getBuildings().slice(0, bi).reduce((acc, b) => acc + (b.rooms?.length ?? 0), 0) + ri;
                    return html`
              <div class="room-block">
                <div class="room-header">
                  <button type="button" class="btn-collapse" title="${this._roomCollapsed.has(globalRoomIndex) ? 'Aufklappen' : 'Einklappen'}"
                    @click=${() => { const s = new Set(this._roomCollapsed); if (s.has(globalRoomIndex)) s.delete(globalRoomIndex); else s.add(globalRoomIndex); this._roomCollapsed = s; }}>
                    <ha-icon icon="${this._roomCollapsed.has(globalRoomIndex) ? 'mdi:chevron-right' : 'mdi:chevron-down'}"></ha-icon>
                  </button>
                  <input type="text" class="room-name" .value=${room.name ?? ''} placeholder="Raumname (optional)"
                    @change=${(e: Event) => this._updateRoom(globalRoomIndex, { name: (e.target as HTMLInputElement).value.trim() || undefined })} />
                  <button type="button" class="btn-remove" @click=${() => this._removeRoom(globalRoomIndex)} title="Raum entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                </div>
                <div class="room-body ${this._roomCollapsed.has(globalRoomIndex) ? 'collapsed' : ''}">
                <div class="room-boundaries" title="Grenze / Heatmap-Zone dieses Raums (Rechteck oder Polygon)">
                  <span class="boundaries-label">Boundary (Raum/Heatmap):</span>
                  ${this._getRoomBoundaries(globalRoomIndex).map((b, bbi) => {
                    if (isPolygonBoundary(b)) {
                      return html`
                    <div class="entity-coords room-boundary">
                      <span class="boundary-type">Polygon (${b.points.length} Ecken)</span>
                      <input type="number" min="0" max="1" step="0.01" class="entity-opacity" .value=${String(Math.min(1, Math.max(0, Number(b.opacity) ?? 0.4)))} title="Deckkraft"
                        @change=${(e: Event) => this._updateRoomBoundary(globalRoomIndex, bbi, { opacity: Math.min(1, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0.4)) })} />
                      <button type="button" class="btn-draw" @click=${() => this._openPickerPolygon(globalRoomIndex, bbi)} title="Polygon bearbeiten"><ha-icon icon="mdi:vector-polygon"></ha-icon></button>
                      <button type="button" class="btn-remove" @click=${() => this._removeRoomBoundary(globalRoomIndex, bbi)} title="Zone entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                  `;
                    }
                    const r = b as { x1: number; y1: number; x2: number; y2: number; opacity?: number };
                    return html`
                    <div class="entity-coords room-boundary">
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(r.x1) ?? 0)} placeholder="x1"
                        @change=${(e: Event) => this._updateRoomBoundary(globalRoomIndex, bbi, { x1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(r.y1) ?? 0)} placeholder="y1"
                        @change=${(e: Event) => this._updateRoomBoundary(globalRoomIndex, bbi, { y1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(r.x2) ?? 100)} placeholder="x2"
                        @change=${(e: Event) => this._updateRoomBoundary(globalRoomIndex, bbi, { x2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(r.y2) ?? 100)} placeholder="y2"
                        @change=${(e: Event) => this._updateRoomBoundary(globalRoomIndex, bbi, { y2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <input type="number" min="0" max="1" step="0.01" class="entity-opacity" .value=${String(Math.min(1, Math.max(0, Number(r.opacity) ?? 0.4)))} title="Deckkraft"
                        @change=${(e: Event) => this._updateRoomBoundary(globalRoomIndex, bbi, { opacity: Math.min(1, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0.4)) })} />
                      <button type="button" class="btn-draw" @click=${() => this._openPickerRect(globalRoomIndex, bbi)} title="Rechteck bearbeiten"><ha-icon icon="mdi:draw"></ha-icon></button>
                      <button type="button" class="btn-remove" @click=${() => this._removeRoomBoundary(globalRoomIndex, bbi)} title="Zone entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                  `;
                  })}
                  <button type="button" class="btn-add-small" @click=${() => this._addRoomBoundary(globalRoomIndex, true)} title="Rechteck-Zone"><ha-icon icon="mdi:plus"></ha-icon></button>
                  <button type="button" class="btn-draw-small" @click=${() => this._openPickerRect(globalRoomIndex)} title="Rechteck zeichnen"><ha-icon icon="mdi:draw"></ha-icon> Rechteck</button>
                  <button type="button" class="btn-draw-small" @click=${() => this._openPickerPolygon(globalRoomIndex)} title="Polygon zeichnen"><ha-icon icon="mdi:vector-polygon"></ha-icon> Polygon</button>
                </div>
                <div class="room-entities">
                  <span class="boundaries-label">Entitäten im Raum:</span>
                  ${(room.entities ?? []).map((ent, ei) => html`
              <div class="entity-row">
                <input type="text" list="rp-entities-${globalRoomIndex}-${ei}" .value=${ent.entity} placeholder="light.wohnzimmer"
                  @change=${(e: Event) => this._updateRoomEntity(globalRoomIndex, ei, { entity: (e.target as HTMLInputElement).value.trim() })} />
                <datalist id="rp-entities-${globalRoomIndex}-${ei}">
                  ${entityIds.slice(0, 200).map((eid) => html`<option value="${eid}">${getFriendlyName(this.hass, eid)}</option>`)}
                </datalist>
                <input type="text" class="entity-icon" .value=${ent.icon ?? ''} placeholder="Icon (mdi:...)"
                  @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); this._updateRoomEntity(globalRoomIndex, ei, { icon: v || undefined }); }} />
                <select class="entity-preset" .value=${ent.preset ?? 'default'}
                  @change=${(e: Event) => {
                    const preset = (e.target as HTMLSelectElement).value as RoomPlanEntity['preset'];
                    this._updateRoomEntity(globalRoomIndex, ei, preset === 'smoke_detector' ? { preset, show_name: false } : { preset });
                  }}>
                  <option value="default">Standard</option>
                  <option value="temperature">Temperatur</option>
                  <option value="binary_sensor">Binary Sensor</option>
                  <option value="window_contact">Fensterkontakt</option>
                  <option value="sliding_door">Schiebetür</option>
                  <option value="smoke_detector">Rauchmelder</option>
                </select>
                <span class="boundaries-label" title="Filter-Tab">Kategorie:</span>
                <select class="entity-category" .value=${getEntityCategoryId(ent)}
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLSelectElement).value;
                    this._updateRoomEntity(globalRoomIndex, ei, { category_id: v === (ent.preset ?? 'default') ? undefined : v });
                  }}>
                  ${this._getEffectiveCategories().map((c) => html`<option value=${c.id}>${c.label}</option>`)}
                </select>
                <div class="entity-coords-wrap">
                  <div class="entity-coords">
                    <input type="number" min="0" max="100" step="0.1" .value=${String(Number(ent.x) || 50)} title="X (%)"
                      @input=${(e: Event) => {
                        const v = Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50));
                        this._scheduleXyUpdate(globalRoomIndex, ei, { x: v });
                      }}
                      @change=${(e: Event) => {
                        this._xyPending.delete(`${globalRoomIndex}-${ei}`);
                        this._updateRoomEntity(globalRoomIndex, ei, { x: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50)) });
                      }} />
                    <input type="number" min="0" max="100" step="0.1" .value=${String(Number(ent.y) || 50)} title="Y (%)"
                      @input=${(e: Event) => {
                        const v = Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50));
                        this._scheduleXyUpdate(globalRoomIndex, ei, { y: v });
                      }}
                      @change=${(e: Event) => {
                        this._xyPending.delete(`${globalRoomIndex}-${ei}`);
                        this._updateRoomEntity(globalRoomIndex, ei, { y: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50)) });
                      }} />
                    <button type="button" class="btn-draw" @click=${() => this._openPickerPosition(globalRoomIndex, ei)} title="Auf Plan setzen"><ha-icon icon="mdi:crosshairs-gps"></ha-icon></button>
                  </div>
                </div>
                <button type="button" class="btn-remove" @click=${() => this._removeRoomEntity(globalRoomIndex, ei)} title="Entität entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
              </div>
                  `)}
                  <button type="button" class="btn-add-small" @click=${() => this._addRoomEntity(globalRoomIndex)}><ha-icon icon="mdi:plus"></ha-icon> Entität</button>
                </div>
                </div>
              </div>
            `;
                  })}
                  <button type="button" class="btn-add-small" @click=${() => this._addRoomToBuilding(bi)}><ha-icon icon="mdi:plus"></ha-icon> Raum in diesem Gebäude</button>
                </div>
              </div>
            `)}
          <button type="button" class="btn-add-small" style="margin-top: 8px;" @click=${() => this._addBuilding()}><ha-icon icon="mdi:plus"></ha-icon> Gebäude hinzufügen</button>
          </div>
          ` : html`
          <h4 class="section-title"><ha-icon icon="mdi:door-open"></ha-icon> Räume</h4>
          <p class="section-hint">Jeder Raum hat eine Boundary (Heatmap/Abdunkeln). Darin liegende Entities (Temperatur, Licht etc.) nutzen diese. Optional können Sie <strong>Gebäude</strong> nutzen: Gebäude haben ein eigenes Bild und werden auf dem Hauptplan positioniert; die Räume liegen dann in den Gebäuden.</p>
          <button type="button" class="btn-add-small" style="margin-bottom: 10px;" @click=${() => this._addBuilding()}><ha-icon icon="mdi:office-building"></ha-icon> Gebäude nutzen (neu)</button>
          <div class="room-list">
            ${rooms.map((room, ri) => html`
              <div class="room-block">
                <div class="room-header">
                  <button type="button" class="btn-collapse" title="${this._roomCollapsed.has(ri) ? 'Aufklappen' : 'Einklappen'}"
                    @click=${() => { const s = new Set(this._roomCollapsed); if (s.has(ri)) s.delete(ri); else s.add(ri); this._roomCollapsed = s; }}>
                    <ha-icon icon="${this._roomCollapsed.has(ri) ? 'mdi:chevron-right' : 'mdi:chevron-down'}"></ha-icon>
                  </button>
                  <input type="text" class="room-name" .value=${room.name ?? ''} placeholder="Raumname (optional)"
                    @change=${(e: Event) => this._updateRoom(ri, { name: (e.target as HTMLInputElement).value.trim() || undefined })} />
                  <button type="button" class="btn-remove" @click=${() => this._removeRoom(ri)} title="Raum entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                </div>
                <div class="room-body ${this._roomCollapsed.has(ri) ? 'collapsed' : ''}">
                <div class="room-boundaries" title="Grenze / Heatmap-Zone dieses Raums (Rechteck oder Polygon)">
                  <span class="boundaries-label">Boundary (Raum/Heatmap):</span>
                  ${this._getRoomBoundaries(ri).map((b, bi) => {
                    if (isPolygonBoundary(b)) {
                      return html`
                    <div class="entity-coords room-boundary">
                      <span class="boundary-type">Polygon (${b.points.length} Ecken)</span>
                      <input type="number" min="0" max="1" step="0.01" class="entity-opacity" .value=${String(Math.min(1, Math.max(0, Number(b.opacity) ?? 0.4)))} title="Deckkraft"
                        @change=${(e: Event) => this._updateRoomBoundary(ri, bi, { opacity: Math.min(1, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0.4)) })} />
                      <button type="button" class="btn-draw" @click=${() => this._openPickerPolygon(ri, bi)} title="Polygon bearbeiten"><ha-icon icon="mdi:vector-polygon"></ha-icon></button>
                      <button type="button" class="btn-remove" @click=${() => this._removeRoomBoundary(ri, bi)} title="Zone entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                  `;
                    }
                    const r = b as { x1: number; y1: number; x2: number; y2: number; opacity?: number };
                    return html`
                    <div class="entity-coords room-boundary">
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(r.x1) ?? 0)} placeholder="x1"
                        @change=${(e: Event) => this._updateRoomBoundary(ri, bi, { x1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(r.y1) ?? 0)} placeholder="y1"
                        @change=${(e: Event) => this._updateRoomBoundary(ri, bi, { y1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(r.x2) ?? 100)} placeholder="x2"
                        @change=${(e: Event) => this._updateRoomBoundary(ri, bi, { x2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(r.y2) ?? 100)} placeholder="y2"
                        @change=${(e: Event) => this._updateRoomBoundary(ri, bi, { y2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <input type="number" min="0" max="1" step="0.01" class="entity-opacity" .value=${String(Math.min(1, Math.max(0, Number(r.opacity) ?? 0.4)))} title="Deckkraft"
                        @change=${(e: Event) => this._updateRoomBoundary(ri, bi, { opacity: Math.min(1, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0.4)) })} />
                      <button type="button" class="btn-draw" @click=${() => this._openPickerRect(ri, bi)} title="Rechteck bearbeiten"><ha-icon icon="mdi:draw"></ha-icon></button>
                      <button type="button" class="btn-remove" @click=${() => this._removeRoomBoundary(ri, bi)} title="Zone entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                  `;
                  })}
                  <button type="button" class="btn-add-small" @click=${() => this._addRoomBoundary(ri, true)} title="Rechteck-Zone"><ha-icon icon="mdi:plus"></ha-icon></button>
                  <button type="button" class="btn-draw-small" @click=${() => this._openPickerRect(ri)} title="Rechteck zeichnen"><ha-icon icon="mdi:draw"></ha-icon> Rechteck</button>
                  <button type="button" class="btn-draw-small" @click=${() => this._openPickerPolygon(ri)} title="Polygon zeichnen"><ha-icon icon="mdi:vector-polygon"></ha-icon> Polygon</button>
                </div>
                <div class="room-entities">
                  <span class="boundaries-label">Entitäten im Raum:</span>
                  ${(room.entities ?? []).map((ent, ei) => html`
              <div class="entity-row">
                <input type="text" list="rp-entities-${ri}-${ei}" .value=${ent.entity} placeholder="light.wohnzimmer"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { entity: (e.target as HTMLInputElement).value.trim() })} />
                <datalist id="rp-entities-${ri}-${ei}">
                  ${entityIds.slice(0, 200).map((eid) => html`<option value="${eid}">${getFriendlyName(this.hass, eid)}</option>`)}
                </datalist>
                <input type="text" class="entity-icon" .value=${ent.icon ?? ''} placeholder="Icon (mdi:...)"
                  @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); this._updateRoomEntity(ri, ei, { icon: v || undefined }); }} />
                <select class="entity-preset" .value=${ent.preset ?? 'default'}
                  @change=${(e: Event) => {
                    const preset = (e.target as HTMLSelectElement).value as RoomPlanEntity['preset'];
                    this._updateRoomEntity(ri, ei, preset === 'smoke_detector' ? { preset, show_name: false } : { preset });
                  }}>
                  <option value="default">Standard</option>
                  <option value="temperature">Temperatur</option>
                  <option value="binary_sensor">Binary Sensor</option>
                  <option value="window_contact">Fensterkontakt</option>
                  <option value="sliding_door">Schiebetür</option>
                  <option value="smoke_detector">Rauchmelder</option>
                </select>
                <span class="boundaries-label" title="Filter-Tab">Kategorie:</span>
                <select class="entity-category" .value=${getEntityCategoryId(ent)}
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLSelectElement).value;
                    this._updateRoomEntity(ri, ei, { category_id: v === (ent.preset ?? 'default') ? undefined : v });
                  }}>
                  ${this._getEffectiveCategories().map((c) => html`<option value=${c.id}>${c.label}</option>`)}
                </select>
                ${(ent.preset === 'temperature') ? html`
                  <span class="hint-inline">(nutzt Raumboundary)</span>
                  <input type="text" class="entity-temp-attr" .value=${ent.temperature_attribute ?? ''} placeholder="Attribut (z. B. current_temperature)"
                    title="Leer = State; bei Klima automatisch current_temperature"
                    @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); this._updateRoomEntity(ri, ei, { temperature_attribute: v || undefined }); }} />
                ` : ''}
                ${(ent.preset === 'window_contact') ? html`
                <div class="entity-boundaries">
                  <span class="boundaries-label">Linien:</span>
                  ${getEntityBoundaries(ent).filter((b) => !isPolygonBoundary(b)).map((b, bi) => {
                    const br = b as { x1: number; y1: number; x2: number; y2: number };
                    const fullList = getEntityBoundaries(ent);
                    const realIndex = fullList.indexOf(b);
                    return html`
                    <div class="entity-coords room-boundary">
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(br.x1) ?? 0)} placeholder="x1"
                        @change=${(e: Event) => this._updateEntityBoundary(ri, ei, realIndex, { x1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(br.y1) ?? 0)} placeholder="y1"
                        @change=${(e: Event) => this._updateEntityBoundary(ri, ei, realIndex, { y1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(br.x2) ?? 100)} placeholder="x2"
                        @change=${(e: Event) => this._updateEntityBoundary(ri, ei, realIndex, { x2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(br.y2) ?? 100)} placeholder="y2"
                        @change=${(e: Event) => this._updateEntityBoundary(ri, ei, realIndex, { y2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <button type="button" class="btn-draw" @click=${() => this._openPickerLine(ri, ei, realIndex)} title="Linie bearbeiten"><ha-icon icon="mdi:draw"></ha-icon></button>
                      <button type="button" class="btn-remove" @click=${() => this._removeEntityBoundary(ri, ei, realIndex)} title="Linie entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                  `;
                  })}
                  <button type="button" class="btn-add-small" @click=${() => this._addEntityBoundary(ri, ei, false)} title="Linie hinzufügen"><ha-icon icon="mdi:plus"></ha-icon></button>
                  <button type="button" class="btn-draw-small" @click=${() => this._openPickerLine(ri, ei)} title="Linie zeichnen"><ha-icon icon="mdi:draw"></ha-icon> Zeichnen</button>
                </div>
                <input type="number" min="0.2" max="3" step="0.1" .value=${String(Math.min(3, Math.max(0.2, Number(ent.line_thickness) ?? 1)))} title="Liniendicke"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { line_thickness: Math.min(3, Math.max(0.2, Number((e.target as HTMLInputElement).value) || 1)) })} />
                <input type="color" .value=${ent.line_color_open ?? '#f44336'} title="Farbe offen"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { line_color_open: (e.target as HTMLInputElement).value })} />
                <input type="color" .value=${ent.line_color_closed ?? '#9e9e9e'} title="Farbe zu"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { line_color_closed: (e.target as HTMLInputElement).value })} />
                <span class="boundaries-label" title="Schloss-Symbol (Offen/Zu)">Schloss:</span>
                <select title="Schloss über oder unter der Linie"
                  .value=${ent.window_icon_position ?? 'above'}
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { window_icon_position: (e.target as HTMLSelectElement).value as 'above' | 'below' })}>
                  <option value="above">Über der Linie</option>
                  <option value="below">Unter der Linie</option>
                </select>
                ` : ''}
                ${(ent.preset === 'sliding_door') ? html`
                <div class="entity-boundaries">
                  <span class="boundaries-label">Linie (Führung):</span>
                  ${getEntityBoundaries(ent).filter((b) => !isPolygonBoundary(b)).map((b, bi) => {
                    const br = b as { x1: number; y1: number; x2: number; y2: number };
                    const fullList = getEntityBoundaries(ent);
                    const realIndex = fullList.indexOf(b);
                    return html`
                    <div class="entity-coords room-boundary">
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(br.x1) ?? 0)} placeholder="x1"
                        @change=${(e: Event) => this._updateEntityBoundary(ri, ei, realIndex, { x1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(br.y1) ?? 0)} placeholder="y1"
                        @change=${(e: Event) => this._updateEntityBoundary(ri, ei, realIndex, { y1: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 0)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(br.x2) ?? 100)} placeholder="x2"
                        @change=${(e: Event) => this._updateEntityBoundary(ri, ei, realIndex, { x2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <input type="number" min="0" max="100" step="0.01" .value=${String(Number(br.y2) ?? 100)} placeholder="y2"
                        @change=${(e: Event) => this._updateEntityBoundary(ri, ei, realIndex, { y2: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 100)) })} />
                      <button type="button" class="btn-draw" @click=${() => this._openPickerLine(ri, ei, realIndex)} title="Linie bearbeiten"><ha-icon icon="mdi:draw"></ha-icon></button>
                      <button type="button" class="btn-remove" @click=${() => this._removeEntityBoundary(ri, ei, realIndex)} title="Linie entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                    </div>
                  `;
                  })}
                  <button type="button" class="btn-add-small" @click=${() => this._addEntityBoundary(ri, ei, false)} title="Linie hinzufügen"><ha-icon icon="mdi:plus"></ha-icon></button>
                  <button type="button" class="btn-draw-small" @click=${() => this._openPickerLine(ri, ei)} title="Linie zeichnen"><ha-icon icon="mdi:draw"></ha-icon> Zeichnen</button>
                </div>
                <span class="boundaries-label">Richtung:</span>
                <select title="Schieberichtung beim Öffnen"
                  .value=${ent.sliding_door_direction ?? 'left'}
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { sliding_door_direction: (e.target as HTMLSelectElement).value as 'left' | 'right' | 'double' })}>
                  <option value="left">Links (Tür schiebt nach rechts)</option>
                  <option value="right">Rechts (Tür schiebt nach links)</option>
                  <option value="double">Doppelt (zwei Türen, auf-/zufahren)</option>
                </select>
                <span class="boundaries-label" title="Führungsschiene">Führung:</span>
                <input type="number" min="0.2" max="3" step="0.1" .value=${String(Math.min(3, Math.max(0.2, Number(ent.line_thickness) ?? 1)))} title="Dicke Führungsschiene"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { line_thickness: Math.min(3, Math.max(0.2, Number((e.target as HTMLInputElement).value) || 1)) })} />
                <span class="boundaries-label" title="Tür-Linie">Tür:</span>
                <input type="number" min="0.2" max="3" step="0.1" .value=${String(Math.min(3, Math.max(0.2, Number(ent.sliding_door_door_thickness) ?? Number(ent.line_thickness) ?? 1)))} title="Dicke Tür-Linie"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { sliding_door_door_thickness: Math.min(3, Math.max(0.2, Number((e.target as HTMLInputElement).value) || 1)) })} />
                <input type="color" .value=${ent.line_color_closed ?? '#9e9e9e'} title="Farbe Führungsschiene (BG)"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { line_color_closed: (e.target as HTMLInputElement).value })} />
                <input type="color" .value=${ent.line_color_open ?? '#03a9f4'} title="Farbe Tür"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { line_color_open: (e.target as HTMLInputElement).value })} />
                ` : ''}
                <div class="entity-coords-wrap">
                  <div class="entity-coords">
                    <input type="number" min="0" max="100" step="0.1" .value=${String(Number(ent.x) || 50)} title="X (%)"
                      @input=${(e: Event) => {
                        const v = Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50));
                        this._scheduleXyUpdate(ri, ei, { x: v });
                      }}
                      @change=${(e: Event) => {
                        this._xyPending.delete(`${ri}-${ei}`);
                        this._updateRoomEntity(ri, ei, { x: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50)) });
                      }} />
                    <input type="number" min="0" max="100" step="0.1" .value=${String(Number(ent.y) || 50)} title="Y (%)"
                      @input=${(e: Event) => {
                        const v = Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50));
                        this._scheduleXyUpdate(ri, ei, { y: v });
                      }}
                      @change=${(e: Event) => {
                        this._xyPending.delete(`${ri}-${ei}`);
                        this._updateRoomEntity(ri, ei, { y: Math.min(100, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 50)) });
                      }} />
                    <button type="button" class="btn-draw" @click=${() => this._openPickerPosition(ri, ei)} title="Position auf Plan setzen (raum-relativ)"><ha-icon icon="mdi:crosshairs-gps"></ha-icon></button>
                  </div>
                  ${getRoomBoundingBox(room) ? html`<span class="coords-hint">X/Y relativ zum Raum</span>` : ''}
                </div>
                <input type="number" class="entity-scale" min="0.3" max="2" step="0.1" .value=${String(Math.min(2, Math.max(0.3, Number(ent.scale) || 1)))} title="Skalierung"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { scale: Math.min(2, Math.max(0.3, parseFloat((e.target as HTMLInputElement).value) || 1)) })} />
                <input type="color" .value=${ent.color || '#03a9f4'} title="Farbe"
                  @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; this._updateRoomEntity(ri, ei, { color: v === '#03a9f4' && !ent.color ? undefined : v }); }} />
                <input type="number" class="entity-opacity" min="0" max="1" step="0.01" .value=${String(Math.min(1, Math.max(0, Number(ent.background_opacity) ?? 1)))} title="Deckkraft"
                  @change=${(e: Event) => this._updateRoomEntity(ri, ei, { background_opacity: Math.min(1, Math.max(0, parseFloat((e.target as HTMLInputElement).value) || 1)) })} />
                <label class="entity-check"><input type="checkbox" .checked=${!!ent.show_value} @change=${(e: Event) => this._updateRoomEntity(ri, ei, { show_value: (e.target as HTMLInputElement).checked })} /> Wert</label>
                <label class="entity-check"><input type="checkbox" .checked=${ent.show_name !== false} @change=${(e: Event) => this._updateRoomEntity(ri, ei, { show_name: (e.target as HTMLInputElement).checked })} /> Text</label>
                <button type="button" class="btn-remove" @click=${() => this._removeRoomEntity(ri, ei)} title="Entität entfernen"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
              </div>
            `)}
                </div>
                <button type="button" class="btn-add-small" @click=${() => this._addRoomEntity(ri)}><ha-icon icon="mdi:plus"></ha-icon> Entität in Raum</button>
                </div>
              </div>
            `)}
          </div>
          <button type="button" class="btn-add" @click=${this._addRoom}>
            <ha-icon icon="mdi:plus"></ha-icon> Raum hinzufügen
          </button>
          `}
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
      .room-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .room-block {
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 10px;
        padding: 12px;
        background: var(--secondary-background-color, rgba(255, 255, 255, 0.05));
      }
      .room-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }
      .room-header .room-name {
        flex: 1;
        min-width: 0;
        font-weight: 500;
      }
      .btn-collapse {
        flex-shrink: 0;
        padding: 4px;
        min-width: 28px;
        min-height: 28px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--secondary-text-color);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn-collapse:hover {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }
      .room-body.collapsed {
        display: none;
      }
      .room-boundaries {
        margin-bottom: 12px;
      }
      .room-entities {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .hint-inline {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        margin-left: 4px;
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
      .entity-row select.entity-preset,
      .entity-row select.entity-category {
        width: auto;
        min-width: 100px;
      }
      .entity-row input.entity-temp-attr {
        width: clamp(120px, 18vw, 200px);
      }
      .entity-coords-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .entity-coords {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
      }
      .entity-coords input {
        width: clamp(44px, 12vw, 52px);
      }
      .coords-hint {
        font-size: 0.75rem;
        color: var(--secondary-text-color);
        white-space: nowrap;
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
      .picker-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: stretch;
        padding: 0;
        box-sizing: border-box;
      }
      .picker-modal {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        background: var(--ha-card-background, #1e1e1e);
        box-shadow: 0 0 0 1px var(--divider-color, rgba(255, 255, 255, 0.12));
        padding: 12px 16px 16px;
      }
      .picker-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        flex-shrink: 0;
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
      .btn-confirm {
        padding: 8px 14px;
        border: 1px solid var(--primary-color, #03a9f4);
        border-radius: 8px;
        background: rgba(3, 169, 244, 0.2);
        color: var(--primary-color, #03a9f4);
        cursor: pointer;
        font-size: 0.85rem;
      }
      .btn-confirm:hover:not(:disabled) {
        background: rgba(3, 169, 244, 0.3);
      }
      .btn-confirm:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .boundary-type {
        font-size: 0.85rem;
        color: var(--secondary-text-color);
        margin-right: 4px;
      }
      .picker-image-wrap {
        position: relative;
        flex: 1;
        min-height: 200px;
        width: 100%;
        border-radius: 8px;
        overflow: hidden;
        cursor: crosshair;
        background: var(--secondary-background-color, #2a2a2a);
        user-select: none;
        -webkit-user-drag: none;
      }
      .picker-image-layer {
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        z-index: 0;
      }
      .picker-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        pointer-events: none;
      }
      .picker-overlay-layer {
        position: absolute;
        z-index: 10;
        pointer-events: auto;
        box-sizing: border-box;
        outline: 3px solid #00bcd4;
      }
      .picker-point {
        position: absolute;
        width: 14px;
        height: 14px;
        margin-left: -7px;
        margin-top: -7px;
        border-radius: 50%;
        background: #00bcd4;
        border: 2px solid #fff;
        box-sizing: border-box;
      }
      .picker-point.draggable {
        cursor: move;
        pointer-events: auto;
      }
      .picker-point.draw-preview {
        background: #00bcd4;
        border-color: #fff;
      }
      .picker-rect {
        position: absolute;
        box-sizing: border-box;
        border: 2px solid rgba(255,255,255,0.9);
        background: rgba(0,188,212,0.2);
      }
      .picker-rect.editing {
        border-color: #00bcd4;
        background: rgba(0,188,212,0.25);
      }
      .picker-rect.draw-preview {
        border: 2px solid #00bcd4;
        background: rgba(0,188,212,0.35);
      }
      .picker-line {
        position: absolute;
        height: 4px;
        margin-top: -2px;
        transform-origin: 0 50%;
        background: rgba(255,255,255,0.9);
        box-sizing: border-box;
      }
      .picker-line.editing {
        background: #00bcd4;
      }
      .picker-line.draw-preview {
        background: #00bcd4;
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
