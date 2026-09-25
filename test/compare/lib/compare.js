import {
  canonicalOrdered,
  canonicalUnordered,
  flattenJsonLdFacts,
  looksLikeJsonLd,
  normalizeLines,
  numbersClose,
  stableStringify,
  tolerantEqual,
} from './normalize.js';

export const CATEGORIES = ['identical', 'order-only', 'embedding-only', 'different', 'error'];

/** Categories that count as a pass without needing review */
export const PASSING = new Set(['identical', 'order-only', 'embedding-only']);

const MAX_SAMPLES = 5;

/** Removes values at volatile paths (e.g., generated ids), given as regexes on dotted paths like `a.b.c` */
function stripVolatile(value, patterns, path = '') {
  if (!patterns?.length || !value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => stripVolatile(v, patterns, path));
  const result = {};
  for (const [key, v] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (!patterns.some((p) => p.test(childPath))) {
      result[key] = stripVolatile(v, patterns, childPath);
    }
  }
  return result;
}

function tryParseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function sample(list) {
  return list.slice(0, MAX_SAMPLES).map((s) => (s.length > 400 ? s.slice(0, 400) + '…' : s));
}

/** Multiset difference of two lists of strings */
function multisetDiff(a, b) {
  const counts = new Map();
  for (const x of a) counts.set(x, (counts.get(x) ?? 0) + 1);
  const onlyB = [];
  for (const x of b) {
    const c = counts.get(x) ?? 0;
    if (c > 0) {
      counts.set(x, c - 1);
    } else {
      onlyB.push(x);
    }
  }
  const onlyA = [];
  for (const [x, c] of counts) for (let i = 0; i < c; i++) onlyA.push(x);
  return { onlyA, onlyB };
}

/** Finds the list of "records" in a JSON response to produce a readable diff */
function records(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    if (Array.isArray(value['@graph'])) return value['@graph'];
    if (Array.isArray(value.nodes)) return value.nodes;
  }
  return [value];
}

function recordKey(record) {
  if (record && typeof record === 'object' && !Array.isArray(record)) {
    for (const key of ['@id', 'id', '@type']) {
      if (record[key] !== undefined && key !== '@type') return String(record[key]);
    }
  }
  return undefined;
}

/** Produces a human readable summary of how two JSON values differ */
function describeJsonDiff(a, b) {
  const ra = records(canonicalUnordered(a));
  const rb = records(canonicalUnordered(b));
  const keyed = ra.every((r) => recordKey(r) !== undefined) && rb.every((r) => recordKey(r) !== undefined);
  if (keyed) {
    const ma = new Map(ra.map((r) => [recordKey(r), r]));
    const mb = new Map(rb.map((r) => [recordKey(r), r]));
    const onlyA = [...ma.keys()].filter((k) => !mb.has(k));
    const onlyB = [...mb.keys()].filter((k) => !ma.has(k));
    const changed = [...ma.keys()].filter((k) => mb.has(k) && stableStringify(ma.get(k)) !== stableStringify(mb.get(k)));
    return {
      records: [ra.length, rb.length],
      onlyA: onlyA.length,
      onlyB: onlyB.length,
      changed: changed.length,
      samples: {
        onlyA: sample(onlyA),
        onlyB: sample(onlyB),
        changed: changed.slice(0, MAX_SAMPLES).map((k) => ({
          key: k,
          ...propertyDiff(ma.get(k), mb.get(k)),
        })),
      },
    };
  }
  const { onlyA, onlyB } = multisetDiff(ra.map(stableStringify), rb.map(stableStringify));
  return {
    records: [ra.length, rb.length],
    onlyA: onlyA.length,
    onlyB: onlyB.length,
    samples: { onlyA: sample(onlyA), onlyB: sample(onlyB) },
  };
}

/** For two records with the same key, list the properties that differ */
function propertyDiff(a, b) {
  const props = {};
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const sa = stableStringify(a[key]);
      const sb = stableStringify(b[key]);
      if (sa !== sb) {
        props[key] = [trim(sa), trim(sb)];
      }
    }
  }
  return { properties: props };
}

