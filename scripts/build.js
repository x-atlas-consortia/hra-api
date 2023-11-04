#!/usr/bin/env node
import { build, context } from 'esbuild';

const watch = process.argv.slice(-1)[0] === '--watch';

const sharedBuildOptions = {
  bundle: true,
  loader: {
    '.rq': 'text',
    '.yaml': 'text',
    '.jsonld': 'json',
  },
  format: 'esm',
  outdir: 'dist',
};

const server = {
  ...sharedBuildOptions,
  entryPoints: ['src/server/server.js'],
  platform: 'node',
  packages: 'external',
};

const serviceWorker = {
  ...sharedBuildOptions,
  entryPoints: ['src/service-worker/sw.js', 'src/service-worker/sw-loader.js'],
};

const library = {
  ...sharedBuildOptions,
  entryPoints: ['src/library/operations/v1.js', 'src/library/operations/ctpop.js'],
  outdir: 'dist/operations',
};

const all = [server, serviceWorker, library];

let ops;
if (watch) {
  ops = all.map(async (options) => (await context(options)).watch());
} else {
  ops = all.map(build);
}

await Promise.all(ops);
