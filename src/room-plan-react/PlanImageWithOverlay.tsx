import { useState, useEffect, useRef } from 'preact/hooks';
import type { RoomPlanCardConfig, RoomPlanEntity } from '../lib/types';
import type { HeatmapZone } from '../lib/types';
import type { HomeAssistant } from 'custom-card-helpers';
import { handleAction } from 'custom-card-helpers';
import { gsap } from 'gsap';
import { getEntityBoundaries, isPolygonBoundary, getBoundaryPoints, getBoundariesForEntity } from '../lib/utils';
import { EntityBadge } from './EntityBadge';
import { HeatmapZone as HeatmapZoneComponent } from './HeatmapZone';
import { hexToRgba, temperatureColor } from './utils';
import { HEATMAP_TAB } from './FilterTabs';

const HEATMAP_DIM_DURATION = 0.28;

/** Icon-Position über/unter einer Linie: Mittelpunkt + senkrechter Offset (in viewBox %). */
function windowIconPosition(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  position: 'above' | 'below',
  offsetPercent: number = 4
): { x: number; y: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const nx = (dy / len) * offsetPercent;
  const ny = (-dx / len) * offsetPercent;
  if (position === 'above') {
    return { x: mx + nx, y: my + ny };
  }
  return { x: mx - nx, y: my - ny };
}

