import type { HomeAssistant } from 'custom-card-helpers';
import type { RoomPlanEntity, RoomBoundaryItem, RoomPlanCardConfig, RoomPlanRoom, RoomPlanBuilding } from './types';

export type RoomBoundary = RoomBoundaryItem;

/** True, wenn die Zone ein Polygon (mind. 3 Punkte) ist, sonst Rechteck. */
export function isPolygonBoundary(b: RoomBoundary): b is { points: { x: number; y: number }[]; opacity?: number } {
  return Array.isArray((b as { points?: { x: number; y: number }[] }).points) && (b as { points: { x: number; y: number }[] }).points.length >= 3;
}

/** Liefert die Eckpunkte einer Zone: bei Polygon die points, bei Rechteck die 4 Ecken (links oben → rechts oben → rechts unten → links unten). */
export function getBoundaryPoints(b: RoomBoundary): { x: number; y: number }[] {
  if (isPolygonBoundary(b)) return b.points;
  const x1 = Math.min(100, Math.max(0, Number((b as { x1: number }).x1) ?? 0));
  const y1 = Math.min(100, Math.max(0, Number((b as { y1: number }).y1) ?? 0));
  const x2 = Math.min(100, Math.max(0, Number((b as { x2: number }).x2) ?? 100));
  const y2 = Math.min(100, Math.max(0, Number((b as { y2: number }).y2) ?? 100));
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const right = Math.max(x1, x2);
  const bottom = Math.max(y1, y2);
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
}

