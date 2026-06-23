import { GenericProvider } from './generic.provider.js';
import { TwitchProvider } from './twitch.provider.js';
import { YouTubeProvider } from './youtube.provider.js';

export class ProviderManager {
  constructor(providers = null) {
    this.providers = providers ?? [
      new YouTubeProvider(),
      new TwitchProvider(),
      new GenericProvider(),
    ];
    this.fallback = this.providers.find((provider) => provider.name === 'generic');
  }

  async resolveMetadata(url) {
    console.log('[ProviderManager] Resolviendo metadata para:', url);

    for (const provider of this.providers) {
      if (provider.name === 'generic') {
        continue;
      }

      if (provider.canHandle(url)) {
        console.log('Provider selected:', provider.name);
        const metadata = await provider.enrich(url);
        console.log('[ProviderManager] metadata devuelta:', metadata);
        return metadata;
      }
    }

    console.log('Provider selected:', this.fallback.name);
    const metadata = await this.fallback.enrich(url);
    console.log('[ProviderManager] metadata devuelta:', metadata);
    return metadata;
  }
}
