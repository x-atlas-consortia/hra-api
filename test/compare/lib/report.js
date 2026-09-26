import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { CATEGORIES, NON_FAILING, PASSING } from './compare.js';

function fmtMs(ms) {
  if (!Number.isFinite(ms)) return '-';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`;
}

function fmtRatio(r) {
  return Number.isFinite(r) ? `${r.toFixed(2)}x` : '-';
}

function escapeCell(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function isUnreviewedFailure(r) {
  return !PASSING.has(r.category) && !NON_FAILING.has(r.category) && !r.reviewed;
}

/**
 * Writes report.md into outDir.
 * @returns {{ summary: string, failed: boolean }}
 */
export function writeReport(results, outDir) {
  const { correctness, perf, datasets } = results;
  const lines = [];
  const out = (...l) => lines.push(...l);

  out(`# HRA API backend comparison — ${results.runId}`, '');
  out(`- Baseline (A): ${results.options.a}`, `- Candidate (B): ${results.options.b}`, '');

  // Datasets
  out('## Session-token datasets (end-to-end pipeline)', '');
  out('| Dataset | Status A | Status B | Time A | Time B | Ratio | OK |', '|---|---|---|---|---|---|---|');
  for (const d of datasets) {
    out(
      `| ${d.name} | ${d.a.status} | ${d.b.status} | ${fmtMs(d.a.ms)} | ${fmtMs(d.b.ms)} | ${fmtRatio(d.b.ms / d.a.ms)} | ${
        d.ok ? '✅' : '❌'
      } |`
    );
  }
  out('');

  // Correctness
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  let reviewed = 0;
  for (const r of correctness) {
    counts[r.category]++;
    if (r.reviewed) reviewed++;
  }
  const unreviewed = correctness.filter(isUnreviewedFailure);
  if (correctness.length > 0) {
    out('## Correctness', '');
    out(`${correctness.length} cases: ` + CATEGORIES.map((c) => `${c} ${counts[c]}`).join(', ') + `; reviewed ${reviewed}`, '');

    const byRoute = new Map();
    for (const r of correctness) {
      const entry = byRoute.get(r.route) ?? Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
      entry[r.category]++;
      entry.reviewed = (entry.reviewed ?? 0) + (r.reviewed ? 1 : 0);
      byRoute.set(r.route, entry);
    }
    out('| Route | ' + CATEGORIES.join(' | ') + ' | reviewed |', '|---|' + CATEGORIES.map(() => '---|').join('') + '---|');
    for (const [route, entry] of [...byRoute.entries()].sort()) {
      out(`| ${route} | ` + CATEGORIES.map((c) => entry[c]).join(' | ') + ` | ${entry.reviewed} |`);
    }
    out('');

    out(`### Unreviewed differences (${unreviewed.length})`, '');
    for (const r of unreviewed.slice(0, 200)) {
      out(`<details><summary><code>${r.id}</code> — ${r.category} (status ${r.status.join(' / ')}, bytes ${r.bytes.join(' / ')})</summary>`, '');
      out('```', `${r.method} ${r.route}?${r.query ?? ''}`, JSON.stringify(r.details, null, 1)?.slice(0, 6000) ?? '', '```', '</details>', '');
    }
    if (unreviewed.length > 200) out(`… and ${unreviewed.length - 200} more (see results.json)`, '');

    const baselineErrors = correctness.filter((r) => r.category === 'baseline-error');
    if (baselineErrors.length > 0) {
      out(`### Baseline errors (${baselineErrors.length}): the baseline failed (e.g., timed out), the candidate did not`, '');
      for (const r of baselineErrors.slice(0, 100)) {
        out(`- \`${r.id}\` — ${escapeCell(r.details?.a)} (candidate: status ${r.status[1]}, ${r.bytes[1]} bytes)`);
      }
      out('');
    }

    const reviewedList = correctness.filter((r) => r.reviewed);
    if (reviewedList.length > 0) {
      out(`### Reviewed differences (${reviewedList.length})`, '');
      const byReason = new Map();
      for (const r of reviewedList) {
        const key = `${r.reviewed.type ?? 'reviewed'}: ${r.reviewed.reason}`;
        byReason.set(key, (byReason.get(key) ?? []).concat(r.id));
      }
      for (const [reason, ids] of byReason) {
        out(`- **${escapeCell(reason)}** — ${ids.length} case(s), e.g. \`${ids[0]}\``);
      }
      out('');
    }
  }

  // Performance
  let perfFailures = [];
  if (perf) {
    out('## Performance', '');
    out(
      `Gate: p95(B) ≤ ${perf.limits.ratio}× p95(A) per case (cases under ${perf.limits.minMs}ms exempt) and geometric mean of p50 ratios ≤ 1.0 (uncached mode).`,
      ''
    );
    out('| Mode | Cases | Failures | Geomean p50 ratio | Geomean p95 ratio |', '|---|---|---|---|---|');
    for (const [mode, s] of Object.entries(perf.summaryByMode)) {
      out(`| ${mode} | ${s.cases} | ${s.failures} | ${fmtRatio(s.geomeanP50Ratio)} | ${fmtRatio(s.geomeanP95Ratio)} |`);
    }
    out('');
    if (perf.load) {
      out('### Load test', '', '| Backend | Wall time | p50 | p95 | max |', '|---|---|---|---|---|');
      for (const [key, l] of Object.entries(perf.load)) {
        out(`| ${key} | ${fmtMs(l.wallMs)} | ${fmtMs(l.latency.p50)} | ${fmtMs(l.latency.p95)} | ${fmtMs(l.latency.max)} |`);
      }
      out('');
    }
    for (const mode of Object.keys(perf.summaryByMode)) {
      out(`### Per case (${mode})`, '', '| Case | A p50 | A p95 | B p50 | B p95 | p95 ratio | |', '|---|---|---|---|---|---|---|');
      for (const r of perf.cases.filter((c) => c.mode === mode).sort((x, y) => y.p95Ratio - x.p95Ratio)) {
        out(
          `| \`${escapeCell(r.id)}\` | ${fmtMs(r.a.p50)} | ${fmtMs(r.a.p95)} | ${fmtMs(r.b.p50)} | ${fmtMs(r.b.p95)} | ${fmtRatio(
            r.p95Ratio
          )} | ${r.pass ? (r.exempt ? 'exempt' : '✅') : '❌'} |`
        );
      }
      out('');
    }
    const gateMode = perf.summaryByMode.uncached ? 'uncached' : Object.keys(perf.summaryByMode)[0];
    perfFailures = perf.cases.filter((c) => c.mode === gateMode && !c.pass);
    if (perf.summaryByMode[gateMode]?.geomeanP50Ratio > 1.0) {
      perfFailures.push({ id: 'geomean', p95Ratio: perf.summaryByMode[gateMode].geomeanP50Ratio });
    }
  }

  const datasetFailures = datasets.filter((d) => !d.ok);
  const failed = unreviewed.length > 0 || perfFailures.length > 0 || datasetFailures.length > 0;
  const summary = [
    `Correctness: ${correctness.length} cases — ` + CATEGORIES.map((c) => `${c} ${counts[c]}`).join(', ') + `; reviewed ${reviewed}; unreviewed failures ${unreviewed.length}`,
    `Datasets: ${datasets.length - datasetFailures.length}/${datasets.length} OK`,
    perf
      ? `Performance: ` +
        Object.entries(perf.summaryByMode)
          .map(([m, s]) => `${m} ${s.failures}/${s.cases} failures, geomean p50 ${fmtRatio(s.geomeanP50Ratio)}`)
          .join('; ')
      : 'Performance: not run',
    failed ? 'RESULT: FAIL' : 'RESULT: PASS',
  ].join('\n');

  out('## Summary', '', '```', summary, '```', '');
  writeFileSync(resolve(outDir, 'report.md'), lines.join('\n'));
  return { summary, failed };
}
