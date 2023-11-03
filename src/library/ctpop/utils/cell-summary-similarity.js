import { dot, norm } from 'mathjs';

/**
 * A function to return a cosine sim for two vectors
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns cosine similarity between a and b
 */
function cosineSim(a, b) {
  return dot(a, b) / (norm(a) * norm(b));
}

export function getCellDistributionSimilarity(cellsA, cellsB) {
  const keySet = new Set(Object.keys(cellsA));
  let sharedKey = false;
  for (const key of Object.keys(cellsB)) {
    if (keySet.has(key)) {
      sharedKey = true;
    }
    keySet.add(key);
  }

  // Only compute cosine sim if there is at least one shared key
  if (sharedKey) {
    const keys = [...keySet];
    const valuesA = keys.map((key) => cellsA[key] ?? 0);
    const valuesB = keys.map((key) => cellsB[key] ?? 0);
    return cosineSim(valuesA, valuesB);
  } else {
    return 0;
  }
}
