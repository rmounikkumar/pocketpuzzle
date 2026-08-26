export interface AdProvider {
  readonly name: string;
  init(): Promise<void>;
  showInterstitial(): Promise<void>;
  showRewarded(): Promise<boolean>;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

function pushAdSense(): void {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    // AdSense not loaded yet or blocked
  }
}

export class NullAdProvider implements AdProvider {
  readonly name = 'null';
  async init(): Promise<void> {}
  async showInterstitial(): Promise<void> {}
  async showRewarded(): Promise<boolean> {
    return true;
  }
}

export class AdSenseProvider implements AdProvider {
  readonly name = 'adsense';
  private interstitialEl: HTMLElement | null = null;
  private closeBtn: HTMLButtonElement | null = null;

  async init(): Promise<void> {
    this.interstitialEl = document.getElementById('interstitial-overlay');
    this.closeBtn = document.getElementById('interstitial-close') as HTMLButtonElement | null;

    this.fillBannerAds();
  }

  private fillBannerAds(): void {
    const slots = document.querySelectorAll('#ad-top .adsbygoogle, #ad-bottom .adsbygoogle');
    slots.forEach(() => pushAdSense());
  }

  async showInterstitial(): Promise<void> {
    if (!this.interstitialEl || !this.closeBtn) return;

    this.interstitialEl.classList.remove('hidden');

    pushAdSense();

    let remaining = 5;
    this.closeBtn.disabled = true;
    this.closeBtn.textContent = `Close in ${remaining}s`;

    const interval = window.setInterval(() => {
      remaining--;
      if (remaining > 0) {
        this.closeBtn!.textContent = `Close in ${remaining}s`;
      } else {
        window.clearInterval(interval);
        this.closeBtn!.disabled = false;
        this.closeBtn!.textContent = 'Close';
      }
    }, 1000);

    return new Promise<void>((resolve) => {
      const close = () => {
        this.closeBtn!.removeEventListener('click', close);
        this.interstitialEl!.classList.add('hidden');
        resolve();
      };
      this.closeBtn!.addEventListener('click', close);
    });
  }

  async showRewarded(): Promise<boolean> {
    await this.showInterstitial();
    return true;
  }
}

export function createAdProvider(): AdProvider {
  const mode = (import.meta.env.VITE_AD_PROVIDER ?? 'none').toString().toLowerCase();
  switch (mode) {
    case 'adsense':
      return new AdSenseProvider();
    case 'crazygames':
      return new NullAdProvider();
    default:
      return new NullAdProvider();
  }
}

export const ads: AdProvider = createAdProvider();
