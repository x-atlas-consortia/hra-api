const { randomBytes } = require('crypto');
const { writeFileSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

const USE_LOCAL_DB = !process.env.SPARQL_ENDPOINT;

const SPARQL_WRITABLE = process.env.QLEVER_READONLY === 'false';
const SPARQL_ENDPOINT = USE_LOCAL_DB ? `http://localhost:${process.env.QLEVER_PORT}/` : process.env.SPARQL_ENDPOINT;
const SPARQL_BACKEND = USE_LOCAL_DB ? 'qlever' : process.env.SPARQL_BACKEND ?? 'blazegraph';

// Updates to the local QLever require an access token. Generate one per container start
// (shared by both apps) so that it never leaves the container.
const SPARQL_UPDATE_TOKEN = process.env.SPARQL_UPDATE_TOKEN || (USE_LOCAL_DB ? randomBytes(32).toString('hex') : '');

// Run several API processes behind HAProxy, so that building large responses (e.g., JSON-LD framing) does not
// block other requests. HAProxy queues the API requests (/v1, /hra-pop, /ds-graph) and passes each one to the next
// process with a free slot (ACTIVE_QUERIES per process, 0 = no limit), so the triple store sees up to
// API_INSTANCES * ACTIVE_QUERIES queries. One request per process is fastest: two large responses in the same
// process slow each other down.
const PORT = Number(process.env.PORT || 8080);
const API_INSTANCES = Number(process.env.API_INSTANCES || 4);
const ACTIVE_QUERIES = Number(process.env.ACTIVE_QUERIES ?? 1);
// Session-token datasets built at once by each process
const DATASET_BUILDS = Number(process.env.DATASET_BUILDS || 1);
const API_PORTS = Array.from({ length: API_INSTANCES }, (_, i) => PORT + 10 + i);
const HAPROXY_CONFIG = join(tmpdir(), 'hra-api-haproxy.cfg');

const API_APPS = API_PORTS.map((port, i) => ({
  name: `hra-api-${i}`,
  script: './dist/server.js',
  env: {
    PORT: port,
    SPARQL_WRITABLE,
    SPARQL_ENDPOINT,
    SPARQL_BACKEND,
    SPARQL_UPDATE_TOKEN,
    ACTIVE_QUERIES: 0, // Queued by HAProxy
    DATASET_BUILDS,
    ...(i > 0 ? { PRUNING_SCHEDULE: '' } : {}), // Prune session-token datasets from one process only
  },
  // Restart after the triple store (restarting both at the same time can make pm2 start the API twice),
  // one process at a time so that HAProxy can send requests to the others
  cron_restart: `${(USE_LOCAL_DB ? 5 : 0) + i} 7 * * *`,
}));

// TCP health checks: a busy process still accepts connections, a stopped one refuses them (also marked down on the
// first refused request), so requests are not sent to a restarting process
const CHECK = 'check inter 1s fall 1 rise 2 observe layer4 error-limit 1 on-error mark-down';
const servers = (limit) =>
  API_PORTS.map((port, i) => `  server api${i} 127.0.0.1:${port}${limit > 0 ? ` maxconn ${limit}` : ''} ${CHECK}`).join(
    '\n'
  );

writeFileSync(
  HAPROXY_CONFIG,
  `global
  maxconn 10000
  log stdout format raw local0

defaults
  mode http
  # Log each request, including how long it waited in the queue (Tw) and how long the API took (Tr)
  log global
  option httplog
  option forwardfor
  # Drop queued requests whose client has gone away (e.g., CloudFront gives up on the origin after 60s)
  option abortonclose
  # One request per connection to the API processes, so that maxconn limits the requests being processed
  option http-server-close
  # Connection errors (e.g., while a process restarts) are retried on another process
  retries 3
  option redispatch 1
  timeout connect 5s
  timeout http-request 60s
  # Long running queries (e.g., rui-reference-data) and long waits in the queue are allowed, as before
  timeout client 1h
  timeout server 1h
  timeout queue 1h

frontend api
  bind :${PORT}
  use_backend queued if { path_beg /v1 /hra-pop /ds-graph }
  default_backend direct

backend queued
  balance leastconn
${servers(ACTIVE_QUERIES)}

backend direct
  balance leastconn
${servers(0)}
`
);

const HAPROXY = {
  name: 'haproxy',
  script: '/usr/sbin/haproxy',
  args: ['-db', '-f', HAPROXY_CONFIG],
  interpreter: 'none',
};

const QLEVER = {
  name: 'qlever',
  script: '/qlever/entrypoint.sh',
  env: {
    SPARQL_UPDATE_TOKEN,
  },
  cron_restart: '0 7 * * *',
};

// Restarts QLever when it stops answering queries for longer than the query timeout (see qlever/healthcheck.sh)
const QLEVER_HEALTH = {
  name: 'qlever-health',
  script: '/qlever/healthcheck.sh',
  interpreter: 'none',
};
const USE_HEALTH_CHECK = USE_LOCAL_DB && process.env.QLEVER_HEALTH_CHECK !== 'false';

module.exports = {
  apps: [...API_APPS, HAPROXY, ...(USE_LOCAL_DB ? [QLEVER] : []), ...(USE_HEALTH_CHECK ? [QLEVER_HEALTH] : [])],
};
