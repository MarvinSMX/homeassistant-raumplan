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

  return (
    <div className="flex-1 flex items-center justify-center min-h-[120px] overflow-hidden w-full" style={{ transform: `rotate(${rotation}deg)` }}>
      <div
        className="relative w-full max-w-full flex-shrink-0 overflow-hidden"
        style={{
          height: 0,
          paddingBottom: `${100 / imageAspect}%`,
        }}
      >
        {zones.length > 0 && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            {zones.map((zone, i) => (
              <HeatmapZone key={i} zone={zone} hass={hass} />
            ))}
          </div>
        )}
        <img
          src={imgSrc}
          alt="Raumplan"
          className="absolute top-0 left-0 w-full h-full object-fill object-center z-[1]"
          style={{ filter: darkFilter }}
          onLoad={onImageLoad}
          onError={onImageError}
        />
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 z-[1] bg-[var(--ha-card-background)]" aria-hidden />
        )}
        {imageError && (
          <div className="absolute inset-0 z-[1] flex items-center justify-center bg-[var(--ha-card-background)] text-[var(--secondary-text-color)] text-sm">
            Bild konnte nicht geladen werden
          </div>
        )}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-[2]" style={{ pointerEvents: 'none' }}>
          <div className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'auto' }}>
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
  );
}
