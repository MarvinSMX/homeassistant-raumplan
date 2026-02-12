/**
 * Web-Component-Wrapper: kapselt die React/Preact-Card für Home Assistant.
 * - Shadow DOM für Styling-Isolation
 * - Preact render() (kein createRoot), Re-Render nur bei relevanten Änderungen (Performance)
 */
import { render } from 'preact/compat';
import { ReactDemoCard, type ReactDemoCardConfig } from './ReactDemoCard';

const CARD_TAG = 'react-demo-card';

(window as Window & { customCards?: Array<{ type: string; name: string; description: string; preview?: boolean }> }).customCards =
  (window as Window & { customCards?: unknown[] }).customCards ?? [];
(window as Window & { customCards: Array<{ type: string; name: string; description: string }> }).customCards.push({
  type: 'custom:' + CARD_TAG,
  name: 'React Demo Card',
  description: 'Beispiel-Card mit React/Preact in einer Web Component',
});

export class ReactDemoCardWrapper extends HTMLElement {
  private _config: ReactDemoCardConfig = { type: '' };
  private _hass: unknown = null;
  private _lastRenderedEntityState: string | null = null;
  private _lastRenderedEntityId: string = '';

  static getConfigElement() {
    return document.createElement('div');
  }

  static getStubConfig(): ReactDemoCardConfig {
    return {
      type: 'custom:' + CARD_TAG,
      title: 'React Demo',
      entity: 'sensor.date',
    };
  }

  setConfig(config: ReactDemoCardConfig) {
    this._config = config ?? { type: '' };
    this._lastRenderedEntityId = '';
    this._lastRenderedEntityState = null;
    if (this._hass) this._maybeRender();
  }

  set hass(hass: unknown) {
    this._hass = hass;
    this._maybeRender();
  }

  private _maybeRender() {
    const hass = this._hass as { states?: Record<string, { state?: string }> } | null;
    const entityId = this._config.entity ?? '';
    const currentState = entityId && hass?.states?.[entityId] ? hass.states[entityId].state ?? null : null;

    const shouldUpdate =
      !this.shadowRoot ||
      this._lastRenderedEntityId !== entityId ||
      this._lastRenderedEntityState !== currentState;
    if (!shouldUpdate) return;

    this._lastRenderedEntityId = entityId;
    this._lastRenderedEntityState = currentState;
    this._render();
  }

  private _render() {
    if (!this._hass) return;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    const container = this.shadowRoot!;
    render(
      <ReactDemoCard
        hass={this._hass as import('custom-card-helpers').HomeAssistant}
        config={this._config}
      />,
      container
    );
  }

  getCardSize() {
    return 2;
  }
}

customElements.define(CARD_TAG, ReactDemoCardWrapper);
