/**
 * Normalization helpers used to compare API responses from two backends.
 *
 * Levels of equivalence (from strictest to loosest):
 *  - identical:      deep-equal JSON (object key order ignored) or byte-identical text
 *  - order-only:     equal once every array / line list is treated as a multiset
 *  - embedding-only: equal once framed JSON-LD is flattened into (node, property, value) facts,
 *                    i.e. differences are only in where a node is embedded vs. referenced by @id
 */

// QLever outputs doubles with ~13 significant digits; derived values (e.g., transformation matrices) can
// accumulate slightly larger relative errors, especially close to zero
const SIGNIFICANT_DIGITS = 9;
const ZERO_THRESHOLD = 1e-9;

/** Round numbers to a fixed number of significant digits to absorb float/decimal formatting differences */
export function normalizeNumber(n) {
  if (!Number.isFinite(n) || Number.isInteger(n)) {
    return n;
  }
  if (Math.abs(n) < ZERO_THRESHOLD) {
    return 0;
  }
  return Number(n.toPrecision(SIGNIFICANT_DIGITS));
}

/** Blank node labels are arbitrary and differ between triple stores */
export function normalizeString(s) {
  return s.startsWith('_:') ? '_:b' : s;
}

function normalizeScalar(value) {
  if (typeof value === 'number') {
    return normalizeNumber(value);
  } else if (typeof value === 'string') {
    return normalizeString(value);
  }
  return value;
}

/** Stable stringify with sorted object keys */
export function stableStringify(value) {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v)
          .sort()
          .map((k) => [k, v[k]]))
      : v
  );
}

/** Canonical form preserving array order (object keys sorted, scalars normalized) */
export function canonicalOrdered(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalOrdered);
  } else if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonicalOrdered(value[k])])
    );
  }
  return normalizeScalar(value);
}

/** Canonical form where every array is treated as a multiset (sorted by canonical string) */
export function canonicalUnordered(value) {
  if (Array.isArray(value)) {
    return value
      .map(canonicalUnordered)
      .map((v) => [stableStringify(v), v])
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([, v]) => v);
  } else if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonicalUnordered(value[k])])
    );
  }
  return normalizeScalar(value);
}

/**
 * Flattens (framed) JSON-LD into a sorted list of unique facts. A node embedded in one place and referenced
 * by @id in another yields the same facts regardless of where the embedding happened.
 */
export function flattenJsonLdFacts(value) {
  const facts = new Set();

  function visit(node, subject) {
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, subject));
      return;
    }
    if (!node || typeof node !== 'object') {
      return;
    }
    const id = node['@id'] !== undefined ? normalizeString(String(node['@id'])) : subject;
    for (const [key, raw] of Object.entries(node)) {
      if (key === '@id' || key === '@context') {
        continue;
      }
      for (const v of Array.isArray(raw) ? raw : [raw]) {
        if (v && typeof v === 'object' && v['@id'] !== undefined && !('@value' in v)) {
          facts.add(stableStringify([id, key, { '@id': normalizeString(String(v['@id'])) }]));
          visit(v, undefined);
        } else if (v && typeof v === 'object') {
          // Anonymous nested object: record its canonical content
          facts.add(stableStringify([id, key, canonicalUnordered(v)]));
        } else {
          facts.add(stableStringify([id, key, normalizeScalar(v)]));
        }
      }
    }
  }

  visit(value, '<root>');
  return [...facts].sort();
}

/** Returns true if the value looks like JSON-LD (so embedding-insensitive comparison makes sense) */
export function looksLikeJsonLd(value) {
  const s = JSON.stringify(value ?? null).slice(0, 200000);
  return s.includes('"@id"') || s.includes('"@graph"') || s.includes('"@context"');
}

/** Splits text into lines with normalized blank nodes, used for CSV/TSV/N-Triples comparisons */
export function normalizeLines(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => l.replace(/_:[A-Za-z0-9_\-.]+/g, '_:b'));
}
