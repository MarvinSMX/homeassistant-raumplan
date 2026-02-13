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

  /* Theme-aware: Light/Dark nutzen HA-Variablen; Fallbacks für beide Modi */
  const tabBarStyle = {
    padding: '10px 16px 12px',
    background: 'var(--ha-card-background)',
    borderBottom: '1px solid var(--divider-color)',
  };
  const tabActiveStyle = {
    background: 'var(--primary-color)',
    color: '#fff',
  };
  const tabInactiveStyle = {
    background: 'var(--secondary-background-color)',
    color: 'var(--secondary-text-color)',
  };
  const tabInactiveHoverBg = 'var(--secondary-background-color)';
  const tabInactiveHoverFg = 'var(--primary-text-color)';

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0 filter-tabs-bar"
      style={tabBarStyle}
    >
      <div className="flex flex-wrap items-center gap-2">
        {tabIds.map((id) => (
          <button
            key={id ?? 'all'}
            type="button"
            onClick={() => onSelectTab(id)}
            className="filter-tab"
            style={{
              padding: '6px 14px',
              border: '1px solid var(--divider-color)',
              borderRadius: 16,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
              fontFamily: 'inherit',
              ...(activeTab === id ? tabActiveStyle : tabInactiveStyle),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== id) {
                e.currentTarget.style.background = tabInactiveHoverBg;
                e.currentTarget.style.color = tabInactiveHoverFg;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== id) {
                e.currentTarget.style.background = tabInactiveStyle.background;
                e.currentTarget.style.color = tabInactiveStyle.color;
              }
            }}
          >
            {id === null ? 'Alle' : id === HEATMAP_TAB ? 'Heatmap' : id}
          </button>
        ))}
      </div>
      {alertEntities.length > 0 && (
        <button
          type="button"
          onClick={onAlertClick}
          className="filter-tab filter-tab-alert"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: '1px solid var(--divider-color)',
            borderRadius: 16,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity 0.2s, background-color 0.2s, color 0.2s',
            fontFamily: 'inherit',
            ...(alertCount > 0
              ? { background: 'var(--error-color)', color: '#fff' }
              : tabInactiveStyle),
          }}
          title="Meldungen"
          onMouseEnter={(e) => {
            if (alertCount === 0) {
              e.currentTarget.style.background = tabInactiveHoverBg;
              e.currentTarget.style.color = tabInactiveHoverFg;
            } else {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (alertCount === 0) {
              e.currentTarget.style.background = tabInactiveStyle.background;
              e.currentTarget.style.color = tabInactiveStyle.color;
            } else {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          <ha-icon icon="mdi:bell-badge-outline" style={{ width: 20, height: 20 }} />
          <span style={{ minWidth: '1.2em', textAlign: 'center', fontWeight: 600 }}>{alertCount}</span>
        </button>
      )}
    </div>
  );
}
