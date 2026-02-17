import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { RoomPlanCardConfig, RoomPlanEntity } from '../lib/types';
import type { HeatmapZone } from '../lib/types';
import type { HomeAssistant } from 'custom-card-helpers';
import { handleAction } from 'custom-card-helpers';
import { gsap } from 'gsap';
import { getEntityBoundaries, isPolygonBoundary, getBoundaryPoints, getBoundariesForEntity, getTemperatureFromEntity, getEntityDisplayPosition, getEntityCoord, getBuildings } from '../lib/utils';
import { EntityBadge } from './EntityBadge';
import { HeatmapZone as HeatmapZoneComponent } from './HeatmapZone';
import { hexToRgba, temperatureColor, intensityForArea } from './utils';
import { getEntityCategoryId } from '../lib/utils';

const HEATMAP_DIM_DURATION = 0.28;

const SLIDING_DOOR_ANIMATION_MS = 350;

/** Schiebetür: nur verschieben innerhalb der Linie. Zu = Tür bis Mitte (L/2), Offen = kurz vor Ende. Kein Skalieren. */
function slidingDoorPosition(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number,
  direction: 'left' | 'right'
): { outerX: number; outerY: number; innerX: number; innerY: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const closedLen = L / 2;
  const openLen = Math.max(L * 0.06, 0.5);
  const doorLen = openLen + (closedLen - openLen) * (1 - t);
  if (direction === 'right') {
    return {
      outerX: x2,
      outerY: y2,
      innerX: x2 - doorLen * ux,
      innerY: y2 - doorLen * uy,
    };
  }
  return {
    outerX: x1,
    outerY: y1,
    innerX: x1 + doorLen * ux,
    innerY: y1 + doorLen * uy,
  };
}

/** Doppelte Schiebetür: nur verschieben. Zu = beide genau L/2, komplett aneinander in der Mitte. Offen = kurz vor Ende. */
function slidingDoorPositionDouble(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number
): { left: { outerX: number; outerY: number; innerX: number; innerY: number }; right: { outerX: number; outerY: number; innerX: number; innerY: number } } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const closedLen = L / 2;
  const openLen = Math.max(L * 0.06, 0.5);
  const doorLen = openLen + (closedLen - openLen) * (1 - t);
  return {
    left: {
      outerX: x1,
      outerY: y1,
      innerX: x1 + doorLen * ux,
      innerY: y1 + doorLen * uy,
    },
    right: {
      outerX: x2,
      outerY: y2,
      innerX: x2 - doorLen * ux,
      innerY: y2 - doorLen * uy,
    },
  };
}

