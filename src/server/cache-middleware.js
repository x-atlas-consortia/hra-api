import { existsSync } from 'fs';
import { resolve } from 'path';
import { cacheDir, longCacheTimeout, shortCacheTimeout } from './environment.js';

export function cache(ttl = shortCacheTimeout(), revalidateTtl = 600, errorTtl = 600) {
  return (_req, res, next) => {
    res.setHeader(
      'Cache-Control',
      `public, max-age=${ttl}, stale-while-revalidate=${revalidateTtl}, stale-if-error=${errorTtl}`
    );
    next();
  };
}

export const longCache = cache(longCacheTimeout());
export const shortCache = cache(shortCacheTimeout());

export function noCache(_req, res, next) {
  res.setHeader('Cache-Control', 'no-cache');
  next();
}

export function fileCache(filename) {
  const filepath = resolve(cacheDir(), filename);
  return async (_req, res, next) => {
    if (existsSync(filepath)) {
      res.sendFile(filepath, { cacheControl: false });
    } else {
      next();
    }
  };
}
