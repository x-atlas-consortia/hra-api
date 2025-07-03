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

  spec.servers = [
    {
      description: 'HRA-API Production',
      url: 'https://apps.humanatlas.io/api/grlc',
    },
    {
      description: 'HRA-API Staging',
      url: 'https://apps.humanatlas.io/api--staging/api/grlc',
    },
    {
      description: 'Local Server',
      url: '/grlc',
    },
  ];

  if (!name?.endsWith('index')) {
    spec.info.title += ` (${name})`;
    for (const server of spec.servers) {
      server.url += `/${name}`;
    }
  }

  // Some minor modifications to make sure clients can be compiled via @openapitools/openapi-generator-cli
  delete spec.prev_commit;
  delete spec.next_commit;
  delete spec.prov;

  // Find parameter defaults and set them as examples where appropriate to allow for better user experience
  setExampleFromDefault(spec);

  return spec;
}

function setExampleFromDefault(spec) {
  for (const pathSpec of Object.values(spec.paths ?? {})) {
    for (const methodSpec of Object.values(pathSpec)) {
      for (const paramSpec of methodSpec.parameters ?? []) {
        if (paramSpec && paramSpec.name !== 'endpoint') {
          if (paramSpec.schema?.default) {
            paramSpec.schema.example = paramSpec.schema.default;
          }
        }
      }
    }
  }
}
