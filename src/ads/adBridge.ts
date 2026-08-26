export interface AdProvider {
  readonly name: string;
  init(): Promise<void>;
  showInterstitial(): Promise<void>;
  showRewarded(): Promise<boolean>;
}

export class NullAdProvider implements AdProvider {
  readonly name = 'null';
  async init(): Promise<void> {}
  async showInterstitial(): Promise<void> {}
  async showRewarded(): Promise<boolean> {
    return false;
  }
}

export function createAdProvider(): AdProvider {
  const mode = (import.meta.env.VITE_AD_PROVIDER ?? 'none').toString().toLowerCase();
  switch (mode) {
    case 'crazygames':
    case 'adsense':
      return new NullAdProvider();
    default:
      return new NullAdProvider();
  }
}

export const ads: AdProvider = createAdProvider();
