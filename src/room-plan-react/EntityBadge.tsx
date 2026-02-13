import { handleAction, hasAction } from 'custom-card-helpers';
import type { HomeAssistant } from 'custom-card-helpers';
import type { RoomPlanEntity } from '../lib/types';
import { getEntityIcon, getFriendlyName, getStateDisplay } from '../lib/utils';
import { temperatureColor } from './utils';
import { MdiIcon } from './MdiIcon';

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
  } else if (preset === 'window_contact') {
    displayIcon = ent.icon || 'mdi:window-open';
    const isOpen = ['on', 'open', 'opening'].includes(String(state).toLowerCase());
    iconColorOverride = isOpen ? 'var(--error-color, #f44336)' : 'var(--primary-text-color)';
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

  /* Responsive Einheiten: Basiswerte mit scale, clamp für Viewport-Anpassung */
  const r = (basePx: number, minPx = 4, maxPx = 32) =>
    `calc(${scale} * clamp(${minPx}px, ${basePx}px + 1vw, ${maxPx}px))`;
  const rFont = () => `calc(${scale} * clamp(0.7rem, 0.8125rem + 0.3vw, 0.9375rem))`;

  /* Icon: Größe in em → skaliert automatisch mit Badge (fontSize/Chip-Größe) */
  const iconStyle = { width: '1.2em', height: '1.2em', minWidth: '1.2em', minHeight: '1.2em' };
  const iconStyleIconOnly = { width: '1.4em', height: '1.4em', minWidth: '1.4em', minHeight: '1.4em' };

  /* Chip: immer weißer Hintergrund (Badge-Style), nur Icons in Farbe; Text standardmäßig dunkel */
  const chipStyle: Record<string, string | number> = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: r(6, 4, 10),
    padding: `${r(4, 4, 8)} ${r(10, 8, 14)}`,
    minHeight: r(28, 24, 36),
    borderRadius: r(16, 12, 20),
    border: '1px solid var(--divider-color)',
    background: '#fff',
    color: 'var(--primary-text-color, #212121)',
    fontSize: rFont(),
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    transition: 'box-shadow 0.2s',
    zIndex: 2,
    maxWidth: 'min(90vw, 180px)',
    boxSizing: 'border-box',
  };

  const iconColor = iconColorOverride ?? accentColor ?? (isOn ? 'var(--state-icon-active-color, var(--state-icon-on-color))' : 'var(--primary-text-color)');

  /* Temperatur-Preset: nur Text mit „°C“ in Temperaturfarbe, kein Icon */
  const tempNum = preset === 'temperature' && typeof state === 'string' ? parseFloat(state.replace(',', '.')) : NaN;
  const tempDisplay = Number.isFinite(tempNum) ? `${tempNum} °C` : stateDisplay;
  const showIcon = preset !== 'temperature';
  const textColor = preset === 'temperature' && accentColor ? accentColor : undefined;
  const isIconOnly = preset === 'window_contact';

  return (
    <div
      className="entity-badge-chip"
      style={{
        ...chipStyle,
        ...(isIconOnly
          ? {
              background: '#fff',
              padding: `${r(10, 8, 14)} ${r(18, 14, 24)}`,
              minWidth: r(48, 40, 56),
              minHeight: r(32, 28, 40),
              borderRadius: 9999,
              position: 'relative',
            }
          : {}),
      }}
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
      {showIcon && (isIconOnly ? (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
            <MdiIcon icon={displayIcon} color={iconColor} style={iconStyleIconOnly} />
          </span>
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', color: iconColor }}>
          <MdiIcon icon={displayIcon} color={iconColor} style={iconStyle} />
        </span>
      ))}
      {!isIconOnly && (
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
      )}
    </div>
  );
}
