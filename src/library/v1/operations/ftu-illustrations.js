import { construct } from '../../shared/utils/sparql.js';
import { ensureGraphArray, normalizeJsonLd } from '../../v1/utils/jsonld-compat';
import frame from '../frames/ftu-illustrations.jsonld';
import query from '../queries/ftu-illustrations.rq';

function reformatResponse(jsonld) {
  const results = normalizeJsonLd(ensureGraphArray(jsonld), new Set(['mapping', 'illustration_files']));
  return {
    '@context': jsonld['@context'],
    '@graph': results,
  };
}

export async function getFtuIllustrations(_filter, endpoint = 'https://lod.humanatlas.io/sparql') {
  return reformatResponse(await construct(query, endpoint, frame));
}
