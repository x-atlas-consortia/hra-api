import { ensureArray, expandIri } from './jsonld-compat.js';

export function formatTermOccurences(dataJsonLd) {
  return ensureArray(dataJsonLd['@graph'] ?? dataJsonLd).reduce(
    (acc, row) => ((acc[expandIri(row['@id'])] = parseInt(row['count'])), acc),
    {}
  );
}
