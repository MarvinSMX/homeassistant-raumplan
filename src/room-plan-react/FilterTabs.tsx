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
    <div
      className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0"
      style={{
        padding: '10px 16px 12px',
        background: 'var(--ha-card-background, var(--card-background-color, #1e1e1e))',
        borderBottom: '1px solid var(--divider-color, rgba(0, 0, 0, 0.12))',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {tabIds.map((id) => (
          <button
            key={id ?? 'all'}
            type="button"
            onClick={() => onSelectTab(id)}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 16,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s, color 0.2s',
              fontFamily: 'inherit',
              ...(activeTab === id
                ? { background: 'var(--primary-color, #03a9f4)', color: '#fff' }
                : {
                    background: 'var(--secondary-background-color, rgba(255, 255, 255, 0.05))',
                    color: 'var(--secondary-text-color, rgba(255, 255, 255, 0.7))',
                  }),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== id) {
                e.currentTarget.style.background = 'var(--secondary-background-color, rgba(255, 255, 255, 0.08))';
                e.currentTarget.style.color = 'var(--primary-text-color, rgba(255, 255, 255, 0.9))';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== id) {
                e.currentTarget.style.background = 'var(--secondary-background-color, rgba(255, 255, 255, 0.05))';
                e.currentTarget.style.color = 'var(--secondary-text-color, rgba(255, 255, 255, 0.7))';
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: 'none',
            borderRadius: 16,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            fontFamily: 'inherit',
            ...(alertCount > 0
              ? { background: 'var(--error-color, #db4437)', color: '#fff' }
              : {
                  background: 'var(--secondary-background-color, rgba(255, 255, 255, 0.05))',
                  color: 'var(--secondary-text-color, rgba(255, 255, 255, 0.7))',
                }),
          }}
          title="Meldungen"
          onMouseEnter={(e) => {
            if (alertCount === 0) {
              e.currentTarget.style.background = 'var(--secondary-background-color, rgba(255, 255, 255, 0.08))';
              e.currentTarget.style.color = 'var(--primary-text-color, rgba(255, 255, 255, 0.9))';
            } else {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (alertCount === 0) {
              e.currentTarget.style.background = 'var(--secondary-background-color, rgba(255, 255, 255, 0.05))';
              e.currentTarget.style.color = 'var(--secondary-text-color, rgba(255, 255, 255, 0.7))';
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
