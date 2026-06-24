import { GenericProvider } from './generic/generic.provider.js';
import { TwitchProvider } from './twitch/twitch.provider.js';
import { YouTubeProvider } from './youtube/youtube.provider.js';

export class ProvidersRegistry {
  constructor() {
    this.providers = [];
    this.fallbackProvider = null;
    this.providerMap = new Map();
  }

  registerProvider(provider, { fallback = false } = {}) {
    if (!provider?.name) {
      throw new Error('El provider debe tener name');
    }

    if (fallback) {
      this.fallbackProvider = provider;
    } else {
      this.providers.push(provider);
    }

    this.providerMap.set(provider.name, provider);
    return provider;
  }

  getProviders() {
    return [...this.providers];
  }

  getFallbackProvider() {
    if (!this.fallbackProvider) {
      throw new Error('No hay fallback provider registrado');
    }

    return this.fallbackProvider;
  }

  get(name) {
    return this.providerMap.get(name);
  }
}

export function bootstrapDefaultProviders(registry = new ProvidersRegistry()) {
  registry.registerProvider(new YouTubeProvider());
  registry.registerProvider(new TwitchProvider());
  registry.registerProvider(new GenericProvider(), { fallback: true });
  return registry;
}
