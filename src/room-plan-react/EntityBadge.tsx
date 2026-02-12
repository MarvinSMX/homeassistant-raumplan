import { handleAction, hasAction } from 'custom-card-helpers';
import type { HomeAssistant } from 'custom-card-helpers';
import type { RoomPlanEntity } from '../lib/types';
import { getEntityIcon, getFriendlyName, getStateDisplay } from '../lib/utils';
import { hexToRgba, temperatureColor } from './utils';

interface EntityBadgeProps {
  ent: RoomPlanEntity;
  hass: HomeAssistant;
  host: HTMLElement;
  tapAction: import('custom-card-helpers').ActionConfig;
  holdAction?: import('custom-card-helpers').ActionConfig;
  doubleTapAction?: import('custom-card-helpers').ActionConfig;
}

export function EntityBadge(props: EntityBadgeProps) {
  const { ent, hass, host, tapAction, holdAction, doubleTapAction } = props;
  const x = Math.min(100, Math.max(0, Number(ent.x) ?? 50));
  const y = Math.min(100, Math.max(0, Number(ent.y) ?? 50));
  const scale = Math.min(2, Math.max(0.3, Number(ent.scale) ?? 1));
  const isOn = hass?.states?.[ent.entity]?.state === 'on';
  const icon = ent.icon || getEntityIcon(hass, ent.entity);
  const stateDisplay = getStateDisplay(hass, ent.entity);
  const title = `${getFriendlyName(hass, ent.entity)}: ${stateDisplay}`;
  const opacity = Math.min(1, Math.max(0, Number(ent.background_opacity) ?? 1));

  const preset = ent.preset ?? 'default';
  let bgColor: string;
  let showValue = !!ent.show_value;

  if (preset === 'temperature') {
    showValue = true;
    const state = hass?.states?.[ent.entity]?.state;
    const num = typeof state === 'string' ? parseFloat(state.replace(',', '.')) : Number(state);
    const temp = Number.isFinite(num) ? num : 20;
    bgColor = hexToRgba(temperatureColor(temp), opacity);
  } else {
    bgColor = ent.color ? hexToRgba(ent.color, opacity) : `rgba(45, 45, 45, ${opacity})`;
  }

  const actionConfig = {
    entity: ent.entity,
    tap_action: tapAction,
    hold_action: holdAction,
    double_tap_action: doubleTapAction,
  };

  const onTap = () => handleAction(host, hass, actionConfig, 'tap');
  const onHold = () => hasAction(holdAction) && handleAction(host, hass, actionConfig, 'hold');
  const onDbl = () => hasAction(doubleTapAction) && handleAction(host, hass, actionConfig, 'double_tap');

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full cursor-pointer min-w-5 min-h-5 z-[2]"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `calc(clamp(28px, 8vw, 48px) * ${scale})`,
        height: `calc(clamp(28px, 8vw, 48px) * ${scale})`,
        background: bgColor,
        color: isOn ? 'var(--state-icon-on-color, #ffc107)' : 'var(--primary-text-color, #e1e1e1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
      }}
      title={title}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onDblClick={onDbl}
      onContextMenu={(e) => { e.preventDefault(); onHold(); }}
    >
      <div className="w-full h-full flex items-center justify-center rounded-full overflow-hidden p-0.5">
        {showValue ? (
          <span className="text-center font-medium text-xs leading-tight truncate max-w-full">
            {stateDisplay}
          </span>
        ) : (
          <ha-icon icon={icon} />
        )}
      </div>
    </div>
  );
}
