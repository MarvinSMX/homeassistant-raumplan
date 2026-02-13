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
  /** Preset: temperature = Wert + Farbe; binary_sensor = State; window_contact = Linie zwischen 2 Punkten (nicht Badge) */
  preset?: 'default' | 'temperature' | 'binary_sensor' | 'window_contact';
  /** Temperatur: Raumgrenze in %. Fensterkontakt: Linie von (x1,y1) nach (x2,y2) in %. */
  room_boundary?: { x1: number; y1: number; x2: number; y2: number };
  /** Nur Fensterkontakt: Dicke der Linie (viewBox-Einheiten, z. B. 0.5–2). */
  line_thickness?: number;
  /** Nur Fensterkontakt: Farbe wenn offen (Standard Rot). */
  line_color_open?: string;
  /** Nur Fensterkontakt: Farbe wenn zu (Standard Grau). */
  line_color_closed?: string;
  /** Tap-Aktion (Klick) – default: more-info */
  tap_action?: ActionConfig;
  /** Hold-Aktion (langes Drücken) */
  hold_action?: ActionConfig;
  /** Doppelklick-Aktion */
  double_tap_action?: ActionConfig;
}

/** Temperatur-Heatmap: Rechteck aus 2 Punkten (x1,y1) bis (x2,y2) in %, gefärbt nach entity-Wert */
export interface HeatmapZone {
  entity: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Deckkraft der Fläche (0–1), Standard 0.4 */
  opacity?: number;
}

export interface RoomPlanCardConfig extends LovelaceCardConfig {
  type: string;
  image?: string;
  /** Optional: anderes Bild im Dark Mode (z. B. invertierte SVG-URL) */
  image_dark?: string;
  /** Optional: CSS-Filter im Dark Mode (z. B. brightness(0.9) oder invert(1)) */
  dark_mode_filter?: string;
  /** Optional: Dark Mode erzwingen (true) oder Light (false); sonst System/Theme */
  dark_mode?: boolean;
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
  /** Temperatur-Heatmap: Flächen aus 2 Punkten, Farbe nach Sensor-Wert */
  temperature_zones?: HeatmapZone[];
  /** Entitäten für Meldungs-Badge (z. B. Rauchmelder) – Badge zeigt Anzahl aktiver Meldungen, rechts in der Tab-Leiste */
  alert_entities?: string[];
  /** Aktion beim Klick auf das Meldungs-Badge (optional) */
  alert_badge_action?: ActionConfig;
  entities?: RoomPlanEntity[];
}
