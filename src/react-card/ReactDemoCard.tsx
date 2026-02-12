/**
 * Beispiel-React-Komponente für eine Home-Assistant-Card.
 * Verwendet Preact (react-jsx) für kleine Bundle-Größe.
 */
import type { HomeAssistant } from 'custom-card-helpers';

export interface ReactDemoCardConfig {
  type: string;
  title?: string;
  entity?: string;
}

interface ReactDemoCardProps {
  hass: HomeAssistant;
  config: ReactDemoCardConfig;
}

export function ReactDemoCard({ hass, config }: ReactDemoCardProps) {
  const entityId = config.entity ?? '';
  const state = entityId ? hass?.states?.[entityId] : null;
  const value = state?.state ?? '–';
  const name = state?.attributes?.friendly_name ?? (entityId || 'Keine Entität');

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>{config.title ?? 'React Demo'}</h2>
      <p style={styles.entity}>
        <strong>{name}</strong>: {value}
      </p>
      <p style={styles.hint}>Preact in Web Component (Shadow DOM)</p>
    </div>
  );
}

const styles: Record<string, Record<string, string | number>> = {
  card: {
    padding: 16,
    fontFamily: 'var(--mdc-typography-font-family, Roboto, sans-serif)',
  },
  title: {
    margin: '0 0 12px',
    fontSize: '1.1rem',
    color: 'var(--primary-text-color, #e1e1e1)',
  },
  entity: {
    margin: '0 0 8px',
    fontSize: '0.9rem',
    color: 'var(--secondary-text-color, #b0b0b0)',
  },
  hint: {
    margin: 0,
    fontSize: '0.75rem',
    opacity: 0.8,
  },
};
