#!/usr/bin/env node
/**
 * Compares a single API request between two backends and prints the comparison details.
 * Usage: node test/compare/diff-url.js <path?query> [--a url] [--b url]
 */
import { compareResponses } from './lib/compare.js';
import { sendCase } from './lib/http.js';

const arg = (name, fallback) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback);
const [path, query = ''] = process.argv[2].split('?');
const testCase = { method: 'GET', path, query };
const [ra, rb] = await Promise.all([
  sendCase(arg('--a', 'http://localhost:18080/'), testCase),
  sendCase(arg('--b', 'http://localhost:28080/'), testCase),
]);
const result = compareResponses(ra, rb);
console.log(`${result.category} (status ${ra.status}/${rb.status}, bytes ${ra.bytes}/${rb.bytes}, ms ${ra.ms?.toFixed(0)}/${rb.ms?.toFixed(0)})`);
if (result.details) console.log(JSON.stringify(result.details.paths ?? result.details, null, 1).slice(0, 8000));
