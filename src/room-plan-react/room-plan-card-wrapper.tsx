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
  const img = config?.image && typeof config.image === 'string'
    ? config.image
    : (config?.image as { location?: string })?.location ?? '';
  return {
    type: config?.type ?? 'custom:room-plan-card',
    image: img,
    entities: Array.isArray(config?.entities) ? config.entities : [],
    title: config?.title ?? '',
    rotation: Number(config?.rotation) ?? 0,
    full_height: config?.full_height ?? false,
    tap_action: config?.tap_action,
    hold_action: config?.hold_action,
    double_tap_action: config?.double_tap_action,
    entity_filter: Array.isArray(config?.entity_filter) ? config.entity_filter : undefined,
    temperature_zones: Array.isArray(config?.temperature_zones) ? config.temperature_zones : undefined,
    alert_entities: Array.isArray(config?.alert_entities) ? config.alert_entities : undefined,
    alert_badge_action: config?.alert_badge_action,
    image_dark: config?.image_dark,
    dark_mode_filter: config?.dark_mode_filter,
    dark_mode: config?.dark_mode,
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
    return this._config?.full_height ? 1 : 4;
  }

  getGridOptions() {
    return this._config?.full_height
      ? { rows: 1, columns: 1, min_rows: 1, min_columns: 1 }
      : { rows: 4, columns: 6, min_rows: 3, min_columns: 3 };
  }

  private _render() {
    if (this.closest?.('.element-preview')) {
      this.style.display = 'none';
      return;
    }
    if (!this._hass) return;

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