/** Liest Entity-X/Y robust (unterstützt auch YAML-Keys "x"/"y" nach Serialisierung). */
export function getEntityCoord(ent: RoomPlanEntity, axis: 'x' | 'y'): number | undefined {
  const e = ent as RoomPlanEntity & Record<string, unknown>;
  const v = axis === 'x' ? (ent.x ?? e['x']) : (ent.y ?? e['y']);
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Ob die Entität explizite Koordinaten hat (raum-relativ oder Bild-%). */
export function hasEntityCoords(ent: RoomPlanEntity): boolean {
  return getEntityCoord(ent, 'x') != null && getEntityCoord(ent, 'y') != null;
}

/** Liefert die Raum-/Heatmap-Zonen einer Entität (room_boundaries oder [room_boundary] für Abwärtskompatibilität). */
export function getEntityBoundaries(ent: RoomPlanEntity): RoomBoundary[] {
  if (Array.isArray(ent.room_boundaries) && ent.room_boundaries.length > 0) {
    return ent.room_boundaries;
  }
  if (ent.room_boundary) {
    return [ent.room_boundary];
  }
  return [];
}

/** Liefert die Gebäude aus der Config (immer Array, ggf. leer). Prüft auch config.config?.buildings (HA-Varianten). */
export function getBuildings(config: RoomPlanCardConfig | undefined): RoomPlanBuilding[] {
  if (!config) return [];
  if (Array.isArray(config.buildings) && config.buildings.length > 0) return config.buildings;
  const nested = (config as { config?: { buildings?: RoomPlanBuilding[] } }).config?.buildings;
  return Array.isArray(nested) ? nested : [];
}

/** Liefert die Räume aus der Config (immer Array, ggf. leer). Bei buildings: flache Liste aus allen buildings[].rooms. Sonst config.rooms. */
export function getRooms(config: RoomPlanCardConfig | undefined): RoomPlanRoom[] {
  if (!config) return [];
  const buildings = getBuildings(config);
  if (buildings.length > 0) {
    return buildings.flatMap((b) => b.rooms ?? []);
  }
  if (Array.isArray(config.rooms) && config.rooms.length > 0) return config.rooms;
  const nested = (config as { config?: { rooms?: RoomPlanRoom[] } }).config?.rooms;
  if (Array.isArray(nested) && nested.length > 0) return nested;
  return [];
}

/** Bei Nutzung von buildings: Gebäude-Index für einen flachen roomIndex (0 = erstes Gebäude, erste Räume …). Sonst -1. */
export function getBuildingIndexForRoom(config: RoomPlanCardConfig | undefined, roomIndex: number): number {
  const buildings = getBuildings(config);
  if (buildings.length === 0) return -1;
  let idx = 0;
  for (let bi = 0; bi < buildings.length; bi++) {
    const len = (buildings[bi].rooms ?? []).length;
    if (roomIndex < idx + len) return bi;
    idx += len;
  }
  return -1;
}

/** Bei Nutzung von buildings: (buildingIndex, roomIndexInBuilding) für einen flachen roomIndex. Sonst null. */
export function getBuildingAndRoomIndex(
  config: RoomPlanCardConfig | undefined,
  globalRoomIndex: number
): { buildingIndex: number; roomIndexInBuilding: number } | null {
  const buildings = getBuildings(config);
  if (buildings.length === 0) return null;
  let idx = 0;
  for (let bi = 0; bi < buildings.length; bi++) {
    const rooms = buildings[bi].rooms ?? [];
    if (globalRoomIndex < idx + rooms.length) {
      return { buildingIndex: bi, roomIndexInBuilding: globalRoomIndex - idx };
    }
    idx += rooms.length;
  }
  return null;
}

/** Standard-Kategorien für Filter-Tabs (entsprechen den bisherigen Presets), im Editor entfernbar. */
export const DEFAULT_CATEGORIES: { id: string; label: string }[] = [
  { id: 'default', label: 'Standard' },
  { id: 'temperature', label: 'Temperatur' },
  { id: 'binary_sensor', label: 'Binary Sensor' },
  { id: 'window_contact', label: 'Fensterkontakt' },
  { id: 'sliding_door', label: 'Schiebetür' },
  { id: 'smoke_detector', label: 'Rauchmelder' },
];

/** Effektive Kategorien: nur die in der Config konfigurierten (keine Domänen-/Preset-Fallback-Tabs). */
export function getEffectiveCategories(config: RoomPlanCardConfig | undefined): { id: string; label: string }[] {
  const list = config?.categories;
  return Array.isArray(list) ? list : [];
}

/** Kategorie-ID einer Entität für den Filter-Tab (category_id oder Fallback preset/default). */
export function getEntityCategoryId(ent: RoomPlanEntity): string {
  return ent.category_id ?? ent.preset ?? 'default';
}

/** Anzeige-Position in Bild-Prozent (0–100). ent.x/ent.y sind immer % des gesamten Plans (wie im Editor gesetzt). */
export function getEntityDisplayPosition(
  _room: RoomPlanRoom | null,
  ent: RoomPlanEntity
): { x: number; y: number } {
  const px = getEntityCoord(ent, 'x') ?? 50;
  const py = getEntityCoord(ent, 'y') ?? 50;
  return { x: Math.min(100, Math.max(0, px)), y: Math.min(100, Math.max(0, py)) };
}

/** Ein Eintrag in der flachen Entity-Liste inkl. Herkunft (Raum/Gebäude oder Legacy). */
export interface FlattenedEntity {
  entity: RoomPlanEntity;
  roomIndex: number | null;
  entityIndexInRoom: number;
  /** Bei Nutzung von buildings: Index des Gebäudes; sonst null. */
  buildingIndex: number | null;
  /** Direkte Referenz auf den Raum (wenn in Raum), damit die Position immer dem richtigen Raum zugeordnet wird. */
  room: RoomPlanRoom | null;
  /** Eindeutige ID pro Entity-Instanz: nur (roomIndex, entityIndexInRoom), nie entity_id. */
  uniqueKey: string;
}

/** Liefert alle Entities flach: aus buildings[].rooms[].entities oder rooms[].entities, oder config.entities (Legacy). */
export function getFlattenedEntities(config: RoomPlanCardConfig | undefined): FlattenedEntity[] {
  const buildings = getBuildings(config);
  if (buildings.length > 0) {
    let globalRoomIndex = 0;
    const result: FlattenedEntity[] = [];
    for (let bi = 0; bi < buildings.length; bi++) {
      const rooms = buildings[bi].rooms ?? [];
      for (let ri = 0; ri < rooms.length; ri++) {
        const room = rooms[ri];
        for (let ei = 0; ei < (room.entities ?? []).length; ei++) {
          result.push({
            entity: room.entities![ei]!,
            roomIndex: globalRoomIndex,
            entityIndexInRoom: ei,
            buildingIndex: bi,
            room,
            uniqueKey: `building-${bi}-room-${ri}-ent-${ei}`,
          });
        }
        globalRoomIndex++;
      }
    }
    if (result.length > 0) return result;
  }
  const rooms = getRooms(config);
  if (rooms.length > 0) {
    const fromRooms = rooms.flatMap((room, roomIndex) =>
      (room.entities ?? []).map((entity, entityIndexInRoom) => ({
        entity,
        roomIndex,
        entityIndexInRoom,
        buildingIndex: null as number | null,
        room,
        uniqueKey: `room-${roomIndex}-ent-${entityIndexInRoom}`,
      }))
    );
    if (fromRooms.length > 0) return fromRooms;
  }
  if (!config || !Array.isArray(config.entities)) return [];
  return config.entities.map((entity, entityIndexInRoom) => ({
    entity,
    roomIndex: null,
    entityIndexInRoom,
    buildingIndex: null,
    room: null,
    uniqueKey: `legacy-ent-${entityIndexInRoom}`,
  }));
}

/** Liefert die Boundary-Liste eines Raums (room.boundary oder room.boundaries). */
export function getRoomBoundaryList(room: RoomPlanRoom | undefined): RoomBoundary[] {
  if (!room) return [];
  const r = room as RoomPlanRoom & { boundaries?: RoomBoundaryItem[] };
  if (Array.isArray(r.boundary) && r.boundary.length > 0) return r.boundary;
  if (Array.isArray(r.boundaries) && r.boundaries.length > 0) return r.boundaries;
  return [];
}

/** Liefert die Boundaries für Heatmap/Abdunkeln: aus Raum (wenn in Raum), sonst von der Entität. Fensterkontakt nutzt weiterhin ent.room_boundaries (Linien). */
export function getBoundariesForEntity(
  config: RoomPlanCardConfig | undefined,
  roomIndex: number | null,
  ent: RoomPlanEntity
): RoomBoundary[] {
  if (ent.preset === 'window_contact' || ent.preset === 'sliding_door') {
    return getEntityBoundaries(ent);
  }
  if (roomIndex !== null) {
    const rooms = getRooms(config);
    const room = rooms[roomIndex];
    const list = getRoomBoundaryList(room);
    if (list.length > 0) return list;
  }
  return getEntityBoundaries(ent);
}

/** Umgebendes Rechteck eines Raums in Bild-Prozent (0–100). Aus allen room.boundary-Zonen vereint. */
export function getRoomBoundingBox(room: RoomPlanRoom): { left: number; top: number; width: number; height: number } | null {
  const boundary = getRoomBoundaryList(room);
  if (boundary.length === 0) return null;
  let left = 100;
  let top = 100;
  let right = 0;
  let bottom = 0;
  for (const b of boundary) {
    const pts = getBoundaryPoints(b);
    for (const p of pts) {
      left = Math.min(left, p.x);
      top = Math.min(top, p.y);
      right = Math.max(right, p.x);
      bottom = Math.max(bottom, p.y);
    }
  }
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  if (width <= 0 || height <= 0) return null;
  return { left, top, width, height };
}

/** BBox nur der ersten Raumboundary (für Entity-Position: 0–100 strikt auf diese eine Shape). */
function getFirstBoundaryBox(room: RoomPlanRoom | undefined): { left: number; top: number; width: number; height: number } | null {
  const list = getRoomBoundaryList(room);
  const b = list[0];
  if (!b) return null;
  const pts = getBoundaryPoints(b);
  if (pts.length === 0) return null;
  let left = pts[0].x, top = pts[0].y, right = pts[0].x, bottom = pts[0].y;
  for (const p of pts) {
    left = Math.min(left, p.x);
    top = Math.min(top, p.y);
    right = Math.max(right, p.x);
    bottom = Math.max(bottom, p.y);
  }
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  if (width <= 0 || height <= 0) return null;
  return { left, top, width, height };
}

/** Raum-relative Koordinaten (0–100 innerhalb des Raums) in Bild-Prozent (0–100) umrechnen. */
export function roomRelativeToImagePercent(
  roomBox: { left: number; top: number; width: number; height: number },
  rx: number,
  ry: number
): { x: number; y: number } {
  const x = roomBox.left + (Math.min(100, Math.max(0, rx)) / 100) * roomBox.width;
  const y = roomBox.top + (Math.min(100, Math.max(0, ry)) / 100) * roomBox.height;
  return { x, y };
}

/** Erstes Polygon einer Raumboundary (Punkte in Bild-Prozent), sonst null. */
export function getRoomPolygon(room: RoomPlanRoom | undefined): { x: number; y: number }[] | null {
  const list = getRoomBoundaryList(room);
  for (const b of list) {
    if (isPolygonBoundary(b) && b.points.length >= 3) return b.points;
  }
  return null;
}

/** Schwerpunkt eines Polygons (einfacher Mittelwert der Ecken) in Bild-Prozent. */
export function getPolygonCentroid(points: { x: number; y: number }[]): { x: number; y: number } {
  if (points.length === 0) return { x: 50, y: 50 };
  let sx = 0, sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

/** Punkt-in-Polygon (Ray-Casting). */
export function pointInPolygon(px: number, py: number, points: { x: number; y: number }[]): boolean {
  const n = points.length;
  if (n < 3) return false;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/** Nächsten Punkt am Polygonrand (oder innen) zu (px, py). */
function nearestPointOnPolygon(px: number, py: number, points: { x: number; y: number }[]): { x: number; y: number } {
  let best = { x: points[0]?.x ?? 50, y: points[0]?.y ?? 50 };
  let bestD = 1e9;
  const n = points.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = points[j], b = points[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1e-9;
    const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (len * len)));
    const qx = a.x + t * dx, qy = a.y + t * dy;
    const d = Math.hypot(px - qx, py - qy);
    if (d < bestD) {
      bestD = d;
      best = { x: qx, y: qy };
    }
  }
  return best;
}

/** Punkt (px, py) in Bild-Prozent: wenn außerhalb des Polygons, auf Rand/innen projizieren. */
export function clampPointToPolygon(px: number, py: number, points: { x: number; y: number }[]): { x: number; y: number } {
  if (points.length < 3) return { x: px, y: py };
  if (pointInPolygon(px, py, points)) return { x: px, y: py };
  return nearestPointOnPolygon(px, py, points);
}

/** Mitte des Raums in Bild-Prozent: erste Shape – bei Polygon = Centroid, sonst BBox-Mitte der ersten Zone. */
export function getRoomShapeCenter(room: RoomPlanRoom | undefined): { x: number; y: number } | null {
  if (!room) return null;
  const polygon = getRoomPolygon(room);
  if (polygon && polygon.length >= 3) return getPolygonCentroid(polygon);
  const box = getFirstBoundaryBox(room);
  if (!box) return null;
  return {
    x: box.left + box.width / 2,
    y: box.top + box.height / 2,
  };
}

/** Punkt (px, py) auf Rechteck begrenzen (Bild-Prozent). */
export function clampPointToBox(
  px: number,
  py: number,
  box: { left: number; top: number; width: number; height: number }
): { x: number; y: number } {
  const right = box.left + box.width;
  const bottom = box.top + box.height;
  return {
    x: Math.max(box.left, Math.min(right, px)),
    y: Math.max(box.top, Math.min(bottom, py)),
  };
}

/**
 * Raum-relativ (rx, ry) 0–100 → Bild-Prozent.
 * Strikte Abbildung auf die erste Raumboundary: 0–100 nur innerhalb dieser einen Shape.
 * Bei Polygon: Clamp auf Polygon; bei Rechteck: Clamp auf BBox der ersten Zone. 50/50 = Centroid bzw. Rechteckmitte.
 */
export function roomRelativeToImagePercentWithShape(
  room: RoomPlanRoom,
  rx: number,
  ry: number
): { x: number; y: number } {
  const box = getFirstBoundaryBox(room);
  if (!box) return { x: 50, y: 50 };
  const polygon = getRoomPolygon(room);
  const rx2 = Math.min(100, Math.max(0, rx));
  const ry2 = Math.min(100, Math.max(0, ry));

  if (polygon && polygon.length >= 3) {
    const centroid = getPolygonCentroid(polygon);
    if (Math.abs(rx2 - 50) < 0.01 && Math.abs(ry2 - 50) < 0.01) return centroid;
    const raw = roomRelativeToImagePercent(box, rx2, ry2);
    return clampPointToPolygon(raw.x, raw.y, polygon);
  }
  const raw = roomRelativeToImagePercent(box, rx2, ry2);
  return clampPointToBox(raw.x, raw.y, box);
}

/** Bild-Prozent (0–100) in raum-relative Koordinaten (0–100) umrechnen. Für Editor beim Speichern. */
export function imagePercentToRoomRelative(
  roomBox: { left: number; top: number; width: number; height: number },
  imageX: number,
  imageY: number
): { x: number; y: number } {
  if (roomBox.width <= 0 || roomBox.height <= 0) return { x: 50, y: 50 };
  const x = Math.min(100, Math.max(0, ((imageX - roomBox.left) / roomBox.width) * 100));
  const y = Math.min(100, Math.max(0, ((imageY - roomBox.top) / roomBox.height) * 100));
  return { x, y };
}

/** Bild-Prozent → raum-relativ (0–100). Erste Raumboundary: Punkt in Shape clippen, dann BBox-Mapping. */
export function imagePercentToRoomRelativeWithShape(room: RoomPlanRoom, imageX: number, imageY: number): { x: number; y: number } {
  const box = getFirstBoundaryBox(room);
  if (!box || box.width <= 0 || box.height <= 0) return { x: 50, y: 50 };
  const polygon = getRoomPolygon(room);
  let px = imageX, py = imageY;
  if (polygon && polygon.length >= 3) {
    const clamped = clampPointToPolygon(imageX, imageY, polygon);
    px = clamped.x;
    py = clamped.y;
  } else {
    const c = clampPointToBox(imageX, imageY, box);
    px = c.x;
    py = c.y;
  }
  return imagePercentToRoomRelative(box, px, py);
}

export function getEntityIcon(hass: HomeAssistant | undefined, entityId: string): string {
  const s = hass?.states?.[entityId];
  if (!s) return 'mdi:help-circle';
  if (s.attributes?.icon) return s.attributes.icon;
  const domain = entityId.split('.')[0];
  const stateVal = s.state;
  if (domain === 'light' || domain === 'switch') return stateVal === 'on' ? 'mdi:lightbulb-on' : 'mdi:lightbulb-outline';
  if (domain === 'cover') return 'mdi:blinds';
  if (domain === 'climate') return 'mdi:thermostat';
  if (domain === 'sensor') return 'mdi:gauge';
  if (domain === 'binary_sensor') return 'mdi:motion-sensor';
  return 'mdi:circle';
}

export function getFriendlyName(hass: HomeAssistant | undefined, entityId: string): string {
  return hass?.states?.[entityId]?.attributes?.friendly_name || entityId;
}

export function getStateDisplay(hass: HomeAssistant | undefined, entityId: string): string {
  const s = hass?.states?.[entityId];
  if (!s) return '—';
  const uom = s.attributes?.unit_of_measurement;
  return uom ? `${s.state} ${uom}` : s.state;
}

/** Temperatur-Wert aus Entity: bei climate aus Attribut (z. B. current_temperature), sonst aus state. attribute überschreibt (z. B. current_temperature). */
export function getTemperatureFromEntity(
  hass: HomeAssistant | undefined,
  entityId: string,
  attribute?: string
): number {
  const s = hass?.states?.[entityId];
  if (!s) return 20;
  const attrs = s.attributes ?? {};
  const attrName = attribute ?? (entityId.startsWith('climate.') ? 'current_temperature' : undefined);
  const raw = attrName != null ? attrs[attrName] : s.state;
  if (raw == null) return 20;
  const n = typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : Number(raw);
  return Number.isFinite(n) ? n : 20;
}
