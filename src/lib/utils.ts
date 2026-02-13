import type { HomeAssistant } from 'custom-card-helpers';
import type { RoomPlanEntity, RoomBoundaryItem } from './types';

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
