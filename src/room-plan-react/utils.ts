export function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace(/^#/, '').match(/(.{2})/g);
  if (!m || m.length !== 3) return `rgba(45, 45, 45, ${alpha})`;
  const [r, g, b] = m.map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

export function temperatureColor(temp: number): string {
  if (temp < 18) return '#2196f3';
  if (temp < 24) return '#ff9800';
  return '#f44336';
}

export function getEntityDomain(entityId: string): string {
  const idx = entityId.indexOf('.');
  return idx > 0 ? entityId.slice(0, idx) : '';
}