/** Lists the first paths at which two (canonicalized) JSON values differ */
function firstDifferences(a, b, path = '$', out = [], max = 8) {
  if (out.length >= max) return out;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      const { onlyA, onlyB } = multisetDiff(a.map(stableStringify), b.map(stableStringify));
      out.push({ path, lengths: [a.length, b.length], onlyA: sample(onlyA).slice(0, 3), onlyB: sample(onlyB).slice(0, 3) });
      return out;
    }
    a.forEach((v, i) => firstDifferences(v, b[i], `${path}[${i}]`, out, max));
  } else if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
      if (!(key in a) || !(key in b)) {
        out.push({ path: `${path}.${key}`, missingIn: key in a ? 'B' : 'A', value: trim(stableStringify(a[key] ?? b[key])) });
      } else if (!tolerantEqual(a[key], b[key])) {
        firstDifferences(a[key], b[key], `${path}.${key}`, out, max);
      }
      if (out.length >= max) break;
    }
  } else if (!(typeof a === 'number' && typeof b === 'number' && numbersClose(a, b)) && stableStringify(a) !== stableStringify(b)) {
    out.push({ path, a: trim(stableStringify(a)), b: trim(stableStringify(b)) });
  }
  return out;
}

function trim(s) {
  return s === undefined ? undefined : s.length > 300 ? s.slice(0, 300) + '…' : s;
}

/**
 * Compares two HTTP responses: { status, contentType, body, error? }
 * @returns {{ category: string, details?: object }}
 */
export function compareResponses(a, b, { volatile = [] } = {}) {
  if (a.error || b.error) {
    return { category: 'error', details: { a: a.error, b: b.error } };
  }
  if (a.status !== b.status) {
    return {
      category: 'different',
      details: { reason: 'status', status: [a.status, b.status], body: [trim(a.body), trim(b.body)] },
    };
  }
  if (a.body === b.body) {
    return { category: 'identical' };
  }

  const ja = tryParseJson(a.body);
  const jb = tryParseJson(b.body);
  if (ja.ok && jb.ok) {
    ja.value = stripVolatile(ja.value, volatile);
    jb.value = stripVolatile(jb.value, volatile);
    if (tolerantEqual(canonicalOrdered(ja.value), canonicalOrdered(jb.value))) {
      return { category: 'identical' };
    }
    if (tolerantEqual(canonicalUnordered(ja.value), canonicalUnordered(jb.value))) {
      return { category: 'order-only' };
    }
    if (looksLikeJsonLd(ja.value) || looksLikeJsonLd(jb.value)) {
      const fa = flattenJsonLdFacts(ja.value);
      const fb = flattenJsonLdFacts(jb.value);
      if (fa.length === fb.length && fa.every((f, i) => f === fb[i])) {
        return { category: 'embedding-only' };
      }
      const { onlyA, onlyB } = multisetDiff(fa, fb);
      return {
        category: 'different',
        details: {
          reason: 'json-ld',
          facts: [fa.length, fb.length],
          onlyA: onlyA.length,
          onlyB: onlyB.length,
          samples: { onlyA: sample(onlyA), onlyB: sample(onlyB) },
          records: describeJsonDiff(ja.value, jb.value),
          paths: firstDifferences(canonicalUnordered(ja.value), canonicalUnordered(jb.value)),
        },
      };
    }
    return {
      category: 'different',
      details: {
        reason: 'json',
        ...describeJsonDiff(ja.value, jb.value),
        paths: firstDifferences(canonicalUnordered(ja.value), canonicalUnordered(jb.value)),
      },
    };
  }

  // Text responses (CSV, TSV, N-Triples, Turtle, HTML, ...)
  const la = normalizeLines(a.body);
  const lb = normalizeLines(b.body);
  if (la.length === lb.length && la.every((l, i) => l === lb[i])) {
    return { category: 'identical' };
  }
  const { onlyA, onlyB } = multisetDiff(la, lb);
  if (onlyA.length === 0 && onlyB.length === 0) {
    return { category: 'order-only' };
  }
  return {
    category: 'different',
    details: {
      reason: 'text',
      lines: [la.length, lb.length],
      onlyA: onlyA.length,
      onlyB: onlyB.length,
      samples: { onlyA: sample(onlyA), onlyB: sample(onlyB) },
    },
  };
}
