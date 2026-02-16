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

/** Weniger Intensität bei kleineren Räumen: Faktor 0.4–1 abhängig von Fläche in View-% (Referenz 50×50 = 2500). */
export function intensityForArea(areaInViewPercent: number): number {
  const ref = 2500;
  return 0.4 + 0.6 * Math.min(1, areaInViewPercent / ref);
}

/** Intensität pro Farbbereich (0–1): je extremer die Temp in Blau/Orange/Rot, desto kräftiger. Beim Farbwechsel zurückgesetzt. */
export function intensityForTempInColorBand(temp: number): number {
  if (temp < 18) {
    return Math.min(1, Math.max(0, (18 - temp) / 8));
  }
  if (temp < 24) {
    const dist = Math.abs(temp - 21) / 2;
    return Math.max(0.55, Math.min(1, dist));
  }
  return Math.min(1, Math.max(0, (temp - 24) / 4));
}

export function getEntityDomain(entityId: string): string {
  const idx = entityId.indexOf('.');
  return idx > 0 ? entityId.slice(0, idx) : '';
}
