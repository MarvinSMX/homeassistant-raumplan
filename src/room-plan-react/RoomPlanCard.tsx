import { useState, useCallback, useMemo, useEffect, useRef } from 'preact/hooks';
import type { RoomPlanCardConfig } from '../lib/types';
import type { HomeAssistant } from 'custom-card-helpers';
import { FilterTabs } from './FilterTabs';
import { PlanImageWithOverlay } from './PlanImageWithOverlay';
import type { FlattenedEntity } from '../lib/utils';
import { getFlattenedEntities, getBoundariesForEntity, getEffectiveCategories } from '../lib/utils';

interface RoomPlanCardProps {
  hass: HomeAssistant;
  config: RoomPlanCardConfig;
  host: HTMLElement;
  cssString: string;
}

export function RoomPlanCard({ hass, config, host, cssString }: RoomPlanCardProps) {
  /** Entities direkt aus config: for each config.rooms, for each room.entities – sonst config.entities (Legacy). */
  const flattenedEntities = useMemo(
    () => getFlattenedEntities(config),
    [config]
  );

  const { allTabIds, categoryLabels } = useMemo(() => {
    const categories = getEffectiveCategories(config);
    const tabIds = categories.map((c) => c.id);
    const labels: Record<string, string> = {};
    for (const c of categories) labels[c.id] = c.label;
    return { allTabIds: tabIds, categoryLabels: labels };
  }, [config]);

  const [selectedTabs, setSelectedTabs] = useState<Set<string>>(new Set());
  const tabsInitialized = useRef(false);
  useEffect(() => {
    if (allTabIds.length === 0) return;
    if (!tabsInitialized.current) {
      tabsInitialized.current = true;
      setSelectedTabs(new Set(allTabIds));
    }
  }, [allTabIds]);
  useEffect(() => {
    tabsInitialized.current = false;
  }, [config]);

  const onSelectTab = useCallback((id: string | null) => {
    if (id === null) {
      /* "Alle" klicken: wenn alle aktiv → alle abwählen (keine Entities); sonst alle aktivieren */
      setSelectedTabs((prev) =>
        prev.size === allTabIds.length ? new Set() : new Set(allTabIds)
      );
    } else {
      setSelectedTabs((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }, [allTabIds]);
  const [imageAspect, setImageAspect] = useState(16 / 9);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState(true);
  const hasHeatmapZones = useMemo(() => {
    return flattenedEntities.some((f) => f.entity.preset === 'temperature' && getBoundariesForEntity(config, f.roomIndex, f.entity).length > 0);
  }, [config, flattenedEntities]);
  const isTemperaturTabSelected = selectedTabs.has('temperature');

  const onImageLoad = useCallback((e: Event) => {
    const img = e.target as HTMLImageElement;
    if (img?.naturalWidth && img?.naturalHeight) {
      setImageAspect(img.naturalWidth / img.naturalHeight);
    }
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const onImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const img = typeof config.image === 'string' ? config.image : (config?.image as { location?: string } | undefined)?.location ?? '';

  if (!img) {
    return (
      <ha-card>
        <style dangerouslySetInnerHTML={{ __html: cssString }} />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ha-icon icon="mdi:floor-plan" class="text-[var(--primary-color)] mb-4" />
          <p className="text-[var(--secondary-text-color)]">Bitte konfigurieren</p>
        </div>
      </ha-card>
    );
  }

  return (
    <ha-card class={config?.full_height ? 'full-height' : ''}>
      <style dangerouslySetInnerHTML={{ __html: cssString }} />
      <div
        className="flex flex-col p-0 overflow-hidden w-full h-full min-h-0 min-w-0 flex-1"
        style={{ flex: '1 1 0', minHeight: 200, minWidth: 0, position: 'relative' }}
      >
        {/* Grid als Card-Hintergrund für den gesamten sichtbaren Kartenbereich */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, var(--secondary-text-color, rgba(0,0,0,0.2)) 1px, transparent 1px)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0',
          }}
        />
        <FilterTabs
          config={config}
          hass={hass}
          allTabIds={allTabIds}
          categoryLabels={categoryLabels}
          selectedTabs={selectedTabs}
          onSelectTab={onSelectTab}
          host={host}
        />
        <PlanImageWithOverlay
          config={config}
          flattenedEntities={flattenedEntities}
          hass={hass}
          host={host}
          allTabIds={allTabIds}
          selectedTabs={selectedTabs}
          showHeatmapOverlay={showHeatmapOverlay}
          imageAspect={imageAspect}
          imageLoaded={imageLoaded}
          imageError={imageError}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
        />
        {hasHeatmapZones && isTemperaturTabSelected && (
          <div
            style={{
              position: 'absolute',
              bottom: 52,
              right: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--ha-card-background)',
              border: '1px solid var(--divider-color)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              pointerEvents: 'auto',
            }}
          >
            <label style={{ fontSize: '0.8125rem', color: 'var(--secondary-text-color)', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={showHeatmapOverlay}
                onChange={(e) => setShowHeatmapOverlay((e.target as HTMLInputElement).checked)}
                style={{ margin: 0 }}
              />
              Heatmap
            </label>
          </div>
        )}
      </div>
    </ha-card>
  );
}
