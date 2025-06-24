import { coerce, rsort } from 'semver';
import { construct } from '../../shared/utils/sparql.js';
import { ensureGraphArray, ensureNumber, normalizeJsonLd } from '../../v1/utils/jsonld-compat';
import frame from '../frames/digital-objects.jsonld';
import query from '../queries/digital-objects.rq';

function reformatResponse(jsonld) {
  const results = normalizeJsonLd(ensureGraphArray(jsonld), new Set(['versions', 'organs', 'organIds']));
  for (const result of results) {
    result.versions = sortVersions(result.versions);
    results.cell_count = ensureNumber(results.cell_count) || 0;
    results.biomarker_count = ensureNumber(results.biomarker_count) || 0;
  }
  return {
    "@context": jsonld['@context'],
    "@graph": results
  }
}

export async function getDigitalObjects(endpoint = 'https://lod.humanatlas.io/sparql') {
  // Temporarily use a set sparql endpoint
  endpoint = 'https://sparql.humanatlas.io/blazegraph/namespace/kb/sparql'
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
