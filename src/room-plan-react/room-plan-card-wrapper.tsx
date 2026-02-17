/**
 * Web-Component-Wrapper für den React/Tailwind-Raumplan.
 * Ersetzt die Lit-Card; der Editor bleibt Lit (room-plan-editor).
 */
import { render } from 'preact/compat';
import { RoomPlanCard } from './RoomPlanCard';
import type { RoomPlanCardConfig } from '../lib/types';

// Tailwind-Build wird vor Webpack ausgeführt; Webpack lädt diese Datei als String
import tailwindCss from './tailwind-built.css';

const CARD_TAG = 'room-plan-card';

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: 'custom:' + CARD_TAG,
  name: 'Interaktiver Raumplan',
  description: 'Raumplan als Bild mit Entitäten (React + Tailwind)',
  preview: false,
});

function normalizeConfig(config: RoomPlanCardConfig): RoomPlanCardConfig {
  /* Home Assistant kann die Konfiguration unter config.config übergeben; beide Varianten auswerten. */
  const c = (config as { config?: RoomPlanCardConfig }).config ?? config;
  const img = c?.image && typeof c.image === 'string'
    ? c.image
    : (c?.image as { location?: string })?.location ?? '';
  const rooms = Array.isArray(c?.rooms) ? c.rooms : undefined;
  const buildings = Array.isArray(c?.buildings) ? c.buildings : undefined;
  return {
    type: c?.type ?? config?.type ?? 'custom:room-plan-card',
    image: img,
    entities: Array.isArray(c?.entities) ? c.entities : [],
    rooms,
    buildings,
    title: c?.title ?? '',
    rotation: Number(c?.rotation) ?? 0,
    full_height: c?.full_height ?? false,
    tap_action: c?.tap_action,
    hold_action: c?.hold_action,
    double_tap_action: c?.double_tap_action,
    entity_filter: Array.isArray(c?.entity_filter) ? c.entity_filter : undefined,
    alert_entities: Array.isArray(c?.alert_entities) ? c.alert_entities : undefined,
    alert_badge_action: c?.alert_badge_action,
    categories: Array.isArray(c?.categories) ? c.categories : undefined,
    image_dark: c?.image_dark,
    dark_mode_filter: c?.dark_mode_filter,
    dark_mode: c?.dark_mode,
    plan_offset_x: Number(c?.plan_offset_x) || 0,
    plan_offset_y: Number(c?.plan_offset_y) || 0,
    plan_aspect_ratio: Number(c?.plan_aspect_ratio) > 0 ? c!.plan_aspect_ratio : undefined,
  };
}

export class RoomPlanCardWrapper extends HTMLElement {
  private _config: RoomPlanCardConfig = { type: '', image: '', entities: [] };
  private _hass: import('custom-card-helpers').HomeAssistant | null = null;

  static getConfigElement() {
    return document.createElement('room-plan-editor');
  }

  static getStubConfig(): Record<string, unknown> {
    return {
      image: '/local/raumplan.png',
      rotation: 0,
      entities: [
        { entity: 'light.example', x: 25, y: 30, scale: 1, color: '#ffc107' },
        { entity: 'sensor.example', x: 75, y: 40, scale: 1 },
      ],
    };
  }

  setConfig(config: RoomPlanCardConfig) {
    this._config = normalizeConfig(config ?? { type: '', image: '', entities: [] });
    this._render();
  }

  set hass(hass: import('custom-card-helpers').HomeAssistant) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    /* Größerer Wert = mehr Zeilenhöhe; full_height: 1 = eine Zeile (nimmt Rest), sonst mehr Platz anfordern */
    return this._config?.full_height ? 1 : 10;
  }

  getGridOptions() {
    /* Mehr Zeilen/Spalten erlauben, damit die Karte mit der Viewport-Größe mitwächst */
    return this._config?.full_height
      ? { rows: 1, columns: 1, min_rows: 1, min_columns: 1 }
      : { rows: 10, columns: 12, min_rows: 4, min_columns: 4 };
  }

  private _render() {
    if (this.closest?.('.element-preview')) {
      this.style.display = 'none';
      return;
    }
    if (!this._hass) return;

    /* Host soll Grid-Zelle voll ausfüllen und in Flex-Layouts mitwachsen */
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.height = '100%';
    this.style.minHeight = '0';
    this.style.flex = '1 1 0';
    this.style.boxSizing = 'border-box';

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    const cssString = typeof tailwindCss === 'string' ? tailwindCss : '';

    const root = this.shadowRoot!;
    render(
      <RoomPlanCard
        hass={this._hass}
        config={this._config}
        host={this}
        cssString={cssString}
      />,
      root
    );
  }
}

customElements.define(CARD_TAG, RoomPlanCardWrapper);
