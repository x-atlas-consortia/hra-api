import { ensureGraphArray, expandIri, normalizeJsonLd } from './jsonld-compat.js';

export function formatTermOccurences(dataJsonLd) {
  return normalizeJsonLd(ensureGraphArray(dataJsonLd)).reduce(
    (acc, row) => ((acc[expandIri(row['@id'])] = row['count']), acc),
    {}
  );
}
