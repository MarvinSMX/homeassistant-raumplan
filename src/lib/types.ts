import type { LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';
import type { ActionConfig } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'room-plan-editor': LovelaceCardEditor;
  }
}

export interface RoomPlanEntity {
  entity: string;
  x?: number;
  y?: number;
  scale?: number;
  color?: string;
  /** Hintergrund-Transparenz des Kreises (0–1), Standard 1 */
  background_opacity?: number;
  icon?: string;
  /** Wenn true: Wert/State der Entität statt Icon anzeigen */
  show_value?: boolean;
  /** Tap-Aktion (Klick) – default: more-info */
  tap_action?: ActionConfig;
  /** Hold-Aktion (langes Drücken) */
  hold_action?: ActionConfig;
  /** Doppelklick-Aktion */
  double_tap_action?: ActionConfig;
}

export interface RoomPlanCardConfig extends LovelaceCardConfig {
  type: string;
  image?: string;
  title?: string;
  rotation?: number;
  /** Standard tap_action für alle Entitäten */
  tap_action?: ActionConfig;
  /** Standard hold_action für alle Entitäten */
  hold_action?: ActionConfig;
  /** Standard double_tap_action für alle Entitäten */
  double_tap_action?: ActionConfig;
  /** Volle Höhe wie ha-floorplan */
  full_height?: boolean;
  /** Filter: nur Entitäten dieser Domains anzeigen (z.B. light, sensor). Leer = alle */
  entity_filter?: string[];
  entities?: RoomPlanEntity[];
}
