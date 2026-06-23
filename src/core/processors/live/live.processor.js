import { resolveIsLive } from '../../tags/tag-suggestion.service.js';
import { BaseProcessor } from '../base.processor.js';

export class LiveProcessor extends BaseProcessor {
  constructor() {
    super('live', { priority: 100 });
  }

  run(bookmark) {
    const metadata = bookmark.metadata ?? {};
    const isLive = resolveIsLive(metadata);

    return {
      priority: this.priority,
      metadata: {
        isLive,
        streamStatus: metadata.extra?.streamStatus ?? null,
      },
    };
  }
}
