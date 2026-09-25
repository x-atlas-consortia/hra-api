export function percentile(values, p) {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function summarize(values) {
  return {
    n: values.length,
    min: Math.min(...values),
    p50: percentile(values, 0.5),
    p95: percentile(values, 0.95),
    max: Math.max(...values),
    mean: values.reduce((a, b) => a + b, 0) / values.length,
  };
}

export function geomean(values) {
  const vals = values.filter((v) => Number.isFinite(v) && v > 0);
  if (vals.length === 0) return NaN;
  return Math.exp(vals.reduce((acc, v) => acc + Math.log(v), 0) / vals.length);
}
