const USE_LOCAL_DB = !process.env.SPARQL_ENDPOINT;

const SPARQL_WRITABLE = process.env.BLAZEGRAPH_READONLY === 'false';
const SPARQL_ENDPOINT = USE_LOCAL_DB ? `http://localhost:${process.env.BLAZEGRAPH_PORT}/blazegraph/namespace/kb/sparql` : process.env.SPARQL_ENDPOINT;

const HRA_API = {
  name: 'hra-api',
  script: './dist/server.js',
  env: {
    SPARQL_WRITABLE,
    SPARQL_ENDPOINT,
  },
  cron_restart: '0 2 * * *'
};

const BLAZEGRAPH = {
  name: 'blazegraph',
  script: '/blazegraph/entrypoint.sh',
  cron_restart: '0 2 * * *'
};

module.exports = {
  apps: USE_LOCAL_DB ? [HRA_API, BLAZEGRAPH] : [HRA_API],
};
