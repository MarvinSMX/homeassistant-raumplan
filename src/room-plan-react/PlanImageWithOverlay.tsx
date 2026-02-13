import { useState, useEffect, useRef } from 'preact/hooks';
import type { RoomPlanCardConfig, RoomPlanEntity } from '../lib/types';
import type { HomeAssistant } from 'custom-card-helpers';
import { handleAction } from 'custom-card-helpers';
import { gsap } from 'gsap';
import { EntityBadge } from './EntityBadge';
import { HeatmapZone } from './HeatmapZone';
import { getEntityDomain } from './utils';
import { HEATMAP_TAB } from './FilterTabs';

/** SVG-Text mit Font-Fallback für Mobilgeräte: sans-serif in die SVG einfügen. */
function svgWithFontFallback(svgText: string): string {
  const style = '<defs><style>text,tspan{font-family:sans-serif !important}</style></defs>';
  return svgText.replace(/<svg(\s[^>]*)?>/i, (m) => m + style);
}

interface PlanImageWithOverlayProps {
  config: RoomPlanCardConfig;
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
  const [pressBoundary, setPressBoundary] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const pressOverlayRef = useRef<HTMLDivElement>(null);

  const onRoomPress = (boundary: { x1: number; y1: number; x2: number; y2: number }) => {
    gsap.killTweensOf(pressOverlayRef.current);
    setPressBoundary(boundary);
  };

  /* Raum abdunkeln: GSAP Fade-in, Haltephase, Fade-out */
  useEffect(() => {
    if (!pressBoundary) return;
    const run = () => {
      const el = pressOverlayRef.current;
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.set(el, { opacity: 0 });
      gsap.to(el, { opacity: 1, duration: 0.28, ease: 'power2.inOut' }).then(() => {
        gsap.to(el, {
          opacity: 0,
          duration: 0.28,
          delay: 0.36,
          ease: 'power2.inOut',
          onComplete: () => setPressBoundary(null),
        });
      });
    };
    const id = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(id);
      if (pressOverlayRef.current) gsap.killTweensOf(pressOverlayRef.current);
    };
  }, [pressBoundary]);

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

  const entities = config?.entities ?? [];
  const filteredEntities: RoomPlanEntity[] = entities.filter((e) =>
    selectedTabs.has(getEntityDomain(e.entity)) ||
    (selectedTabs.has(HEATMAP_TAB) && e.preset === 'temperature')
  );
  const badgeEntities = filteredEntities.filter((e) => e.preset !== 'window_contact');
  const windowLineEntities = filteredEntities.filter(
    (e) => e.preset === 'window_contact' && e.room_boundary
  );

  const zones = config?.temperature_zones ?? [];
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
              zIndex: 0,
              display: 'block',
            }}
            onLoad={onImageLoad}
            onError={onImageError}
          />
          {!imageLoaded && !imageError && (
            <div style={{ ...overlayBoxStyle, zIndex: 1, background: 'var(--ha-card-background)' }} aria-hidden />
          )}
          {imageError && (
            <div style={{ ...overlayBoxStyle, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ha-card-background)', color: 'var(--secondary-text-color)', fontSize: '0.875rem' }}>
              Bild konnte nicht geladen werden
            </div>
          )}
          {/* Heatmap nur anzeigen, wenn Temperatur-Tab aktiv und Toggle an */}
          {zones.length > 0 && selectedTabs.has(HEATMAP_TAB) && showHeatmapOverlay && (
            <div style={{ ...overlayBoxStyle, zIndex: 2, pointerEvents: 'none' }}>
              {zones.map((zone, i) => (
                <HeatmapZone key={i} zone={zone} hass={hass} />
              ))}
            </div>
          )}
          {/* Press/Hover-Effekt: Temperatur-Badge → Raumgrenze abdunkeln (GSAP) */}
          {pressBoundary && (
            <div
              ref={pressOverlayRef}
              style={{
                position: 'absolute',
                left: `${Math.min(pressBoundary.x1, pressBoundary.x2)}%`,
                top: `${Math.min(pressBoundary.y1, pressBoundary.y2)}%`,
                width: `${Math.abs(pressBoundary.x2 - pressBoundary.x1) || 1}%`,
                height: `${Math.abs(pressBoundary.y2 - pressBoundary.y1) || 1}%`,
                background: 'rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
                zIndex: 2.5,
              }}
              aria-hidden
            />
          )}
          {windowLineEntities.length > 0 && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                ...overlayBoxStyle,
                zIndex: 2.6,
                pointerEvents: 'none',
              }}
              aria-hidden
            >
              {windowLineEntities.map((ent) => {
                const b = ent.room_boundary!;
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
                return (
                  <g
                    key={ent.entity}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={() => handleAction(host, hass, actionConfig, 'tap')}
                    onPointerDown={(ev) => ev.stopPropagation()}
                  >
                    <line
                      x1={b.x1}
                      y1={b.y1}
                      x2={b.x2}
                      y2={b.y2}
                      stroke={stroke}
                      strokeWidth={thickness}
                      strokeLinecap="butt"
                      strokeOpacity={opacity}
                    />
                  </g>
                );
              })}
            </svg>
          )}
          <div style={{ ...overlayBoxStyle, zIndex: 3, pointerEvents: 'none' }}>
            <div style={{ ...overlayBoxStyle, pointerEvents: 'auto' }}>
              {badgeEntities.map((ent, i) => (
                <EntityBadge
                  key={`${ent.entity}-${i}`}
                  ent={ent}
                  hass={hass}
                  host={host}
                  tapAction={ent.tap_action ?? config?.tap_action ?? defTap}
                  holdAction={ent.hold_action ?? config?.hold_action}
                  doubleTapAction={ent.double_tap_action ?? config?.double_tap_action}
                  onRoomPress={ent.preset === 'temperature' && ent.room_boundary ? onRoomPress : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
