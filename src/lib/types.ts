import type { LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

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
  icon?: string;
}

export interface RoomPlanCardConfig extends LovelaceCardConfig {
  type: string;
  image?: string;
  title?: string;
  rotation?: number;
  entities?: RoomPlanEntity[];
}
