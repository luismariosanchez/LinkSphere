import {
  DEFAULT_INGESTION_SOURCE,
  INGESTION_SOURCES,
} from '../../shared/constants/ingestion.js';

function trim(value) {
  return String(value ?? '').trim();
}

function normalizeTags(tags) {
  if (tags === undefined || tags === null) {
    return [];
  }

  if (!Array.isArray(tags)) {
    throw new Error('tags debe ser un array de strings');
  }

  return [...new Set(tags.map((tag) => trim(tag)).filter(Boolean))];
}

export function validateIngestionInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Input de ingestion inválido');
  }

  const url = trim(input.url);
  if (!url) {
    throw new Error('La URL es obligatoria');
  }

  const source = trim(input.source || DEFAULT_INGESTION_SOURCE).toLowerCase();
  if (!INGESTION_SOURCES.includes(source)) {
    throw new Error(`source inválido. Valores: ${INGESTION_SOURCES.join(', ')}`);
  }

  const title = input.title === undefined || input.title === null
    ? undefined
    : trim(input.title);

  const folder = input.folder === undefined || input.folder === null
    ? undefined
    : trim(input.folder);

  return {
    url,
    title: title || undefined,
    source,
    tags: normalizeTags(input.tags),
    folder: folder || undefined,
  };
}
