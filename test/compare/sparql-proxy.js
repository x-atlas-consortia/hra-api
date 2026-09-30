#!/usr/bin/env node
/**
 * A logging reverse proxy for a SPARQL endpoint. Point an HRA API instance at this proxy (SPARQL_ENDPOINT) to
 * capture every distinct SPARQL query it sends. The captured queries can be replayed against both backends with
 * sparql-compare.js.
 *
 * Usage: node test/compare/sparql-proxy.js --target http://localhost:28081/ [--port 28082] [--out queries.jsonl]
 */
import { createHash } from 'crypto';
import { appendFileSync, existsSync, readFileSync } from 'fs';
import http from 'http';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const target = new URL(arg('--target', 'http://localhost:28081/'));
const port = Number(arg('--port', 28082));
const outFile = resolve(arg('--out', resolve(HERE, 'cases/sparql-queries.jsonl')));

const seen = new Set();
if (existsSync(outFile)) {
  for (const line of readFileSync(outFile, 'utf8').split('\n').filter(Boolean)) {
    seen.add(JSON.parse(line).hash);
  }
}

function record(kind, text, accept) {
  const hash = createHash('md5').update(kind + text).digest('hex');
  if (!seen.has(hash)) {
    seen.add(hash);
    appendFileSync(outFile, JSON.stringify({ hash, kind, accept, query: text }) + '\n');
  }
}

http
  .createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] ?? '';
      try {
        if (contentType.includes('application/x-www-form-urlencoded')) {
          const query = new URLSearchParams(body.toString()).get('query');
          if (query) record('query', query, req.headers.accept);
        } else if (contentType.includes('application/sparql-update')) {
          record('update', body.toString(), undefined);
        }
      } catch (err) {
        console.error('Could not record request', err);
      }

      const proxied = http.request(
        { hostname: target.hostname, port: target.port, path: req.url, method: req.method, headers: req.headers },
        (upstream) => {
          res.writeHead(upstream.statusCode ?? 502, upstream.headers);
          upstream.pipe(res);
        }
      );
      proxied.on('error', (err) => {
        res.writeHead(502);
        res.end(String(err));
      });
      proxied.end(body);
    });
  })
  .listen(port, () => console.log(`SPARQL logging proxy on :${port} -> ${target} (logging to ${outFile})`));
