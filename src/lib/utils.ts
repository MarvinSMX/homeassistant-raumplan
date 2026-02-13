import type { HomeAssistant } from 'custom-card-helpers';
import type { RoomPlanEntity } from './types';

export type RoomBoundary = { x1: number; y1: number; x2: number; y2: number; opacity?: number };

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
