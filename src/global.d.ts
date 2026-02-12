declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string; preview?: boolean }>;
  }
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ha-card': Record<string, unknown> & { class?: string };
      'ha-icon': { icon?: string; style?: Record<string, string | number>; class?: string; className?: string };
    }
  }
}
export {};
