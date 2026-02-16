import { useRef, useEffect } from 'preact/hooks';
import { handleAction, hasAction } from 'custom-card-helpers';
import type { HomeAssistant } from 'custom-card-helpers';
import type { RoomPlanEntity, RoomBoundaryItem } from '../lib/types';
import { getEntityIcon, getFriendlyName, getStateDisplay, getEntityBoundaries, getEntityCoord, getTemperatureFromEntity } from '../lib/utils';
import { temperatureColor } from './utils';
import { MdiIcon } from './MdiIcon';
import { gsap } from 'gsap';

interface EntityBadgeProps {
  ent: RoomPlanEntity;
  hass: HomeAssistant;
  host: HTMLElement;
  tapAction: import('custom-card-helpers').ActionConfig;
  holdAction?: import('custom-card-helpers').ActionConfig;
  doubleTapAction?: import('custom-card-helpers').ActionConfig;
  /** Anzeige-Position in Bild-% (0–100). Wenn gesetzt, wird sie statt ent.x/ent.y verwendet (gleiches Koordinatensystem wie Plan). */
  displayPosition?: { x: number; y: number };
  /** Temperatur + room_boundaries: Start der Abdunkel-Animation (Hover/Press), mehrere Zonen möglich. entityId für Heatmap-Ausblendung. */
  onRoomPressStart?: (entityId: string, boundaries: RoomBoundaryItem[]) => void;
  /** Temperatur: Ende Hover/Press → Abdunkelung ausblenden. */
  onRoomPressEnd?: () => void;
}

function toNum(val: unknown, fallback: number): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

/** Icon und Farbe für Klima-Modus (heat, cool, auto, off, …). */
function climateModeIconAndColor(mode: string): { icon: string; color: string } {
  const m = mode.toLowerCase();
  if (m === 'heat' || m === 'heating') return { icon: 'mdi:fire', color: '#ff9800' };
  if (m === 'cool' || m === 'cooling') return { icon: 'mdi:snowflake', color: '#2196f3' };
  if (m === 'auto' || m === 'heat_cool') return { icon: 'mdi:autorenew', color: '#009688' };
  if (m === 'dry') return { icon: 'mdi:water-percent', color: '#00bcd4' };
  if (m === 'fan_only' || m === 'fan') return { icon: 'mdi:fan', color: '#607d8b' };
  if (m === 'off' || m === 'idle' || m === 'unknown') return { icon: 'mdi:power', color: 'var(--secondary-text-color, #9e9e9e)' };
  return { icon: 'mdi:thermostat', color: 'var(--primary-text-color, #212121)' };
}

