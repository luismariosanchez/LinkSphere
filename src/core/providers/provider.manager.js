import { bootstrapDefaultProviders, ProvidersRegistry } from './provider.registry.js';

export class ProviderManager {
  constructor({ registry } = {}) {
    this.registry = registry ?? bootstrapDefaultProviders(new ProvidersRegistry());
  }

  async resolveMetadata(url) {
    console.log('[ProviderManager] Resolviendo metadata para:', url);

    for (const provider of this.registry.getProviders()) {
      if (provider.canHandle(url)) {
        console.log('Provider selected:', provider.name);
        const metadata = await provider.enrich(url);
        console.log('[ProviderManager] metadata devuelta:', metadata);
        return metadata;
      }
    }

    const fallback = this.registry.getFallbackProvider();
    console.log('Provider selected:', fallback.name);
    const metadata = await fallback.enrich(url);
    console.log('[ProviderManager] metadata devuelta:', metadata);
    return metadata;
  }
}
