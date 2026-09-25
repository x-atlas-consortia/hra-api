import { readFileSync, writeFileSync } from 'fs';
const [file, budget, out] = process.argv.slice(2);
const E = 'http://localhost:28081/';
const T = 'harness-secret';
const entries = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((e) => e.kind === 'query');
const seen = new Map();
for (const e of entries) {
  const key = e.query.replace(/urn:hra-api:[0-9a-f]+/g, 'T').replace(/"[^"]*"/g, '""').replace(/<[^>]+>/g, '<>');
  if (!seen.has(key)) seen.set(key, e);
}
await fetch(`${E}?query-planning-budget=${budget}&access-token=${T}`);
const res = {};
for (const [key, q] of seen) {
  await fetch(`${E}?cmd=clear-cache-complete&access-token=${T}`);
  const t = performance.now();
  let status;
  try {
    const r = await fetch(E, { signal: AbortSignal.timeout(70000), method: 'POST', headers: { Accept: q.query.includes('CONSTRUCT') ? 'application/n-triples' : 'text/csv', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ query: q.query, timeout: '60s' }) });
    await r.text();
    status = r.status;
  } catch (e) { status = 'timeout'; }
  res[q.hash] = { ms: Math.round(performance.now() - t), status, head: q.query.replace(/PREFIX[^\n]*\n/g, '').trim().slice(0, 70).replace(/\s+/g, ' ') };
}
writeFileSync(out, JSON.stringify(res));
const vals = Object.values(res);
console.log('budget', budget, 'queries', vals.length, 'total ms', vals.reduce((a, v) => a + v.ms, 0), 'timeouts', vals.filter((v) => v.status !== 200).length);
