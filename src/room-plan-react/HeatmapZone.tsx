import type { HeatmapZone as HeatmapZoneType } from '../lib/types';
import type { HomeAssistant } from 'custom-card-helpers';
import { hexToRgba, temperatureColor } from './utils';

interface HeatmapZoneProps {
  zone: HeatmapZoneType;
  hass: HomeAssistant;
}

export function HeatmapZone({ zone, hass }: HeatmapZoneProps) {
  const x1 = Math.min(100, Math.max(0, Number(zone.x1) ?? 0));
  const y1 = Math.min(100, Math.max(0, Number(zone.y1) ?? 0));
  const x2 = Math.min(100, Math.max(0, Number(zone.x2) ?? 100));
  const y2 = Math.min(100, Math.max(0, Number(zone.y2) ?? 100));
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1) || 1;
  const height = Math.abs(y2 - y1) || 1;
  const opacity = Math.min(1, Math.max(0, Number(zone.opacity) ?? 0.4));

  const state = hass?.states?.[zone.entity]?.state;
  const num = typeof state === 'string' ? parseFloat(state.replace(',', '.')) : Number(state);
  const temp = Number.isFinite(num) ? num : 20;
  const color = temperatureColor(temp);
  const bg = hexToRgba(color, opacity);

  return (
    <div
      className="absolute pointer-events-none z-0 rounded-none"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        background: bg,
      }}
      title={`${zone.entity}: ${state ?? '?'}`}
    />
  );
}
