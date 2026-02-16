import { handleAction, forwardHaptic } from 'custom-card-helpers';
import type { RoomPlanCardConfig } from '../lib/types';

export const HEATMAP_TAB = '__heatmap__';

/** Anzeigenamen der Preset-/Filter-Tabs. */
const PRESET_LABELS: Record<string, string> = {
  [HEATMAP_TAB]: 'Temperatur',
  default: 'Standard',
  temperature: 'Temperatur',
  binary_sensor: 'Binary Sensor',
  window_contact: 'Fensterkontakt',
  sliding_door: 'Schiebetür',
  smoke_detector: 'Rauchmelder',
};

interface FilterTabsProps {
  config: RoomPlanCardConfig;
  hass: { states?: Record<string, { state?: string }> } | null;
  allTabIds: string[];
  selectedTabs: Set<string>;
  onSelectTab: (id: string | null) => void;
  host: HTMLElement;
}

export function FilterTabs(props: FilterTabsProps) {
  const { config, hass, allTabIds, selectedTabs, onSelectTab, host } = props;
  const alertEntities = config?.alert_entities ?? [];

  const tabIds: (string | null)[] = [null, ...allTabIds];
  const allSelected = allTabIds.length > 0 && selectedTabs.size === allTabIds.length;

  const showBar = allTabIds.length > 0 || alertEntities.length > 0;
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

  /* Tab-Styles mit sichtbaren Fallbacks (Active / Inactive / Hover) */
  const tabBarStyle = {
    padding: '10px 16px 12px',
    background: 'var(--ha-card-background)',
    borderBottom: '1px solid var(--divider-color)',
  };
  const tabActiveStyle = {
    background: 'var(--primary-color, #03a9f4)',
    color: '#fff',
  };
  const tabInactiveBg = 'var(--filter-tab-inactive-bg)';
  const tabInactiveStyle = {
    background: tabInactiveBg,
    color: 'var(--filter-tab-inactive-color)',
  };
  const tabInactiveHoverBg = 'var(--filter-tab-inactive-hover-bg)';
  const tabInactiveHoverFg = 'var(--filter-tab-inactive-hover-color)';

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0 filter-tabs-bar"
      style={tabBarStyle}
    >
      <div className="flex flex-wrap items-center gap-2">
        {tabIds.map((id) => {
          const isActive = id === null ? allSelected : selectedTabs.has(id);
          return (
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
                ...(isActive ? tabActiveStyle : tabInactiveStyle),
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = tabInactiveHoverBg;
                  e.currentTarget.style.color = tabInactiveHoverFg;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = tabInactiveBg;
                  e.currentTarget.style.color = tabInactiveStyle.color;
                }
              }}
            >
              {id === null ? 'Alle' : (PRESET_LABELS[id] ?? id)}
            </button>
          );
        })}
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
              e.currentTarget.style.background = tabInactiveBg;
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
