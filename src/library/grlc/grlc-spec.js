export async function getGrlcSpec(name) {
  // const url = `https://grlc.io/api-git/hubmapconsortium/ccf-grlc/subdir/${name}/swagger`;
  const url = `https://raw.githubusercontent.com/hubmapconsortium/ccf-grlc/main/cached-specs/${name}.json`;
  const spec = await fetch(url).then((r) => r.json());

  // Update spec metadata for better display
  spec.info = {
    contact: {
      name: 'HuBMAP Help Desk',
      email: 'help@hubmapconsortium.org',
    },
    description:
      'This API provides custom SPARQL queries using the Human Reference Atlas (HRA) Knowledge Graph (HRA-KG). See the [HuBMAP HRA Portal](https://humanatlas.io/) for details.<br><br>Queries powered by [grlc.io](https://grlc.io), the git repository linked data API constructor.',
    license: {
      name: 'MIT License',
      url: 'https://spdx.org/licenses/MIT.html',
    },
    title: `HRA-API SPARQL queries`,
  };

  if (!name?.endsWith('index')) {
    spec.info.title += ` (${name})`;
  }

  // Some minor modifications to make sure clients can be compiled via @openapitools/openapi-generator-cli
  delete spec.prev_commit;
  delete spec.next_commit;
  delete spec.prov;

  return spec;
}
