import { useState, useCallback, useMemo, useEffect } from 'preact/hooks';
import type { RoomPlanCardConfig } from '../lib/types';
import type { HomeAssistant } from 'custom-card-helpers';
import { FilterTabs, HEATMAP_TAB } from './FilterTabs';
import { PlanImageWithOverlay } from './PlanImageWithOverlay';
import { getEntityDomain } from './utils';

interface RoomPlanCardProps {
  hass: HomeAssistant;
  config: RoomPlanCardConfig;
  host: HTMLElement;
  cssString: string;
}

export function RoomPlanCard({ hass, config, host, cssString }: RoomPlanCardProps) {
  const allTabIds = useMemo(() => {
    const entities = config?.entities ?? [];
    const domains = Array.from(new Set(entities.map((e) => getEntityDomain(e.entity)).filter(Boolean))).sort();
    const hasHeatmap = (config?.temperature_zones ?? []).length > 0;
    return [...(hasHeatmap ? [HEATMAP_TAB] : []), ...domains];
  }, [config?.entities, config?.temperature_zones]);

  const [selectedTabs, setSelectedTabs] = useState<Set<string>>(new Set());
  useEffect(() => {
    setSelectedTabs(new Set(allTabIds));
  }, [allTabIds]);

  const onSelectTab = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedTabs(new Set(allTabIds));
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
  const hasHeatmapZones = (config?.temperature_zones ?? []).length > 0;
  const isTemperaturTabSelected = selectedTabs.has(HEATMAP_TAB);

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
        style={{ flex: '1 1 0', minHeight: 200, minWidth: 0 }}
      >
        <FilterTabs
          config={config}
          hass={hass}
          allTabIds={allTabIds}
          selectedTabs={selectedTabs}
          onSelectTab={onSelectTab}
          host={host}
        />
        <PlanImageWithOverlay
          config={config}
          hass={hass}
          host={host}
          selectedTabs={selectedTabs}
          showHeatmapOverlay={showHeatmapOverlay}
          imageAspect={imageAspect}
          imageLoaded={imageLoaded}
          imageError={imageError}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
        />
        {hasHeatmapZones && isTemperaturTabSelected && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '8px 12px 10px', gap: 8, borderTop: '1px solid var(--divider-color)', background: 'var(--ha-card-background)' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--secondary-text-color)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={showHeatmapOverlay}
                onChange={(e) => setShowHeatmapOverlay((e.target as HTMLInputElement).checked)}
                style={{ marginRight: 6, verticalAlign: 'middle' }}
              />
              Heatmap
            </label>
          </div>
        )}
      </div>
    </ha-card>
  );
}
