declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function isValidGaId(id: string): boolean {
  return /^G-[A-Z0-9]{6,12}$/i.test(id);
}

export function initAnalytics(): void {
  const id = (import.meta.env.VITE_GA_ID ?? '').toString().trim();
  if (!isValidGaId(id)) return;
  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  } catch {}
}

export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  try {
    window.gtag?.('event', name, params);
  } catch {}
}
