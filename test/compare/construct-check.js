#!/usr/bin/env node
/**
 * Checks that the library's CONSTRUCT path (N-Triples + jsonld.fromRDF + framing) produces the same framed
 * JSON-LD as Blazegraph's native JSON-LD output for a query.
 *
 * Usage: node test/compare/construct-check.js <blazegraph sparql endpoint> <query.rq> [frame.jsonld] [--out dir]
 */
import { readFileSync, writeFileSync } from 'fs';
import jsonld from 'jsonld';
import { resolve } from 'path';
import { construct, fetchSparql } from '../../src/library/shared/utils/sparql.js';
import { stableStringify } from './lib/normalize.js';

const [endpoint, queryFile, frameFile] = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--out');
const outIndex = process.argv.indexOf('--out');
const outDir = outIndex >= 0 ? process.argv[outIndex + 1] : undefined;

const query = readFileSync(queryFile, 'utf8').replace('#{{FILTER}}', '');
const frame = frameFile ? JSON.parse(readFileSync(frameFile, 'utf8')) : undefined;

let start = performance.now();
const native = await (await fetchSparql(query, endpoint, 'application/ld+json')).json();
const nativeFramed = frame ? await jsonld.frame(native, frame) : native;
const nativeMs = performance.now() - start;

start = performance.now();
const converted = await construct(query, endpoint, frame);
const convertedMs = performance.now() - start;

const a = stableStringify(nativeFramed);
const b = stableStringify(converted);
console.log(
  `${queryFile.split('/').pop()}: ${a === b ? 'equal' : 'DIFFERENT'} (${a.length} / ${b.length} chars; ` +
    `native JSON-LD ${nativeMs.toFixed(0)}ms, N-Triples ${convertedMs.toFixed(0)}ms)`
);
if (a !== b && outDir) {
  writeFileSync(resolve(outDir, 'native.json'), JSON.stringify(nativeFramed, null, 1));
  writeFileSync(resolve(outDir, 'converted.json'), JSON.stringify(converted, null, 1));
}
process.exit(a === b ? 0 : 1);
