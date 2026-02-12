import { handleAction, forwardHaptic } from 'custom-card-helpers';
import type { RoomPlanCardConfig } from '../lib/types';
import { getEntityDomain } from './utils';

export const HEATMAP_TAB = '__heatmap__';

interface FilterTabsProps {
  config: RoomPlanCardConfig;
  hass: { states?: Record<string, { state?: string }> } | null;
  activeTab: string | null;
  onSelectTab: (id: string | null) => void;
  host: HTMLElement;
}

export function FilterTabs(props: FilterTabsProps) {
  const { config, hass, activeTab, onSelectTab, host } = props;
  const entities = config?.entities ?? [];
  const domains = Array.from(new Set(entities.map((e) => getEntityDomain(e.entity)).filter(Boolean))).sort();
  const hasHeatmap = (config?.temperature_zones ?? []).length > 0;
  const alertEntities = config?.alert_entities ?? [];

  const tabIds: (string | null)[] = [null];
  if (hasHeatmap) tabIds.push(HEATMAP_TAB);
  tabIds.push(...domains);

  const showBar = domains.length > 0 || hasHeatmap || alertEntities.length > 0;
  const alertCount = hass?.states && alertEntities.length > 0
    ? alertEntities.filter((eid) => {
        const s = hass?.states?.[eid]?.state;
        return s === 'on' || s === 'triggered' || s === 'active';
      }).length
    : 0;

  const onAlertClick = () => {
    const action = config?.alert_badge_action ?? { action: 'more-info' as const };
    const entity = alertEntities[0] ?? '';
    handleAction(host, hass as import('custom-card-helpers').HomeAssistant, { entity, tap_action: action }, 'tap');
    forwardHaptic('light');
  };

  if (!showBar) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3 px-4 border-b border-[var(--divider-color)] bg-[var(--ha-card-background)]">
      <div className="flex flex-wrap items-center gap-2">
        {tabIds.map((id) => (
          <button
            key={id ?? 'all'}
            type="button"
            onClick={() => onSelectTab(id)}
            className={activeTab === id
              ? 'px-3.5 py-1.5 rounded-2xl text-sm font-medium bg-[var(--primary-color)] text-white border-none cursor-pointer'
              : 'px-3.5 py-1.5 rounded-2xl text-sm font-medium bg-[var(--secondary-background-color)] text-[var(--secondary-text-color)] border-none cursor-pointer hover:opacity-80'}
          >
            {id === null ? 'Alle' : id === HEATMAP_TAB ? 'Heatmap' : id}
          </button>
        ))}
      </div>
      {alertEntities.length > 0 && (
        <button
          type="button"
          onClick={onAlertClick}
          className={alertCount > 0
            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-medium bg-[var(--error-color)] text-white border-none cursor-pointer'
            : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-sm font-medium bg-[var(--secondary-background-color)] text-[var(--secondary-text-color)] border-none cursor-pointer'}
          title="Meldungen"
        >
          <ha-icon icon="mdi:bell-badge-outline" style={{ width: 20, height: 20 }} />
          <span className="min-w-[1.2em] text-center font-semibold">{alertCount}</span>
        </button>
      )}
    </div>
  );
}
