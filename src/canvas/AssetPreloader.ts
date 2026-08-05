export class AssetPreloader {
  private static instance: AssetPreloader;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadStatus: Map<string, 'loading' | 'loaded' | 'failed'> = new Map();

  public static getInstance(): AssetPreloader {
    if (!AssetPreloader.instance) {
      AssetPreloader.instance = new AssetPreloader();
    }
    return AssetPreloader.instance;
  }

  public preloadAtlas(key: string, url: string): Promise<boolean> {
    if (this.loadStatus.get(key) === 'loaded') {
      return Promise.resolve(true);
    }

    if (this.loadStatus.get(key) === 'loading') {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.loadStatus.get(key) !== 'loading') {
            clearInterval(checkInterval);
            resolve(this.loadStatus.get(key) === 'loaded');
          }
        }, 50);
      });
    }

    this.loadStatus.set(key, 'loading');

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(key, img);
        this.loadStatus.set(key, 'loaded');
        resolve(true);
      };
      img.onerror = () => {
        this.loadStatus.set(key, 'failed');
        resolve(false);
      };
      img.src = url;
    });
  }

  public isLoaded(key: string): boolean {
    return this.loadStatus.get(key) === 'loaded';
  }

  public getImage(key: string): HTMLImageElement | null {
    return this.imageCache.get(key) || null;
  }

  public getStatus(key: string): 'loading' | 'loaded' | 'failed' | 'unloaded' {
    return this.loadStatus.get(key) || 'unloaded';
  }
}

export const assetPreloader = AssetPreloader.getInstance();
