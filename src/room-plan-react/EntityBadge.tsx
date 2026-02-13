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
  /** Bei Temperatur + room_boundary: wird vor der Tap-Aktion aufgerufen für Press-Effekt (Raum abdunkeln). */
  onRoomPress?: (boundary: { x1: number; y1: number; x2: number; y2: number }) => void;
}

export function EntityBadge(props: EntityBadgeProps) {
  const { ent, hass, host, tapAction, holdAction, doubleTapAction, onRoomPress } = props;
  const x = Math.min(100, Math.max(0, Number(ent.x) ?? 50));
  const y = Math.min(100, Math.max(0, Number(ent.y) ?? 50));
  const scale = Math.min(2, Math.max(0.3, Number(ent.scale) ?? 1));
  const isOn = hass?.states?.[ent.entity]?.state === 'on';
  const icon = ent.icon || getEntityIcon(hass, ent.entity);
  const stateDisplay = getStateDisplay(hass, ent.entity);
  const friendlyName = getFriendlyName(hass, ent.entity);
  const title = `${friendlyName}: ${stateDisplay}`;
  const opacity = Math.min(1, Math.max(0, Number(ent.background_opacity) ?? 1));

  const preset = ent.preset ?? 'default';
  const state = hass?.states?.[ent.entity]?.state ?? '';
  let showValue = !!ent.show_value;
  let accentColor: string | undefined;
  let displayIcon = ent.icon || getEntityIcon(hass, ent.entity);
  let iconColorOverride: string | undefined;

  if (preset === 'temperature') {
    showValue = true;
    const num = typeof state === 'string' ? parseFloat(state.replace(',', '.')) : Number(state);
    const temp = Number.isFinite(num) ? num : 20;
    accentColor = temperatureColor(temp);
  } else if (preset === 'binary_sensor') {
    showValue = true;
    const active = ['on', 'open', 'detected', 'home', 'present', 'opening'].includes(String(state).toLowerCase());
    if (active) {
      accentColor = 'var(--state-icon-active-color, var(--state-icon-on-color, #4caf50))';
      displayIcon = 'mdi:circle';
      iconColorOverride = accentColor;
    } else {
      accentColor = undefined;
      displayIcon = 'mdi:circle-outline';
      iconColorOverride = 'var(--secondary-text-color)';
    }
  } else if (ent.color) {
    accentColor = ent.color;
  } else if (isOn) {
    accentColor = 'var(--state-icon-active-color, var(--state-icon-on-color, #ffc107))';
  }

  const actionConfig = {
    entity: ent.entity,
    tap_action: tapAction,
    hold_action: holdAction,
    double_tap_action: doubleTapAction,
  };

  const onTap = () => handleAction(host, hass, actionConfig, 'tap');
  const onPointerDown = () => {
    if (ent.preset === 'temperature' && ent.room_boundary && onRoomPress) {
      onRoomPress(ent.room_boundary);
    }
  };
  const onHold = () => hasAction(holdAction) && handleAction(host, hass, actionConfig, 'hold');
  const onDbl = () => hasAction(doubleTapAction) && handleAction(host, hass, actionConfig, 'double_tap');

  /* Chip: immer weißer Hintergrund (nicht transparent), nur Icons in Farbe; Text standardmäßig dunkel */
  const chipStyle: Record<string, string | number> = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: `calc(4px * ${scale}) calc(10px * ${scale})`,
    minHeight: `calc(28px * ${scale})`,
    borderRadius: 16,
    border: '1px solid var(--divider-color)',
    background: '#fff',
    color: 'var(--primary-text-color, #212121)',
    fontSize: `calc(clamp(0.7rem, 2vw, 0.8125rem) * ${scale})`,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    transition: 'box-shadow 0.2s',
    zIndex: 2,
    maxWidth: 'min(90vw, 160px)',
    boxSizing: 'border-box',
  };

  const iconColor = iconColorOverride ?? accentColor ?? (isOn ? 'var(--state-icon-active-color, var(--state-icon-on-color))' : 'var(--primary-text-color)');

  /* Temperatur-Preset: nur Text mit „°C“ in Temperaturfarbe, kein Icon */
  const tempNum = preset === 'temperature' && typeof state === 'string' ? parseFloat(state.replace(',', '.')) : NaN;
  const tempDisplay = Number.isFinite(tempNum) ? `${tempNum} °C` : stateDisplay;
  const showIcon = preset !== 'temperature';
  const textColor = preset === 'temperature' && accentColor ? accentColor : undefined;

  return (
    <div
      className="entity-badge-chip"
      style={chipStyle}
      title={title}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onPointerDown={onPointerDown}
      onDblClick={onDbl}
      onContextMenu={(e) => { e.preventDefault(); onHold(); }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
      }}
    >
      {showIcon && (
        <ha-icon
          icon={displayIcon}
          style={{
            width: `calc(18px * ${scale})`,
            height: `calc(18px * ${scale})`,
            flexShrink: 0,
            color: iconColor,
          }}
        />
      )}
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          ...(textColor ? { color: textColor } : {}),
        }}
      >
        {preset === 'temperature' ? tempDisplay : (showValue ? stateDisplay : friendlyName)}
      </span>
    </div>
  );
}