export function EntityBadge(props: EntityBadgeProps) {
  const { ent, hass, host, tapAction, holdAction, doubleTapAction, displayPosition, onRoomPressStart, onRoomPressEnd } = props;
  const x = displayPosition
    ? Math.min(100, Math.max(0, displayPosition.x))
    : Math.min(100, Math.max(0, getEntityCoord(ent, 'x') ?? toNum(ent.x, 50)));
  const y = displayPosition
    ? Math.min(100, Math.max(0, displayPosition.y))
    : Math.min(100, Math.max(0, getEntityCoord(ent, 'y') ?? toNum(ent.y, 50)));
  const scale = Math.min(2, Math.max(0.3, toNum(ent.scale, 1)));
  const isOn = hass?.states?.[ent.entity]?.state === 'on';
  const icon = ent.icon || getEntityIcon(hass, ent.entity);
  const stateDisplay = getStateDisplay(hass, ent.entity);
  const friendlyName = getFriendlyName(hass, ent.entity);
  const title = `${friendlyName}: ${stateDisplay}`;
  const opacity = Math.min(1, Math.max(0, toNum(ent.background_opacity, 1)));

  const preset = ent.preset ?? 'default';
  const state = hass?.states?.[ent.entity]?.state ?? '';
  let showValue = !!ent.show_value;
  let accentColor: string | undefined;
  let temperatureValue: number | undefined;
  let displayIcon = ent.icon || getEntityIcon(hass, ent.entity);
  let iconColorOverride: string | undefined;

  let climateModeIcon: string | undefined;
  let climateModeColor: string | undefined;
  if (preset === 'temperature') {
    showValue = true;
    temperatureValue = getTemperatureFromEntity(hass, ent.entity, ent.temperature_attribute);
    accentColor = temperatureColor(temperatureValue);
    if (ent.entity.startsWith('climate.')) {
      const { icon, color } = climateModeIconAndColor(state);
      climateModeIcon = icon;
      climateModeColor = color;
    }
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
  } else if (preset === 'smoke_detector') {
    displayIcon = ent.icon || 'mdi:smoke-detector';
    const isAlert = ['triggered', 'smoke', 'alarm', 'sabotage', 'tampered', 'on'].includes(String(state).toLowerCase());
    if (isAlert) {
      iconColorOverride = 'var(--error-color, #db4437)';
    }
  } else if (preset === 'sliding_door') {
    displayIcon = ent.icon || 'mdi:door-sliding';
    const isOpen = ['on', 'open', 'opening'].includes(String(state).toLowerCase());
    iconColorOverride = isOpen ? 'var(--state-icon-active-color, #4caf50)' : 'var(--primary-text-color)';
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
  const boundaries = getEntityBoundaries(ent);
  /* Parent übergibt onRoomPressStart nur bei Temperatur + Raum-Boundary; dann Hover/Press auslösen (unabhängig von ent.room_boundaries). */
  const onPointerDown = () => {
    if (ent.preset === 'temperature' && onRoomPressStart) onRoomPressStart(ent.entity, boundaries);
  };
  const onPointerUp = () => {
    if (ent.preset === 'temperature' && onRoomPressEnd) onRoomPressEnd();
  };
  const handleRoomHoverStart = () => {
    if (ent.preset === 'temperature' && onRoomPressStart) onRoomPressStart(ent.entity, boundaries);
  };
  const handleRoomHoverEnd = () => {
    if (ent.preset === 'temperature' && onRoomPressEnd) onRoomPressEnd();
  };
  const onHold = () => hasAction(holdAction) && handleAction(host, hass, actionConfig, 'hold');
  const onDbl = () => hasAction(doubleTapAction) && handleAction(host, hass, actionConfig, 'double_tap');

  /* Fully responsive: eine Basis (fontSize) mit scale + viewport, Rest in em → nichts wird geclippt */
  const baseFontSize = `calc(${scale} * clamp(0.7rem, 0.8125rem + 0.3vw, 0.9375rem))`;

  const iconSizeEm = 1.15;
  const iconSizeIconOnlyEm = 1.35;

  /* Chip: Mindestgröße in px, damit er bei font-size:0 im Parent nicht unsichtbar wird; sonst em für Skalierung */
  const chipStyle: Record<string, string | number> = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4em',
    padding: '0.35em 0.75em',
    minHeight: 'max(2.25em, 28px)',
    minWidth: 'max(2em, 24px)',
    borderRadius: '1em',
    border: '1px solid var(--divider-color)',
    background: '#fff',
    color: 'var(--primary-text-color, #212121)',
    fontSize: baseFontSize,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    transition: 'box-shadow 0.2s',
    maxWidth: 'min(90vw, 22em)',
    boxSizing: 'border-box',
    visibility: 'visible',
    opacity: 1,
  };

  const iconColor = ent.color ?? iconColorOverride ?? accentColor ?? (isOn ? 'var(--state-icon-active-color, var(--state-icon-on-color))' : 'var(--primary-text-color)');

  /* Temperatur-Preset: optional Modus-Icon (Klima) links, dann Text „°C“ in Temperaturfarbe */
  const tempDisplay = preset === 'temperature' && temperatureValue != null ? `${temperatureValue} °C` : stateDisplay;
  const showIcon = preset !== 'temperature';
  const showClimateModeIcon = preset === 'temperature' && climateModeIcon != null;
  const textColor = preset === 'temperature' && accentColor ? accentColor : undefined;
  const isIconOnly =
    preset === 'window_contact' ||
    preset === 'smoke_detector' ||
    preset === 'sliding_door' ||
    ent.show_name === false;
  const isSmokeAlert =
    preset === 'smoke_detector' &&
    ['triggered', 'smoke', 'alarm', 'sabotage', 'tampered', 'on'].includes(String(state).toLowerCase());

  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chipRef.current;
    if (!el || !isSmokeAlert) {
      if (el) gsap.set(el, { clearProps: 'boxShadow,borderColor' });
      return;
    }
    const tween = gsap.fromTo(
      el,
      {
        boxShadow: '0 0 0 0 rgba(219, 68, 55, 0.6)',
        borderColor: 'var(--error-color, #db4437)',
      },
      {
        boxShadow: '0 0 0 8px rgba(219, 68, 55, 0)',
        borderColor: 'rgba(219, 68, 55, 0.5)',
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
      }
    );
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: 'boxShadow,borderColor' });
    };
  }, [isSmokeAlert]);

  return (
    <div
      ref={chipRef}
      className="entity-badge-chip"
      style={{
        ...chipStyle,
        background: '#fff',
        ...(isIconOnly
          ? {
              padding: '0.5em 0.85em',
              minWidth: '2.75em',
              minHeight: '2.75em',
              borderRadius: 9999,
            }
          : {}),
      }}
      title={title}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        onPointerUp();
        handleRoomHoverEnd();
      }}
      onPointerEnter={() => handleRoomHoverStart()}
      onDblClick={onDbl}
      onContextMenu={(e) => { e.preventDefault(); onHold(); }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
        handleRoomHoverStart();
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        handleRoomHoverEnd();
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
            <MdiIcon icon={displayIcon} color={iconColor} style={{ width: `${iconSizeIconOnlyEm}em`, height: `${iconSizeIconOnlyEm}em`, minWidth: `${iconSizeIconOnlyEm}em`, minHeight: `${iconSizeIconOnlyEm}em` }} />
          </span>
        </span>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', color: iconColor }}>
          <MdiIcon icon={displayIcon} color={iconColor} style={{ width: `${iconSizeEm}em`, height: `${iconSizeEm}em`, minWidth: `${iconSizeEm}em`, minHeight: `${iconSizeEm}em` }} />
        </span>
      ))}
      {!isIconOnly && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            ...(textColor ? { color: textColor } : {}),
          }}
        >
          {showClimateModeIcon && climateModeIcon != null && climateModeColor != null && (
            <span style={{ display: 'inline-flex', flexShrink: 0, color: climateModeColor }} title={state}>
              <MdiIcon icon={climateModeIcon} color={climateModeColor} style={{ width: `${iconSizeEm}em`, height: `${iconSizeEm}em`, minWidth: `${iconSizeEm}em`, minHeight: `${iconSizeEm}em` }} />
            </span>
          )}
          {preset === 'temperature' ? tempDisplay : (showValue ? stateDisplay : friendlyName)}
        </span>
      )}
    </div>
  );
}
