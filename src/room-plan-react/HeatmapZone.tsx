import type { HeatmapZone as HeatmapZoneType } from '../lib/types';
import type { HomeAssistant } from 'custom-card-helpers';
import { hexToRgba, temperatureColor, intensityForArea } from './utils';

function isZonePolygon(z: HeatmapZoneType): z is HeatmapZoneType & { points: { x: number; y: number }[] } {
  return Array.isArray((z as { points?: { x: number; y: number }[] }).points) && (z as { points: { x: number; y: number }[] }).points.length >= 3;
}

interface HeatmapZoneProps {
  zone: HeatmapZoneType;
  hass: HomeAssistant;
  /** Beim Hover/Abdunkeln: Heatmap dieser Zone ausblenden (gleiche Dauer wie Abdunkel-Overlay) */
  dimmed?: boolean;
}

const DIM_DURATION = 0.28;

export function HeatmapZone({ zone, hass, dimmed = false }: HeatmapZoneProps) {
  const baseOpacity = Math.min(1, Math.max(0, Number(zone.opacity) ?? 0.4));
  const state = hass?.states?.[zone.entity]?.state;
  const num = typeof state === 'string' ? parseFloat(state.replace(',', '.')) : Number(state);
  const temp = Number.isFinite(num) ? num : 20;
  const color = temperatureColor(temp);

  if (isZonePolygon(zone)) {
    const pts = zone.points.map((p) => ({ x: Math.min(100, Math.max(0, p.x)), y: Math.min(100, Math.max(0, p.y)) }));
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    let r = 0;
    for (const p of pts) {
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d > r) r = d;
    }
    r = Math.max(r, 1);
    const areaApprox = 4 * r * r;
    const intensity = intensityForArea(areaApprox);
    const opacity = baseOpacity * intensity;
    const bg = hexToRgba(color, opacity);
    const polygonGradient = `radial-gradient(ellipse ${r * 2}% ${r * 2}% at ${cx}% ${cy}%, transparent 0%, ${bg} 100%)`;
    const ptsStr = pts.map((p) => `${p.x}% ${p.y}%`).join(', ');
    return (
      <div
        className="absolute pointer-events-none z-0 rounded-none"
        style={{
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          opacity: dimmed ? 0 : 1,
          transition: `opacity ${DIM_DURATION}s ease-in-out`,
          background: polygonGradient,
          clipPath: `polygon(${ptsStr})`,
        }}
        title={`${zone.entity}: ${state ?? '?'}`}
      />
    );
  }

  const x1 = Math.min(100, Math.max(0, Number(zone.x1) ?? 0));
  const y1 = Math.min(100, Math.max(0, Number(zone.y1) ?? 0));
  const x2 = Math.min(100, Math.max(0, Number(zone.x2) ?? 100));
  const y2 = Math.min(100, Math.max(0, Number(zone.y2) ?? 100));
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1) || 1;
  const height = Math.abs(y2 - y1) || 1;
  const area = width * height;
  const intensity = intensityForArea(area);
  const opacity = baseOpacity * intensity;
  const bg = hexToRgba(color, opacity);
  const gradientBg = `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 0%, ${bg} 100%)`;

  return (
    <div
      className="absolute pointer-events-none z-0 rounded-none"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        opacity: dimmed ? 0 : 1,
        transition: `opacity ${DIM_DURATION}s ease-in-out`,
        background: gradientBg,
      }}
      title={`${zone.entity}: ${state ?? '?'}`}
    />
  );
}
