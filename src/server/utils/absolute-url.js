/**
 * @module absolute-url
 *
 * Robust utility for deriving an absolute URL from an Express request.
 *
 * Design goals:
 * - Explicit trust model (no silent reliance on proxy headers)
 * - Safe handling of untrusted Host headers
 * - Support for reverse proxies (X-Forwarded-* headers)
 * - Optional canonicalization (force protocol / host)
 * - Predictable behavior across environments
 */

const DEFAULTS = {
  trustProxy: false,
  allowedHosts: null,   // Array<string> of allowed hostnames (no ports)
  defaultHost: null,    // Fallback host if validation fails
  forceProtocol: null,  // 'http' | 'https'
  forceHost: null       // Full host, may include port
};

/**
 * Extract the left-most value from a comma-separated header.
 * Per RFC 7239 / de-facto proxy conventions, the first value is the original client-facing value.
 *
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
function getFirstHeaderValue(value) {
  if (!value || typeof value !== 'string') return undefined;
  return value.split(',')[0].trim();
}

/**
 * Normalize and validate protocol.
 *
 * @param {string | undefined} proto
 * @returns {'http' | 'https'}
 */
function normalizeProtocol(proto) {
  if (!proto) return 'http';
  const p = proto.toLowerCase();
  return p === 'https' ? 'https' : 'http';
}

/**
 * Extract hostname (without port).
 *
 * @param {string} host
 * @returns {string}
 */
function extractHostname(host) {
  // Handles IPv6 [::1]:3000 and standard host:port
  if (host.startsWith('[')) {
    const idx = host.indexOf(']');
    return idx !== -1 ? host.slice(1, idx) : host;
  }
  return host.split(':')[0];
}

/**
 * Validate host against an allowlist.
 *
 * @param {string} host
 * @param {string[]} allowedHosts
 * @returns {boolean}
 */
function isAllowedHost(host, allowedHosts) {
  const hostname = extractHostname(host);
  return allowedHosts.includes(hostname);
}

/**
 * Construct an absolute URL from an Express request.
 *
 * @param {import('express').Request} req
 * @param {Object} [options]
 * @param {boolean} [options.trustProxy=false]
 *   Whether to trust X-Forwarded-* headers. Should align with Express `app.set('trust proxy', true)`.
 *
 * @param {string[]} [options.allowedHosts]
 *   Whitelist of allowed hostnames (no ports). If provided, host validation is enforced.
 *
 * @param {string} [options.defaultHost]
 *   Fallback host if validation fails. If omitted and validation fails, an error is thrown.
 *
 * @param {'http' | 'https'} [options.forceProtocol]
 *   Override protocol regardless of request/proxy headers.
 *
 * @param {string} [options.forceHost]
 *   Override host (may include port), bypassing request-derived values.
 *
 * @returns {string} Absolute URL
 *
 * @throws {Error} If host is invalid and no fallback is provided
 */
export function getAbsoluteUrl(req, options = {}) {
  const opts = { ...DEFAULTS, ...options };

  // --- protocol ---
  let protocol;
  if (opts.forceProtocol) {
    protocol = normalizeProtocol(opts.forceProtocol);
  } else if (opts.trustProxy) {
    protocol = normalizeProtocol(
      getFirstHeaderValue(req.headers['x-forwarded-proto']) || req.protocol
    );
  } else {
    protocol = normalizeProtocol(req.protocol);
  }

  // --- host ---
  let host;
  if (opts.forceHost) {
    host = opts.forceHost;
  } else if (opts.trustProxy) {
    host =
      getFirstHeaderValue(req.headers['x-forwarded-host']) ||
      req.get('host');
  } else {
    host = req.get('host');
  }

  if (!host || typeof host !== 'string') {
    if (opts.defaultHost) {
      host = opts.defaultHost;
    } else {
      throw new Error('Unable to determine request host');
    }
  }

  // --- validation ---
  if (opts.allowedHosts) {
    if (!isAllowedHost(host, opts.allowedHosts)) {
      if (opts.defaultHost) {
        host = opts.defaultHost;
      } else {
        throw new Error(`Untrusted host: ${host}`);
      }
    }
  }

  // --- path ---
  const path = req.originalUrl || req.url || '/';

  return `${protocol}://${host}${path}`;
}

/**
 * Safer alternative when you already have a known base URL.
 * Avoids reliance on request headers entirely.
 *
 * @param {import('express').Request} req
 * @param {string} baseUrl - e.g. "https://example.com"
 * @returns {string}
 */
export function getAbsoluteUrlFromBase(req, baseUrl) {
  if (!baseUrl) {
    throw new Error('baseUrl is required');
  }
  return new URL(req.originalUrl || req.url || '/', baseUrl).toString();
}
