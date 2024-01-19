import qs from 'qs';

export function getQuery(url) {
  const searchParams = new URL(url).searchParams.toString();
  return qs.parse(searchParams, { allowDots: true });
}
