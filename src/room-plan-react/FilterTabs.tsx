import { handleAction, forwardHaptic } from 'custom-card-helpers';
import type { RoomPlanCardConfig } from '../lib/types';

interface FilterTabsProps {
  config: RoomPlanCardConfig;
  hass: { states?: Record<string, { state?: string }> } | null;
  allTabIds: string[];
  /** Anzeigename pro Tab-ID (aus Kategorien). */
  categoryLabels: Record<string, string>;
  selectedTabs: Set<string>;
  onSelectTab: (id: string | null) => void;
  host: HTMLElement;
}

export function FilterTabs(props: FilterTabsProps) {
  const { config, hass, allTabIds, categoryLabels, selectedTabs, onSelectTab, host } = props;
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

  /* Tab-Styles: feste Höhe, damit der Plan darunter nicht springt */
  const tabBarStyle: Record<string, string | number> = {
    padding: '0 16px',
    height: 48,
    minHeight: 48,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    background: 'var(--ha-card-background)',
    borderBottom: '1px solid var(--divider-color)',
    overflow: 'hidden',
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
    <div className="filter-tabs-bar" style={tabBarStyle}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {tabIds.map((id) => {
          const isActive = id === null ? allSelected : selectedTabs.has(id);
          return (
            <button
              key={id ?? 'all'}
              type="button"
              onClick={() => onSelectTab(id)}
              className="filter-tab"
              style={{
                flexShrink: 0,
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
              {id === null ? 'Alle' : (categoryLabels[id] ?? id)}
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
            flexShrink: 0,
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
