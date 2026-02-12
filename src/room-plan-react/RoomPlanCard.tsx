import { useState, useCallback } from 'preact/hooks';
import type { RoomPlanCardConfig } from '../lib/types';
import type { HomeAssistant } from 'custom-card-helpers';
import { FilterTabs } from './FilterTabs';
import { PlanImageWithOverlay } from './PlanImageWithOverlay';

interface RoomPlanCardProps {
  hass: HomeAssistant;
  config: RoomPlanCardConfig;
  host: HTMLElement;
  cssString: string;
}

export function RoomPlanCard({ hass, config, host, cssString }: RoomPlanCardProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [imageAspect, setImageAspect] = useState(16 / 9);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          host={host}
        />
        <PlanImageWithOverlay
          config={config}
          hass={hass}
          host={host}
          activeTab={activeTab}
          imageAspect={imageAspect}
          imageLoaded={imageLoaded}
          imageError={imageError}
          onImageLoad={onImageLoad}
          onImageError={onImageError}
        />
      </div>
    </ha-card>
  );
}
