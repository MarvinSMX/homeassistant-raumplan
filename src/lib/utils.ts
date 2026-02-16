import type { HomeAssistant } from 'custom-card-helpers';
import type { RoomPlanEntity, RoomBoundaryItem, RoomPlanCardConfig, RoomPlanRoom } from './types';

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

/** Liefert die Räume aus der Config (immer Array, ggf. leer). */
export function getRooms(config: RoomPlanCardConfig | undefined): RoomPlanRoom[] {
  if (!config || !Array.isArray(config.rooms)) return [];
  return config.rooms;
}

/** Ein Eintrag in der flachen Entity-Liste inkl. Herkunft (Raum oder Legacy). */
export interface FlattenedEntity {
  entity: RoomPlanEntity;
  roomIndex: number | null;
  entityIndexInRoom: number;
  /** Direkte Referenz auf den Raum (wenn in Raum), damit die Position immer dem richtigen Raum zugeordnet wird. */
  room: RoomPlanRoom | null;
  /** Eindeutige ID pro Entity-Instanz: nur (roomIndex, entityIndexInRoom), nie entity_id. */
  uniqueKey: string;
}

/** Liefert alle Entities flach: aus rooms[].entities, oder bei leerem rooms aus config.entities (Legacy). */
export function getFlattenedEntities(config: RoomPlanCardConfig | undefined): FlattenedEntity[] {
  const rooms = getRooms(config);
  if (rooms.length > 0) {
    const fromRooms = rooms.flatMap((room, roomIndex) =>
      (room.entities ?? []).map((entity, entityIndexInRoom) => ({
        entity,
        roomIndex,
        entityIndexInRoom,
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
  if (ent.preset === 'window_contact') {
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

/** Mitte des Raums in Bild-Prozent: bei Polygon = Centroid, sonst BBox-Mitte. */
export function getRoomShapeCenter(room: RoomPlanRoom | undefined): { x: number; y: number } | null {
  if (!room) return null;
  const polygon = getRoomPolygon(room);
  if (polygon && polygon.length >= 3) return getPolygonCentroid(polygon);
  const box = getRoomBoundingBox(room);
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
 * Immer nur innerhalb des Raums: bei Polygon Clamp auf Polygon, bei Rechteck Clamp auf BBox.
 * Bei Polygon: 50/50 = Centroid.
 */
export function roomRelativeToImagePercentWithShape(
  room: RoomPlanRoom,
  rx: number,
  ry: number
): { x: number; y: number } {
  const box = getRoomBoundingBox(room);
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

/** Bild-Prozent → raum-relativ (0–100). Bei Polygon: Punkt zuerst in Shape clippen, dann BBox-Mapping. */
export function imagePercentToRoomRelativeWithShape(room: RoomPlanRoom, imageX: number, imageY: number): { x: number; y: number } {
  const box = getRoomBoundingBox(room);
  if (!box || box.width <= 0 || box.height <= 0) return { x: 50, y: 50 };
  const polygon = getRoomPolygon(room);
  let px = imageX, py = imageY;
  if (polygon && polygon.length >= 3) {
    const clamped = clampPointToPolygon(imageX, imageY, polygon);
    px = clamped.x;
    py = clamped.y;
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
