import { coerce, rsort } from 'semver';
import { construct } from '../../shared/utils/sparql.js';
import { ensureGraphArray, ensureNumber, normalizeJsonLd } from '../../v1/utils/jsonld-compat';
import frame from '../frames/digital-objects.jsonld';
import query from '../queries/digital-objects.rq';

function reformatResponse(jsonld) {
  const results = normalizeJsonLd(ensureGraphArray(jsonld), new Set(['hraVersions', 'versions', 'datasets', 'organs', 'organIds']));
  for (const result of results) {
    result.hraVersions = sortVersions(result.hraVersions || []);
    result.versions = sortVersions(result.versions);
    for (const field of ['cell_count', 'biomarker_count']) {
      if (result[field] !== undefined) {
        result[field] = ensureNumber(result[field]) || 0;
      }
    }
  }
  return {
    "@context": jsonld['@context'],
    "@graph": results
  }
}

export async function getDigitalObjects(endpoint = 'https://lod.humanatlas.io/sparql') {
  // Temporarily use a set sparql endpoint
  endpoint = 'https://lod.humanatlas.io/sparql'

  return reformatResponse(await construct(query, endpoint, frame));
}

function sortVersions(versions) {
  return rsort(
    versions.map((version) => {
      const semver = coerce(version, true);
      semver.original = version;
      return semver;
    })
  ).map((semver) => semver.original);
}