/** Punkte einer HeatmapZone (Rechteck = 4 Ecken, Polygon = zone.points). */
function getZonePoints(z: HeatmapZone): { x: number; y: number }[] {
  if ('points' in z && Array.isArray(z.points) && z.points.length >= 3) return z.points;
  const zr = z as { x1?: number; y1?: number; x2?: number; y2?: number };
  const x1 = Math.min(100, Math.max(0, Number(zr.x1) ?? 0));
  const y1 = Math.min(100, Math.max(0, Number(zr.y1) ?? 0));
  const x2 = Math.min(100, Math.max(0, Number(zr.x2) ?? 100));
  const y2 = Math.min(100, Math.max(0, Number(zr.y2) ?? 100));
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const right = Math.max(x1, x2);
  const bottom = Math.max(y1, y2);
  return [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
}

/** Eine Entity mit mehreren Boundaries als ein SVG-Shape (ein gemeinsamer radialer Verlauf). */
function HeatmapEntityShape({
  entityId,
  zones,
  hass,
  dimmed,
  overlayBoxStyle,
}: {
  entityId: string;
  zones: HeatmapZone[];
  hass: HomeAssistant;
  dimmed: boolean;
  overlayBoxStyle: Record<string, string>;
}) {
  const state = hass?.states?.[entityId]?.state;
  const num = typeof state === 'string' ? parseFloat(state.replace(',', '.')) : Number(state);
  const temp = Number.isFinite(num) ? num : 20;
  const color = temperatureColor(temp);
  const opacity = Math.min(1, Math.max(0, Number(zones[0]?.opacity) ?? 0.4));
  const fillColor = hexToRgba(color, opacity);

  let minX = 100;
  let minY = 100;
  let maxX = 0;
  let maxY = 0;
  for (const z of zones) {
    for (const p of getZonePoints(z)) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  let r = 0;
  for (const z of zones) {
    for (const p of getZonePoints(z)) {
      const d = Math.hypot(p.x - cx, p.y - cy);
      if (d > r) r = d;
    }
  }
  r = Math.max(r, 1);
  const gradId = `heat-${entityId.replace(/\./g, '-')}`;

  return (
    <div
      style={{
        ...overlayBoxStyle,
        opacity: dimmed ? 0 : 1,
        transition: `opacity ${HEATMAP_DIM_DURATION}s ease-in-out`,
      }}
      title={`${entityId}: ${state ?? '?'}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        aria-hidden
      >
        <defs>
          <radialGradient id={gradId} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={fillColor} />
          </radialGradient>
        </defs>
        {zones.map((z, i) => {
          const pts = getZonePoints(z);
          const d = pts.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          return <path key={i} d={d} fill={`url(#${gradId})`} />;
        })}
      </svg>
    </div>
  );
}

/** SVG-Text mit Font-Fallback für Mobilgeräte: sans-serif in die SVG einfügen. */
function svgWithFontFallback(svgText: string): string {
  const style = '<defs><style>text,tspan{font-family:sans-serif !important}</style></defs>';
  return svgText.replace(/<svg(\s[^>]*)?>/i, (m) => m + style);
}

interface PlanImageWithOverlayProps {
  config: RoomPlanCardConfig;
  flattenedEntities: import('../lib/utils').FlattenedEntity[];
  hass: HomeAssistant;
  host: HTMLElement;
  selectedTabs: Set<string>;
  showHeatmapOverlay?: boolean;
  imageAspect: number;
  imageLoaded: boolean;
  imageError: boolean;
  onImageLoad: (e: Event) => void;
  onImageError: () => void;
}

export function PlanImageWithOverlay(props: PlanImageWithOverlayProps) {
  const {
    config,
    flattenedEntities,
    hass,
    host,
    selectedTabs,
    showHeatmapOverlay = true,
    imageAspect,
    imageLoaded,
    imageError,
    onImageLoad,
    onImageError,
  } = props;

  const img = typeof config.image === 'string' ? config.image : (config?.image as { location?: string } | undefined)?.location ?? '';
  const useDark = config.dark_mode !== undefined ? !!config.dark_mode : (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const darkFilter = useDark ? (config.dark_mode_filter ?? 'brightness(0.88) contrast(1.05)') : 'none';
  const imgSrc = useDark && config.image_dark ? config.image_dark : img;

  const [resolvedSrc, setResolvedSrc] = useState(imgSrc);
  const blobUrlRef = useRef<string | null>(null);
  const [pressBoundaries, setPressBoundaries] = useState<import('../lib/types').RoomBoundaryItem[]>([]);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const pressOverlayRef = useRef<HTMLDivElement | null>(null);

  const onRoomPressStart = (entityId: string, boundaries: import('../lib/types').RoomBoundaryItem[]) => {
    gsap.killTweensOf(pressOverlayRef.current);
    setHoveredEntityId(entityId);
    setPressBoundaries(boundaries.length ? boundaries : []);
  };

  const onRoomPressEnd = () => {
    setHoveredEntityId(null);
    const el = pressOverlayRef.current;
    if (!el) {
      setPressBoundaries([]);
      return;
    }
    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      duration: 0.28,
      ease: 'power2.inOut',
      onComplete: () => setPressBoundaries([]),
    });
  };

  /* Raum abdunkeln: nur Fade-in (Fade-out erst bei onRoomPressEnd) */
  useEffect(() => {
    if (pressBoundaries.length === 0) return;
    const el = pressOverlayRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { opacity: 0 });
    gsap.to(el, { opacity: 1, duration: 0.28, ease: 'power2.inOut' });
    return () => gsap.killTweensOf(el);
  }, [pressBoundaries]);

  useEffect(() => {
    if (!imgSrc || typeof window === 'undefined') {
      setResolvedSrc(imgSrc);
      return;
    }
    const isSvg = imgSrc.toLowerCase().includes('.svg') || imgSrc.toLowerCase().startsWith('data:image/svg');
    let sameOrigin = false;
    try {
      sameOrigin = new URL(imgSrc, window.location.href).origin === window.location.origin;
    } catch {
      sameOrigin = imgSrc.startsWith('/') || imgSrc.startsWith('./');
    }
    if (!isSvg || !sameOrigin) {
      setResolvedSrc(imgSrc);
      return;
    }

    const revokePrevious = () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };

    const urlToFetch = imgSrc.startsWith('data:') ? imgSrc : (imgSrc.startsWith('/') ? `${window.location.origin}${imgSrc}` : imgSrc);
    if (imgSrc.startsWith('data:')) {
      try {
        const base64 = imgSrc.split(',')[1];
        if (base64) {
          revokePrevious();
          const decoded = atob(base64);
          const modified = svgWithFontFallback(decoded);
          const blob = new Blob([modified], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setResolvedSrc(url);
        } else {
          setResolvedSrc(imgSrc);
        }
      } catch {
        setResolvedSrc(imgSrc);
      }
      return revokePrevious;
    }

    revokePrevious();
    fetch(urlToFetch)
      .then((r) => r.text())
      .then((text) => {
        revokePrevious();
        const modified = svgWithFontFallback(text);
        const blob = new Blob([modified], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setResolvedSrc(url);
      })
      .catch(() => setResolvedSrc(imgSrc));

    return revokePrevious;
  }, [imgSrc]);


  const rotation = Number(config.rotation) ?? 0;

  const flattened = flattenedEntities;
  const entities = flattened.map((f) => f.entity);
  /* Alle Tabs inaktiv = keine Entities anzeigen; sonst nach gewählten Preset-Tabs filtern. */
  const filteredEntities =
    selectedTabs.size === 0
      ? []
      : flattened.filter((f) => {
          const preset = f.entity.preset ?? 'default';
          if (preset === 'temperature') return selectedTabs.has(HEATMAP_TAB);
          return selectedTabs.has(preset);
        });
  /* Badges: gleiche Filter wie Tabs (filteredEntities), ohne Fensterkontakt (nur Linien). */
  const badgeEntities = filteredEntities.filter((f) => f.entity.preset !== 'window_contact');
  const windowLineEntities = filteredEntities.filter(
    (f) => f.entity.preset === 'window_contact' && getEntityBoundaries(f.entity).length > 0
  );

  /* Heatmap-Zonen: aus Räumen (room.boundary); Temperatur-Entities */
  const zones: HeatmapZone[] = [];
  for (const { entity: ent, roomIndex } of flattened) {
    if (ent.preset !== 'temperature') continue;
    const boundaries = getBoundariesForEntity(config, roomIndex, ent);
    for (const b of boundaries) {
      if (isPolygonBoundary(b)) {
        zones.push({ entity: ent.entity, points: b.points, opacity: b.opacity ?? 0.4 });
      } else {
        const r = b as { x1: number; y1: number; x2: number; y2: number; opacity?: number };
        zones.push({ entity: ent.entity, x1: r.x1, y1: r.y1, x2: r.x2, y2: r.y2, opacity: r.opacity ?? 0.4 });
      }
    }
  }
  const defTap = config?.tap_action ?? { action: 'more-info' as const };

  /* Gemeinsamer Block: alle Layer exakt dieselbe Box */
  const overlayBoxStyle: Record<string, string> = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    margin: '0',
    padding: '0',
    boxSizing: 'border-box',
  };

  /* Äußere Box: füllt den Bereich, zentriert die Fit-Box. containerType: size für cqw/cqh (Höhe + Breite). */
  const fillBoxStyle: Record<string, string | number> = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: 'var(--ha-card-background)',
    boxSizing: 'border-box',
    containerType: 'size',
  };

  /* Fit-Box: Breite UND Höhe aus Container – größtes Rechteck mit Bild-Aspect, das in die Karte passt. */
  const fitBoxStyle: Record<string, string | number> = {
    position: 'relative',
    width: `min(100cqw, 100cqh * ${imageAspect})`,
    height: `min(100cqh, 100cqw / ${imageAspect})`,
    maxWidth: '100%',
    maxHeight: '100%',
    flexShrink: 0,
    overflow: 'hidden',
    background: 'var(--ha-card-background)',
    boxSizing: 'border-box',
  };

  return (
    <div
      className="flex-1 min-h-0 overflow-hidden w-full min-w-0"
      style={{
        transform: `rotate(${rotation}deg)`,
        minHeight: 280,
        width: '100%',
        minWidth: 0,
        position: 'relative',
      }}
    >
      <div style={fillBoxStyle}>
        <div style={fitBoxStyle}>
          <img
            src={resolvedSrc}
            alt="Raumplan"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
              objectFit: 'contain',
              objectPosition: 'center',
              filter: darkFilter,
              display: 'block',
            }}
            onLoad={onImageLoad}
            onError={onImageError}
          />
          {!imageLoaded && !imageError && (
            <div style={{ ...overlayBoxStyle, background: 'var(--ha-card-background)' }} aria-hidden />
          )}
          {imageError && (
            <div style={{ ...overlayBoxStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ha-card-background)', color: 'var(--secondary-text-color)', fontSize: '0.875rem' }}>
              Bild konnte nicht geladen werden
            </div>
          )}
          {/* Heatmap nur anzeigen, wenn Temperatur-Tab aktiv und Toggle an; pro Entity ein Shape (bei mehreren Boundaries ein gemeinsames SVG) */}
          {zones.length > 0 && selectedTabs.has(HEATMAP_TAB) && showHeatmapOverlay && (() => {
            const byEntity = new Map<string, HeatmapZone[]>();
            for (const z of zones) {
              const list = byEntity.get(z.entity) ?? [];
              list.push(z);
              byEntity.set(z.entity, list);
            }
            return (
              <div style={{ ...overlayBoxStyle, pointerEvents: 'none' }}>
                {Array.from(byEntity.entries()).map(([entityId, entityZones]) =>
                  entityZones.length === 1 ? (
                    <HeatmapZoneComponent
                      key={entityId}
                      zone={entityZones[0]}
                      hass={hass}
                      dimmed={hoveredEntityId === entityId}
                    />
                  ) : (
                    <HeatmapEntityShape
                      key={entityId}
                      entityId={entityId}
                      zones={entityZones}
                      hass={hass}
                      dimmed={hoveredEntityId === entityId}
                      overlayBoxStyle={overlayBoxStyle}
                    />
                  )
                )}
              </div>
            );
          })()}
          {/* Press/Hover-Effekt: Temperatur-Badge → Raumgrenzen abdunkeln (GSAP), mehrere Zonen = ein Shape wie Heatmap */}
          {pressBoundaries.length > 0 && (
            <div
              ref={pressOverlayRef}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: 0,
              }}
              aria-hidden
            >
              {(() => {
                const bounds = pressBoundaries;
                let minX = 100, minY = 100, maxX = 0, maxY = 0;
                for (const b of bounds) {
                  for (const p of getBoundaryPoints(b)) {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                  }
                }
                const cx = (minX + maxX) / 2;
                const cy = (minY + maxY) / 2;
                let r = 0;
                for (const b of bounds) {
                  for (const p of getBoundaryPoints(b)) {
                    const d = Math.hypot(p.x - cx, p.y - cy);
                    if (d > r) r = d;
                  }
                }
                r = Math.max(r, 1);
                return (
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
                    <defs>
                      <radialGradient id="dim-gradient" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
                      </radialGradient>
                    </defs>
                    {bounds.map((b, i) => {
                      const pts = getBoundaryPoints(b);
                      const d = pts.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
                      return <path key={i} d={d} fill="url(#dim-gradient)" />;
                    })}
                  </svg>
                );
              })()}
            </div>
          )}
          {windowLineEntities.length > 0 && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                ...overlayBoxStyle,
                pointerEvents: 'none',
              }}
              aria-hidden
            >
              {windowLineEntities.flatMap((f) => {
                const ent = f.entity;
                const state = hass?.states?.[ent.entity]?.state ?? '';
                const isOpen = ['on', 'open', 'opening'].includes(String(state).toLowerCase());
                const stroke = isOpen
                  ? (ent.line_color_open ?? 'var(--error-color, #f44336)')
                  : (ent.line_color_closed ?? 'var(--secondary-text-color, #9e9e9e)');
                const thickness = Math.min(3, Math.max(0.2, Number(ent.line_thickness) ?? 1));
                const opacity = Math.min(1, Math.max(0, Number(ent.background_opacity) ?? 1));
                const actionConfig = {
                  entity: ent.entity,
                  tap_action: ent.tap_action ?? config?.tap_action ?? defTap,
                  hold_action: ent.hold_action ?? config?.hold_action,
                  double_tap_action: ent.double_tap_action ?? config?.double_tap_action,
                };
                return getEntityBoundaries(ent)
                  .filter((b) => !isPolygonBoundary(b))
                  .map((b, bi) => {
                    const br = b as { x1: number; y1: number; x2: number; y2: number };
                    return (
                  <g
                    key={`${ent.entity}-${bi}`}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={() => handleAction(host, hass, actionConfig, 'tap')}
                    onPointerDown={(ev) => ev.stopPropagation()}
                  >
                    <line
                      x1={br.x1}
                      y1={br.y1}
                      x2={br.x2}
                      y2={br.y2}
                      stroke={stroke}
                      strokeWidth={thickness}
                      strokeLinecap="butt"
                      strokeOpacity={opacity}
                    />
                  </g>
                    );
                  });
              })}
            </svg>
          )}
          {windowLineEntities.length > 0 &&
            (() => {
              const defTap = config?.tap_action ?? { action: 'more-info' as const };
              const items: { key: string; x: number; y: number; isOpen: boolean; color: string; ent: RoomPlanEntity; actionConfig: { entity: string; tap_action: import('custom-card-helpers').ActionConfig; hold_action?: import('custom-card-helpers').ActionConfig; double_tap_action?: import('custom-card-helpers').ActionConfig } }[] = [];
              for (const f of windowLineEntities) {
                const ent = f.entity;
                const state = hass?.states?.[ent.entity]?.state ?? '';
                const isOpen = ['on', 'open', 'opening'].includes(String(state).toLowerCase());
                const color = isOpen
                  ? (ent.line_color_open ?? 'var(--error-color, #f44336)')
                  : (ent.line_color_closed ?? 'var(--secondary-text-color, #9e9e9e)');
                const pos = ent.window_icon_position ?? 'above';
                const actionConfig = {
                  entity: ent.entity,
                  tap_action: ent.tap_action ?? config?.tap_action ?? defTap,
                  hold_action: ent.hold_action ?? config?.hold_action,
                  double_tap_action: ent.double_tap_action ?? config?.double_tap_action,
                };
                getEntityBoundaries(ent)
                  .filter((b) => !isPolygonBoundary(b))
                  .forEach((b, bi) => {
                    const br = b as { x1: number; y1: number; x2: number; y2: number };
                    const { x, y } = windowIconPosition(br.x1, br.y1, br.x2, br.y2, pos);
                    items.push({
                      key: `${ent.entity}-${bi}`,
                      x: Math.min(100, Math.max(0, x)),
                      y: Math.min(100, Math.max(0, y)),
                      isOpen,
                      color,
                      ent,
                      actionConfig,
                    });
                  });
              }
              return (
                <div
                  style={{
                    ...overlayBoxStyle,
                    pointerEvents: 'none',
                  }}
                  aria-hidden
                >
                  {items.map((item) => (
                    <div
                      key={item.key}
                      role="button"
                      tabIndex={0}
                      title={`${item.ent.entity}: ${item.isOpen ? 'Offen' : 'Zu'}`}
                      style={{
                        position: 'absolute',
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 'clamp(18px, 4vw, 28px)',
                        height: 'clamp(18px, 4vw, 28px)',
                        minWidth: 18,
                        minHeight: 18,
                      }}
                      onClick={() => handleAction(host, hass, item.actionConfig, 'tap')}
                      onPointerDown={(ev) => ev.stopPropagation()}
                    >
                      <ha-icon
                        icon={item.isOpen ? 'mdi:lock-open' : 'mdi:lock'}
                        style={{
                          width: '100%',
                          height: '100%',
                          color: item.color,
                          display: 'block',
                        }}
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          <div style={{ ...overlayBoxStyle, pointerEvents: 'none', isolation: 'isolate', visibility: 'visible' }}>
            <div style={{ ...overlayBoxStyle, pointerEvents: 'auto', visibility: 'visible', minWidth: '100%', minHeight: '100%' }}>
              {badgeEntities.map((f, i) => {
                const ent = f.entity;
                const bounds = getBoundariesForEntity(config, f.roomIndex, ent);
                const hasBounds = bounds.length > 0;
                return (
                  <EntityBadge
                    key={`${ent.entity}-${f.roomIndex ?? -1}-${f.entityIndexInRoom}-${i}`}
                    ent={ent}
                    hass={hass}
                    host={host}
                    tapAction={ent.tap_action ?? config?.tap_action ?? defTap}
                    holdAction={ent.hold_action ?? config?.hold_action}
                    doubleTapAction={ent.double_tap_action ?? config?.double_tap_action}
                    onRoomPressStart={ent.preset === 'temperature' && hasBounds ? (_id, _b) => onRoomPressStart(ent.entity, bounds) : undefined}
                    onRoomPressEnd={ent.preset === 'temperature' && hasBounds ? onRoomPressEnd : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
