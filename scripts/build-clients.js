#!/usr/bin/env node
import { globSync } from 'glob';
import { basename } from 'path';
import sh from 'shelljs';

const BUILD_DIR='./dist/clients';
const clients = globSync('./openapi-clients/configs/*.yaml');

sh.mkdir('-p', BUILD_DIR);
sh.rm('-rf', `${BUILD_DIR}/*`);

sh.exec(`npm run build:openapi-spec`);
sh.exec(`node ./scripts/preprocess-openapi.js -i hra-api-spec.yaml -o ${BUILD_DIR}/spec.yaml`);

for (const clientConfig of clients) {
  const name = basename(clientConfig, '.yaml');
  sh.exec(`npx openapi-generator-cli generate -c ${clientConfig} -i ${BUILD_DIR}/spec.yaml -o ${BUILD_DIR}/${name}`);

  if (name === 'python-client') {
    sh.exec(`cd ${BUILD_DIR}/${name} && /usr/bin/env python setup.py bdist_wheel`);
  } else {
    sh.exec(`cd ${BUILD_DIR}/${name} && npm install && npm run build`);
  }
}

console.log('=== Publishing Commands ===\n');
for (const clientConfig of clients) {
  const name = basename(clientConfig, '.yaml');
  if (name === 'python-client') {
    console.log(`pushd ${BUILD_DIR}/${name}; twine upload dist/*; popd`); // publishing command
  } else if (name === 'angular-client') {
    console.log(`pushd ${BUILD_DIR}/${name}; npm publish dist --access public; popd`);
  } else {
    console.log(`pushd ${BUILD_DIR}/${name}; npm publish --access public; popd`);
  }
}
