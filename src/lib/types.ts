import type { LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';
import type { ActionConfig } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'room-plan-editor': LovelaceCardEditor;
  }
}

export interface RoomPlanEntity {
  entity: string;
  /** X-Position in % des gesamten Plans (0–100), nicht raum-relativ. */
  x?: number;
  /** Y-Position in % des gesamten Plans (0–100), nicht raum-relativ. */
  y?: number;
  scale?: number;
  color?: string;
  /** Hintergrund-Transparenz des Kreises (0–1), Standard 1 */
  background_opacity?: number;
  icon?: string;
  /** Wenn true: Wert/State der Entität statt Icon anzeigen */
  show_value?: boolean;
  /** Wenn false: nur Icon anzeigen, kein Name/Text (z. B. Rauchmelder). Standard true. */
  show_name?: boolean;
  /** Preset: temperature = Wert; binary_sensor = State; window_contact = Linie; smoke_detector = Rauchmelder, bei Auslösung/Sabotage blinkender Rand (Ping) */
  preset?: 'default' | 'temperature' | 'binary_sensor' | 'window_contact' | 'smoke_detector';
  /** Temperatur: mehrere Raum-/Heatmap-Zonen. Rechteck: x1,y1,x2,y2 (%). Polygon: points (beliebig viele Ecken). Fensterkontakt: eine Linie = ein Eintrag (x1,y1,x2,y2). */
  room_boundaries?: RoomBoundaryItem[];
  /** @deprecated Nutze room_boundaries. Ein Eintrag für Rückwärtskompatibilität. */
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

/** Ein Raum: Boundary (für Heatmap/Abdunkeln) + darin liegende Entities (Temperatur, Licht etc.). */
export interface RoomPlanRoom {
  /** Anzeigename des Raums (optional). */
  name?: string;
  /** Grenze des Raums / Heatmap-Zone(n). Wird von Temperatur- und Abdunkel-Entities im Raum genutzt. */
  boundary?: RoomBoundaryItem[];
  /** Entities in diesem Raum (nutzen room.boundary für Heatmap/Abdunkeln). */
  entities: RoomPlanEntity[];
}

/** Ein Eintrag in room_boundaries: Rechteck (x1,y1,x2,y2) oder Polygon (points mit mind. 3 Ecken). */
export type RoomBoundaryItem =
  | { x1: number; y1: number; x2: number; y2: number; opacity?: number }
  | { points: { x: number; y: number }[]; opacity?: number };

/** Temperatur-Heatmap: Rechteck (x1,y1,x2,y2) oder Polygon (points) in %, gefärbt nach entity-Wert */
export type HeatmapZone =
  | { entity: string; x1: number; y1: number; x2: number; y2: number; opacity?: number }
  | { entity: string; points: { x: number; y: number }[]; opacity?: number };

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
  /** Entitäten für Meldungs-Badge (z. B. Rauchmelder) – Badge zeigt Anzahl aktiver Meldungen, rechts in der Tab-Leiste */
  alert_entities?: string[];
  /** Aktion beim Klick auf das Meldungs-Badge (optional) */
  alert_badge_action?: ActionConfig;
  /** Räume: jeder Raum hat Boundary + Entities (Temperatur, Licht etc. nutzen Raumboundary). */
  rooms?: RoomPlanRoom[];
  /** @deprecated Nutze rooms[].entities. Flache Entitätsliste für Abwärtskompatibilität. */
  entities?: RoomPlanEntity[];
}
