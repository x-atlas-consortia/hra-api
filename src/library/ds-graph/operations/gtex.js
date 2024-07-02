// Converted from transpiled ccf-ui code:
// https://github.com/hubmapconsortium/ccf-ui/blob/main/projects/ccf-api/src/lib/routes/v1/gtex/rui-locations.ts

const DEFAULT_GTEX_RUI_LOCATIONS =
  'https://hubmapconsortium.github.io/hra-registrations/gtex-pan-eraslan-2022/rui_locations.jsonld';
const GTEX_API_URL = 'https://gtexportal.org/api/v2/dataset/tissueSiteDetail';

function updateEntry(resultsList, tissueInfo, sex) {
  const matchingEntry = resultsList.find(
    (entry) => entry['@id']?.includes(tissueInfo.tissueSiteDetailId) && entry.label.includes(sex)
  );
  if (matchingEntry) {
    const index = resultsList.indexOf(matchingEntry);
    const sexStats = sex === 'Male' ? tissueInfo.rnaSeqSampleSummary.male : tissueInfo.rnaSeqSampleSummary.female;
    resultsList[
      index
    ].label = `${sex}s (n=${sexStats.count}) Mean Age ${sexStats.ageMean} (range ${sexStats.ageMin} - ${sexStats.ageMax})`;
    resultsList[index].sex = sex;
  }
}

export async function gtexRegistrations() {
  try {
    const [jsonld, response] = await Promise.all([
      fetch(DEFAULT_GTEX_RUI_LOCATIONS).then((r) => r.json()),
      fetch(GTEX_API_URL).then((r) => r.json())
    ]);
    const results = jsonld['@graph'];
    const mappedEntries = response?.data?.filter((entry) => entry.mappedInHubmap) ?? [];
    for (const tissue of mappedEntries) {
      updateEntry(results, tissue, 'Female');
      updateEntry(results, tissue, 'Male');
    }
    return jsonld;
  } catch (_error) {
    return undefined;
  }
}