/** Animierte Schiebetür-Segmente (eine oder zwei Türen je nach direction). */
function SlidingDoorSegments({
  br,
  isOpen,
  direction,
  doorColor,
  thickness,
  opacity,
}: {
  br: { x1: number; y1: number; x2: number; y2: number };
  isOpen: boolean;
  direction: 'left' | 'right' | 'double';
  doorColor: string;
  thickness: number;
  opacity: number;
}) {
  const targetT = isOpen ? 1 : 0;
  const [t, setT] = useState(targetT);
  const tRef = useRef(t);
  tRef.current = t;
  const rafRef = useRef<number>(0);
  const startRef = useRef<{ t: number; time: number }>({ t: 0, time: 0 });

  useEffect(() => {
    const currentT = tRef.current;
    if (currentT === targetT) return;
    startRef.current = { t: currentT, time: performance.now() };
    const duration = SLIDING_DOOR_ANIMATION_MS;
    const startT = currentT;

    const tick = (now: number) => {
      const elapsed = now - startRef.current.time;
      const frac = Math.min(1, elapsed / duration);
      const ease = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2;
      const newT = startT + (targetT - startT) * ease;
      setT(newT);
      if (frac < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetT]);

  const dir = direction === 'double' ? 'left' : direction;
  const singlePos = direction !== 'double' && slidingDoorPosition(br.x1, br.y1, br.x2, br.y2, t, dir);
  const doublePos = direction === 'double' && slidingDoorPositionDouble(br.x1, br.y1, br.x2, br.y2, t);

  const doorLine = (pos: { outerX: number; outerY: number; innerX: number; innerY: number }) => (
    <line
      x1={pos.outerX}
      y1={pos.outerY}
      x2={pos.innerX}
      y2={pos.innerY}
      stroke={doorColor}
      strokeWidth={thickness}
      strokeLinecap="butt"
      strokeOpacity={opacity}
    />
  );

  if (direction === 'double' && doublePos) {
    return (
      <>
        {doorLine(doublePos.left)}
        {doorLine(doublePos.right)}
      </>
    );
  }
  if (direction !== 'double' && singlePos) {
    return doorLine(singlePos);
  }
  return null;
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
  const temp = getTemperatureFromEntity(hass, entityId, zones[0]?.temperature_attribute);
  const state = hass?.states?.[entityId]?.state;
  const color = temperatureColor(temp);
  const baseOpacity = Math.min(1, Math.max(0, Number(zones[0]?.opacity) ?? 0.4));

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
  const areaApprox = 4 * r * r;
  const intensity = intensityForArea(areaApprox);
  const fillColor = hexToRgba(color, baseOpacity * intensity);
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
  allTabIds: string[];
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
    allTabIds,
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
  const [hoveredSlidingDoorEntityId, setHoveredSlidingDoorEntityId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panZoomStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const pressOverlayRef = useRef<HTMLDivElement | null>(null);
  const panZoomWrapRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef(pan);
  const scaleRef = useRef(scale);
  panRef.current = pan;
  scaleRef.current = scale;

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
  const buildings = getBuildings(config);
  const hasBuildings = buildings.length > 0;

  const flattened = flattenedEntities;
  const entities = flattened.map((f) => f.entity);
  /* Keine Kategorien = alle Entities; alle Tabs inaktiv = keine; sonst nach gewählten Kategorien filtern. */
  const filteredEntities =
    allTabIds.length === 0
      ? flattened
      : selectedTabs.size === 0
        ? []
        : flattened.filter((f) => selectedTabs.has(getEntityCategoryId(f.entity)));
  /* Badges: ohne Fensterkontakt (nur Linie). Schiebetür hat Linie (Tür) + Badge (Punkt), beide frei platzierbar. */
  const badgeEntities = filteredEntities.filter((f) => f.entity.preset !== 'window_contact');
  const windowLineEntities = filteredEntities.filter(
    (f) => f.entity.preset === 'window_contact' && getEntityBoundaries(f.entity).length > 0
  );
  const slidingDoorEntities = filteredEntities.filter(
    (f) => f.entity.preset === 'sliding_door' && getEntityBoundaries(f.entity).length > 0
  );

  /* Heatmap-Zonen: aus Räumen (room.boundary); Temperatur-Entities */
  const zones: HeatmapZone[] = [];
  for (const { entity: ent, roomIndex } of flattened) {
    if (ent.preset !== 'temperature') continue;
    const boundaries = getBoundariesForEntity(config, roomIndex, ent);
    const tempAttr = ent.temperature_attribute;
    for (const b of boundaries) {
      if (isPolygonBoundary(b)) {
        zones.push({ entity: ent.entity, points: b.points, opacity: b.opacity ?? 0.4, temperature_attribute: tempAttr });
      } else {
        const r = b as { x1: number; y1: number; x2: number; y2: number; opacity?: number };
        zones.push({ entity: ent.entity, x1: r.x1, y1: r.y1, x2: r.x2, y2: r.y2, opacity: r.opacity ?? 0.4, temperature_attribute: tempAttr });
      }
    }
  }
  const defTap = config?.tap_action ?? { action: 'more-info' as const };

  const handlePanZoomPointerDown = (e: import('preact').JSX.TargetedPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest?.('[data-no-pan]')) return;
    panZoomStartRef.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y };
    setIsPanning(true);
    panZoomWrapRef.current?.setPointerCapture?.(e.pointerId);
  };
  const handlePanZoomPointerMove = (e: import('preact').JSX.TargetedPointerEvent<HTMLDivElement>) => {
    if (!panZoomStartRef.current) return;
    setPan({
      x: panZoomStartRef.current.panX + e.clientX - panZoomStartRef.current.clientX,
      y: panZoomStartRef.current.panY + e.clientY - panZoomStartRef.current.clientY,
    });
  };
  const handlePanZoomPointerUp = (e: import('preact').JSX.TargetedPointerEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      panZoomStartRef.current = null;
      setIsPanning(false);
      panZoomWrapRef.current?.releasePointerCapture?.(e.pointerId);
    }
  };
  const handlePanZoomWheel = (e: WheelEvent) => {
    e.preventDefault();
    const el = panZoomWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    const currentScale = scaleRef.current;
    const currentPan = panRef.current;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(3, Math.max(0.5, currentScale * factor));
    const ratio = newScale / currentScale;
    setPan({
      x: currentPan.x * ratio + relX * (1 - ratio),
      y: currentPan.y * ratio + relY * (1 - ratio),
    });
    setScale(newScale);
  };
  useEffect(() => {
    const el = panZoomWrapRef.current;
    if (!el) return;
    el.addEventListener('wheel', handlePanZoomWheel, { passive: false });
    return () => el.removeEventListener('wheel', handlePanZoomWheel);
  }, []);

  /** Bei Gebäuden: Zoom/Pan so setzen, dass alle Gebäude grade so sichtbar sind. */
  const applyFitBuildingsView = useCallback(() => {
    if (!hasBuildings || buildings.length === 0) return;
    const el = panZoomWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    if (W <= 0 || H <= 0) return;
    let left = 100, top = 100, right = 0, bottom = 0;
    for (const b of buildings) {
      const x = Number(b.x) ?? 0;
      const y = Number(b.y) ?? 0;
      const w = Number(b.width) ?? 20;
      const ar = Number(b.aspect_ratio) > 0 ? b.aspect_ratio! : null;
      const h = ar != null ? w / ar : (Number(b.height) ?? 20);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x + w);
      bottom = Math.max(bottom, y + h);
    }
    const boxW = right - left;
    const boxH = bottom - top;
    if (boxW <= 0 || boxH <= 0) return;
    /* Zoom so groß wie möglich, damit alle Gebäude den View füllen (max 3x), sonst wirkt alles zu klein */
    const scaleToFit = Math.min(3, 100 / boxW, 100 / boxH);
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    setScale(scaleToFit);
    /* Pan so, dass Gebäude-Mittelpunkt in der Kartenmitte liegt (Reihenfolge: scale dann translate) */
    setPan({
      x: W * scaleToFit * (0.5 - centerX / 100),
      y: H * scaleToFit * (0.5 - centerY / 100),
    });
  }, [hasBuildings, buildings]);

  /** Reset mit zweitem Lauf nach Layout-Update, damit nach Zoom-Änderung die Kartengröße stimmt. */
  const applyFitBuildingsViewStable = useCallback(() => {
    applyFitBuildingsView();
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(applyFitBuildingsView);
    });
    return () => cancelAnimationFrame(t);
  }, [applyFitBuildingsView]);

  useEffect(() => {
    if (!hasBuildings || buildings.length === 0) return;
    const t = requestAnimationFrame(() => {
      applyFitBuildingsViewStable();
    });
    return () => cancelAnimationFrame(t);
  }, [hasBuildings, applyFitBuildingsViewStable]);

  const zoomBtnStyle: Record<string, string | number> = {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: '1px solid var(--divider-color)',
    borderRadius: 6,
    background: 'var(--secondary-background-color, rgba(0,0,0,0.05))',
    color: 'var(--primary-text-color)',
    fontSize: '1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    lineHeight: 1,
  };

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

  /* Bei Gebäuden: Workspace = ganze Card (absolut füllend), damit Fit/Reset sich an der Kartengröße orientiert. */
  const wrapStyle = hasBuildings
    ? { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' as const, boxSizing: 'border-box' as const }
    : fitBoxStyle;

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
        <div
          ref={panZoomWrapRef}
          style={{
            ...wrapStyle,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '50% 50%',
            touchAction: 'none',
            cursor: isPanning ? 'grabbing' : 'grab',
          }}
          onPointerDown={handlePanZoomPointerDown}
          onPointerMove={handlePanZoomPointerMove}
          onPointerUp={handlePanZoomPointerUp}
          onPointerLeave={handlePanZoomPointerUp}
        >
          {/* Kein globales Bild bei Gebäuden – nur Gebäude-Bereiche mit ihren Bildern; sonst ein Plan-Bild */}
          {!hasBuildings && (
            <>
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
            </>
          )}
          {/* Bei Gebäuden: nur Gebäude-Bereiche mit eigenem Bild (kein globales Plan-Bild). pointer-events: none damit Pan/Zoom (Wrapper) funktioniert. */}
          {hasBuildings && buildings.map((b, bi) => {
            const scale = Math.max(0.25, Math.min(3, Number(b.scale) ?? 1));
            const w = Number(b.width) ?? 20;
            const ar = Number(b.aspect_ratio) > 0 ? b.aspect_ratio! : null;
            const h = ar != null ? w / ar : (Number(b.height) ?? 20);
            return (
            <div
              key={bi}
              style={{
                position: 'absolute',
                left: `${Number(b.x) ?? 0}%`,
                top: `${Number(b.y) ?? 0}%`,
                width: `${w}%`,
                height: `${h}%`,
                overflow: 'hidden',
                boxSizing: 'border-box',
                pointerEvents: 'none',
                transform: `scale(${scale}) rotate(${Number(b.rotation) ?? 0}deg)`,
                transformOrigin: '50% 50%',
                background: 'transparent',
              }}
            >
              <img
                src={typeof b.image === 'string' ? b.image : ''}
                alt={b.name ?? `Gebäude ${bi + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  padding: 0,
                  boxSizing: 'border-box',
                  objectFit: ar != null ? 'fill' : 'contain',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            </div>
            );
          })}
          {/* Overlays nur ohne Gebäude (mit Gebäuden liegen Entities in den Gebäude-Bereichen; Overlays pro Gebäude optional erweiterbar) */}
          {!hasBuildings && zones.length > 0 && selectedTabs.has('temperature') && showHeatmapOverlay && (() => {
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
          {!hasBuildings && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
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
                const dimArea = 4 * r * r;
                const dimIntensity = intensityForArea(dimArea);
                const dimAlpha = 0.45 * dimIntensity;
                return (
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
                    <defs>
                      <radialGradient id="dim-gradient" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="100%" stopColor={`rgba(0,0,0,${dimAlpha})`} />
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
                    data-no-pan
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={() => handleAction(host, hass, actionConfig, 'tap')}
                    onPointerDown={(ev) => ev.stopPropagation()}
                  >
                    <line
                      x1={br.x1}
                      y1={br.y1}
                      x2={br.x2}
                      y2={br.y2}
                      stroke="transparent"
                      strokeWidth={10}
                      strokeLinecap="butt"
                    />
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
          {slidingDoorEntities.length > 0 && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                ...overlayBoxStyle,
                pointerEvents: 'none',
              }}
              aria-hidden
            >
              {slidingDoorEntities.flatMap((f) => {
                const ent = f.entity;
                const state = hass?.states?.[ent.entity]?.state ?? '';
                const isOpen = ['on', 'open', 'opening'].includes(String(state).toLowerCase());
                const trackColor = ent.line_color_closed ?? 'var(--secondary-text-color, #9e9e9e)';
                const doorColor = ent.line_color_open ?? 'var(--primary-color, #03a9f4)';
                const trackThickness = Math.min(3, Math.max(0.2, Number(ent.line_thickness) ?? 1));
                const doorThickness = Math.min(3, Math.max(0.2, Number(ent.sliding_door_door_thickness) ?? trackThickness));
                const opacity = Math.min(1, Math.max(0, Number(ent.background_opacity) ?? 1));
                const direction = ent.sliding_door_direction ?? 'left';
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
                        key={`sliding-${ent.entity}-${bi}`}
                        data-no-pan
                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        onClick={() => handleAction(host, hass, actionConfig, 'tap')}
                        onPointerDown={(ev) => ev.stopPropagation()}
                      >
                        <line
                          x1={br.x1}
                          y1={br.y1}
                          x2={br.x2}
                          y2={br.y2}
                          stroke={trackColor}
                          strokeWidth={trackThickness}
                          strokeLinecap="butt"
                          strokeOpacity={opacity}
                        />
                        <SlidingDoorSegments
                          br={br}
                          isOpen={hoveredSlidingDoorEntityId === ent.entity ? false : isOpen}
                          direction={direction}
                          doorColor={doorColor}
                          thickness={doorThickness}
                          opacity={opacity}
                        />
                      </g>
                    );
                  });
              })}
            </svg>
          )}
          <div style={{ ...overlayBoxStyle, pointerEvents: 'none', isolation: 'isolate', visibility: 'visible' }}>
            <div
              style={{
                ...overlayBoxStyle,
                pointerEvents: 'auto',
                visibility: 'visible',
                minWidth: '100%',
                minHeight: '100%',
                overflow: 'hidden',
                isolation: 'isolate',
              }}
            >
              {badgeEntities.map((f) => {
                const ent = f.entity;
                const bounds = getBoundariesForEntity(config, f.roomIndex, ent);
                const hasBounds = bounds.length > 0;
                /* Schiebetür: Badge an Punkt (ent.x/ent.y); ohne Punkt = Mitte der Linie. Tür = Linie, Badge = Punkt, beide frei platzierbar. */
                const displayPosition =
                  ent.preset === 'sliding_door'
                    ? (() => {
                        const px = getEntityCoord(ent, 'x');
                        const py = getEntityCoord(ent, 'y');
                        if (px != null && py != null && Number.isFinite(Number(px)) && Number.isFinite(Number(py))) {
                          return { x: Math.min(100, Math.max(0, Number(px))), y: Math.min(100, Math.max(0, Number(py))) };
                        }
                        const doorLines = getEntityBoundaries(ent).filter((b) => !isPolygonBoundary(b));
                        const first = doorLines[0] as { x1?: number; y1?: number; x2?: number; y2?: number } | undefined;
                        if (first && first.x1 != null && first.y1 != null && first.x2 != null && first.y2 != null) {
                          return {
                            x: Math.min(100, Math.max(0, (first.x1 + first.x2) / 2)),
                            y: Math.min(100, Math.max(0, (first.y1 + first.y2) / 2)),
                          };
                        }
                        return { x: 50, y: 50 };
                      })()
                    : getEntityDisplayPosition(f.room ?? null, ent);
                return (
                  <EntityBadge
                    key={f.uniqueKey}
                    ent={ent}
                    hass={hass}
                    host={host}
                    displayPosition={displayPosition}
                    tapAction={ent.tap_action ?? config?.tap_action ?? defTap}
                    holdAction={ent.hold_action ?? config?.hold_action}
                    doubleTapAction={ent.double_tap_action ?? config?.double_tap_action}
                    onRoomPressStart={ent.preset === 'temperature' && hasBounds ? (_id, _b) => onRoomPressStart(ent.entity, bounds) : undefined}
                    onRoomPressEnd={ent.preset === 'temperature' && hasBounds ? onRoomPressEnd : undefined}
                    onBadgeHoverStart={ent.preset === 'sliding_door' ? () => setHoveredSlidingDoorEntityId(ent.entity) : undefined}
                    onBadgeHoverEnd={ent.preset === 'sliding_door' ? () => setHoveredSlidingDoorEntityId(null) : undefined}
                  />
                );
              })}
            </div>
          </div>
          </div>
          )}
        </div>
        {/* Zoom-Steuerung immer unten rechts (nicht im Pan-Wrapper, damit sie nicht mitzieht) */}
        <div
          data-no-pan
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 4,
            borderRadius: 8,
            background: 'var(--ha-card-background)',
            border: '1px solid var(--divider-color)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3, s * 1.2))}
            style={zoomBtnStyle}
            title="Vergrößern"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, s / 1.2))}
            style={zoomBtnStyle}
            title="Verkleinern"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => { if (hasBuildings) applyFitBuildingsViewStable(); else { setPan({ x: 0, y: 0 }); setScale(1); } }}
            style={zoomBtnStyle}
            title="Ansicht zurücksetzen"
          >
            ⟲
          </button>
        </div>
      </div>
    </div>
  );
}
