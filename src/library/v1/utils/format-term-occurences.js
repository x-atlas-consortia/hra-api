import { ensureGraphArray, expandIri } from './jsonld-compat.js';

export function formatTermOccurences(dataJsonLd) {
  return ensureGraphArray(dataJsonLd).reduce(
    (acc, row) => ((acc[expandIri(row['@id'])] = parseInt(row['count'])), acc),
    {}
  );
}
