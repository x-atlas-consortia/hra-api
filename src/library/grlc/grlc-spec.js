export async function getGrlcSpec(name) {
  const url = `https://grlc.io/api-git/hubmapconsortium/ccf-grlc/subdir/${name}/swagger`;
  const spec = await fetch(url).then((r) => r.json());

  // Update spec metadata for better display
  spec.info = {
    contact: {
      name: 'HuBMAP Help Desk',
      email: 'help@hubmapconsortium.org',
    },
    description:
      'This API provides custom queries using the Human Reference Atlas (HRA) Knowledge Graph (HRA-KG). See the [HuBMAP HRA Portal](https://humanatlas.io/) for details.<br><br>Queries powered by [grlc.io](https://grlc.io), the git repository linked data API constructor.',
    license: {
      name: 'MIT License',
      url: 'https://spdx.org/licenses/MIT.html',
    },
    title: `HRA-API ${name} queries`,
  };

  // Some minor modifications to make sure clients can be compiled via @openapitools/openapi-generator-cli
  delete spec.prev_commit;
  delete spec.next_commit;
  delete spec.prov;
  spec.schemes = ['https'];

  return spec;
}
