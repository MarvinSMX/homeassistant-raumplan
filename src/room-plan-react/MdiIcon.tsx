import { useState, useEffect } from 'preact/hooks';

const MDI_CDN = 'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg';
const cache: Record<string, string> = {};

function iconNameFromMdi(mdi: string): string {
  if (!mdi || typeof mdi !== 'string') return 'circle';
  const match = mdi.match(/^mdi:(.+)$/i);
  const name = match ? match[1].trim() : 'circle';
  return name || 'circle';
}

interface MdiIconProps {
  icon: string;
  /** CSS color (oder currentColor vom Parent) */
  color?: string;
  /** Responsive: z. B. { width: 'clamp(14px, 3.5vw, 22px)', height: '...' } */
  style?: Record<string, string | number>;
  className?: string;
}

export function MdiIcon({ icon, color, style, className }: MdiIconProps) {
  const name = iconNameFromMdi(icon);
  const [svg, setSvg] = useState<string | null>(cache[name] ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cache[name]) {
      setSvg(cache[name]);
      setFailed(false);
      return;
    }
    setFailed(false);
    const url = `${MDI_CDN}/${name}.svg`;
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Not found'))))
      .then((text) => {
        let out = text
          .replace(/\b(width|height)="[^"]*"/g, '')
          .replace(/\bfill="[^"]*"/g, 'fill="currentColor"')
          .replace(/<svg/, '<svg width="100%" height="100%" fill="currentColor" style="display:block"');
        if (!out.includes('viewBox=')) out = out.replace(/<svg/, '<svg viewBox="0 0 24 24"');
        cache[name] = out;
        setSvg(out);
      })
      .catch(() => setFailed(true));
  }, [name]);

  const responsiveStyle: Record<string, string | number> = {
    display: 'inline-block',
    flexShrink: 0,
    verticalAlign: 'middle',
    lineHeight: 0,
    ...(color ? { color } : {}),
    ...style,
  };

  if (failed || !svg) {
    return (
      <span
        className={className}
        style={{ ...responsiveStyle, background: 'var(--divider-color)', borderRadius: '50%' }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={className}
      style={responsiveStyle}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-hidden
    />
  );
}
