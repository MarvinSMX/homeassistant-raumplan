import type { RoomPlanCardConfig, RoomPlanEntity } from '../lib/types';
import type { HomeAssistant } from 'custom-card-helpers';
import { EntityBadge } from './EntityBadge';
import { HeatmapZone } from './HeatmapZone';
import { getEntityDomain } from './utils';
import { HEATMAP_TAB } from './FilterTabs';

interface PlanImageWithOverlayProps {
  config: RoomPlanCardConfig;
  hass: HomeAssistant;
  host: HTMLElement;
  activeTab: string | null;
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
    activeTab,
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
  const rotation = Number(config.rotation) ?? 0;

  const entities = config?.entities ?? [];
  const filteredEntities: RoomPlanEntity[] =
    activeTab === HEATMAP_TAB
      ? []
      : activeTab === null || activeTab === ''
        ? entities
        : entities.filter((e) => getEntityDomain(e.entity) === activeTab);

  const zones = config?.temperature_zones ?? [];
  const defTap = config?.tap_action ?? { action: 'more-info' as const };

  /* Gemeinsamer Block: alle Layer exakt dieselbe Box (position/size) */
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

  /* Container: volle Kartenfläche, zentriert die Fit-Box, overflow versteckt */
  const containerStyle: Record<string, string | number> = {
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
    boxSizing: 'border-box',
  };

  /* Fit-Box: Bild-Seitenverhältnis, passt immer in die Karte. Breite UND Höhe begrenzt → Bild + Overlay immer gleich, immer in der Card. */
  const fitBoxStyle: Record<string, string | number> = {
    position: 'relative',
    width: '100%',
    height: 'auto',
    maxWidth: '100%',
    maxHeight: '100%',
    aspectRatio: imageAspect,
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
        minHeight: 120,
        width: '100%',
        minWidth: 0,
        position: 'relative',
      }}
    >
      <div style={containerStyle}>
        <div style={fitBoxStyle}>
          {/* 1. Bild: wie vorher – contain, komplett sichtbar, skaliert mit Karte */}
          <img
            src={imgSrc}
            alt="Raumplan"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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
          {/* 2. Heatmap: gleiche Box wie Bild, gleiches Aspect Ratio */}
          {zones.length > 0 && (
            <div style={{ ...overlayBoxStyle, zIndex: 2, pointerEvents: 'none' }}>
              {zones.map((zone, i) => (
                <HeatmapZone key={i} zone={zone} hass={hass} />
              ))}
            </div>
          )}
          {/* 3. Entitäten: gleiche Box wie Bild, gleiches Aspect Ratio */}
          <div style={{ ...overlayBoxStyle, zIndex: 3, pointerEvents: 'none' }}>
            <div style={{ ...overlayBoxStyle, pointerEvents: 'auto' }}>
              {filteredEntities.map((ent, i) => (
                <EntityBadge
                  key={`${ent.entity}-${i}`}
                  ent={ent}
                  hass={hass}
                  host={host}
                  tapAction={ent.tap_action ?? config?.tap_action ?? defTap}
                  holdAction={ent.hold_action ?? config?.hold_action}
                  doubleTapAction={ent.double_tap_action ?? config?.double_tap_action}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
