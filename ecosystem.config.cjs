const { randomBytes } = require('crypto');

const USE_LOCAL_DB = !process.env.SPARQL_ENDPOINT;

const SPARQL_WRITABLE = process.env.QLEVER_READONLY === 'false';
const SPARQL_ENDPOINT = USE_LOCAL_DB ? `http://localhost:${process.env.QLEVER_PORT}/` : process.env.SPARQL_ENDPOINT;
const SPARQL_BACKEND = USE_LOCAL_DB ? 'qlever' : process.env.SPARQL_BACKEND ?? 'blazegraph';

// Updates to the local QLever require an access token. Generate one per container start
// (shared by both apps) so that it never leaves the container.
const SPARQL_UPDATE_TOKEN = process.env.SPARQL_UPDATE_TOKEN || (USE_LOCAL_DB ? randomBytes(32).toString('hex') : '');

const HRA_API = {
  name: 'hra-api',
  script: './dist/server.js',
  env: {
    SPARQL_WRITABLE,
    SPARQL_ENDPOINT,
    SPARQL_BACKEND,
    SPARQL_UPDATE_TOKEN,
  },
  cron_restart: '0 7 * * *',
};

const QLEVER = {
  name: 'qlever',
  script: '/qlever/entrypoint.sh',
  env: {
    SPARQL_UPDATE_TOKEN,
  },
  cron_restart: '0 7 * * *',
};

module.exports = {
  apps: USE_LOCAL_DB ? [HRA_API, QLEVER] : [HRA_API],
};
