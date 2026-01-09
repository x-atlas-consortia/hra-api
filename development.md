### This file contains pointers for how to develop and test the clients locally.

1. Build and start the local server using `npm run ...` commands

## Angular
1. **Ensure** the major version of angular is the same as the angular project it will be tested with. Otherwise you'll end up with 2 versions of the angular runtime and a bunch of injection errors!
2. Navigate to `dist/clients/angular-client/dist`
3. Run `npm pack`
4. In the testing angular project run `npm i [../../]hra-api/dist/clients/angular-client/dist/hra-api-ng-client-[version, i.e. 0.18.0].tgz`
5. Test!

## Javascript
1. Import `./dist/clients/javascript-client/dist/index.js` in a nodejs shell
2. Create a client with `new ApiClient('http://localhost:3000')`
3. Create an api with `new V1Api(client)`, etc.
4. Test!

## Python
1. Ensure python3 and pip3 is installed locally
2. Create a venv with `python3 -m venv .venv` and activate it
3. Navigate to `dist/clients/python-client` and run `pip3 install .`
4. Import `hra_api_client` in a python shell
5. Create a configuration with `Configuration(host='http://localhost:3000')`
6. Create a client with `ApiClient(configuration)`
7. Create an api with `V1Api(client)`, etc.
8. Test!

## Typescript
1. Import `./dist/clients/typescript-client/dist/index.js` in a nodejs shell
2. Create a configuration with `new Configuration({ basePath: 'http://localhost:3000' })`
3. Create an api with `new V1Api(configuration)`, etc.
4. Test!