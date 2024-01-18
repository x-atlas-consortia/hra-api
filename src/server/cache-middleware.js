import { longCacheTimeout, shortCacheTimeout } from './environment.js';

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
