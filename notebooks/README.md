Example notebooks showcasing how to use the HRA-API from Python via the [hra-api-client](https://pypi.org/project/hra-api-client/) module.

# Updates for [hra-api-client-usage](hra-api-client-usage)

## Run a Sparql query (POST) 
Andi gets a `405` error when running `Run a SPARQL query (POST)`:
```
Exception when calling DefaultApi->sparql_post: (405)
Reason: Method Not Allowed
HTTP response headers: HTTPHeaderDict({'Content-Type': 'text/html; charset=utf-8', 'Content-Length': '22', 'Connection': 'keep-alive', 'cache-control': 'no-cache', 'content-security-policy': "base-uri 'self' cdn.humanatlas.io cdn.jsdelivr.net;script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.humanatlas.io cdn.jsdelivr.net unpkg.com [www.googletagmanager.com;img-src](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/abueckle/Documents/GitHub/hra-api/notebooks/www.googletagmanager.com;img-src) 'self' 'unsafe-eval' cdn.humanatlas.io cdn.jsdelivr.net unpkg.com [www.googletagmanager.com;connect-src](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/abueckle/Documents/GitHub/hra-api/notebooks/www.googletagmanager.com;connect-src) *;default-src 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';object-src 'none';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests", 'cross-origin-opener-policy': 'same-origin', 'cross-origin-resource-policy': 'same-origin', 'date': 'Mon, 08 Jul 2024 13:14:44 GMT', 'etag': 'W/"16-EB1bOAPfMVsBhP8XDhmnvcfBZ4w"', 'origin-agent-cluster': '?1', 'referrer-policy': 'no-referrer', 'strict-transport-security': 'max-age=15552000; includeSubDomains', 'x-content-type-options': 'nosniff', 'x-dns-prefetch-control': 'off', 'x-download-options': 'noopen', 'x-frame-options': 'SAMEORIGIN', 'x-permitted-cross-domain-policies': 'none', 'x-xss-protection': '0', 'x-envoy-upstream-service-time': '3', 'server': 'envoy', 'X-Cache': 'Error from cloudfront', 'Via': '1.1 428a2ed921cd3013591e242ee4178786.cloudfront.net (CloudFront)', 'X-Amz-Cf-Pop': 'ORD51-C4', 'Alt-Svc': 'h3=":443"; ma=86400', 'X-Amz-Cf-Id': 'LB8nvIqLxX1QEswjktkOOvacMelYQN9rqjC7JN_dziFeJS4mNcniEg==', 'Vary': 'Origin'})
HTTP response body: Unsupported operation.
```

We also get a `405` error when trying out the API endpoint at https://apps.humanatlas.io/api/#post-/v1/sparql: 
![image](https://github.com/x-atlas-consortia/hra-api/assets/22821046/8748ca12-f1e0-4b39-83e2-e68819472e13)



## Given a SpatialEntity already placed relative to a reference SpatialEntity retrieve a new direct SpatialPlacement to the given SpatialEntity IRI
We get a `404` error when running 'Given a SpatialEntity already placed relative to a reference SpatialEntity retrieve a new direct SpatialPlacement to the given SpatialEntity IRI`:
```
Exception when calling DefaultApi->get_spatial_placement: (404)
Reason: Not Found
HTTP response headers: HTTPHeaderDict({'Content-Type': 'application/json; charset=utf-8', 'Content-Length': '72', 'Connection': 'keep-alive', 'cache-control': 'no-cache', 'content-security-policy': "base-uri 'self' cdn.humanatlas.io cdn.jsdelivr.net;script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.humanatlas.io cdn.jsdelivr.net unpkg.com [www.googletagmanager.com;img-src](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/abueckle/Documents/GitHub/hra-api/notebooks/www.googletagmanager.com;img-src) 'self' 'unsafe-eval' cdn.humanatlas.io cdn.jsdelivr.net unpkg.com [www.googletagmanager.com;connect-src](https://file+.vscode-resource.vscode-cdn.net/c%3A/Users/abueckle/Documents/GitHub/hra-api/notebooks/www.googletagmanager.com;connect-src) *;default-src 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';object-src 'none';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests", 'cross-origin-opener-policy': 'same-origin', 'cross-origin-resource-policy': 'same-origin', 'date': 'Mon, 08 Jul 2024 13:17:22 GMT', 'etag': 'W/"48-LlldxmjVeDK3aB9pU7mbZaega1c"', 'origin-agent-cluster': '?1', 'referrer-policy': 'no-referrer', 'strict-transport-security': 'max-age=15552000; includeSubDomains', 'x-content-type-options': 'nosniff', 'x-dns-prefetch-control': 'off', 'x-download-options': 'noopen', 'x-frame-options': 'SAMEORIGIN', 'x-permitted-cross-domain-policies': 'none', 'x-xss-protection': '0', 'x-envoy-upstream-service-time': '4', 'server': 'envoy', 'X-Cache': 'Error from cloudfront', 'Via': '1.1 428a2ed921cd3013591e242ee4178786.cloudfront.net (CloudFront)', 'X-Amz-Cf-Pop': 'ORD51-C4', 'Alt-Svc': 'h3=":443"; ma=86400', 'X-Amz-Cf-Id': 'jO51qAI6E3dlU9tHboCzU6j36djtTsw7OrxuXkjr1SBom_OmocEdFg==', 'Vary': 'Origin'})
HTTP response body: error='Placement path not found from rui_location to targetIri'
```

We also get a `404` error when trying out the API endpoint at https://apps.humanatlas.io/api/#post-/v1/get-spatial-placement: 
![image](https://github.com/x-atlas-consortia/hra-api/assets/22821046/0e4de29e-1f9b-4241-913f-4245cc394cae)

# Updates for [hra-api-client-usecase](hra-api-client-usecase)

## `scene` parameter `ontology_terms` does not filter out organs?
`ontology_terms` is supposed to filter out any `SpatialSceneNodes`s that do not collide with the ontology ID provided. The filter seems to correctly remove tissue blocks not colliding with the onotloogy ID in the parameter but still returns all reference organs. Is this expected behavior?

## Running SPARQL query returns only a list with values: `['head', 'results']`
This causes downstream issues when trying to create a report as the `queryResponse` is not in the correct format. We assemble the query correctly, and it runs well in yasgui and on the HRA API documentation website. The query is:
```PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX ccf: <http://purl.org/ccf/>

SELECT DISTINCT (STR(?asLabel) as ?as_label) (STR(?qlabel) as ?cell_label) ?as_iri ?cell_iri WHERE {
  ?cell_iri ccf:ccf_located_in ?as_iri .
  ?cell_iri rdfs:label ?qlabel .
  ?as_iri rdfs:label ?asLabel .

  FILTER (?as_iri in (<http://purl.obolibrary.org/obo/UBERON_0004539>, <http://purl.obolibrary.org/obo/UBERON_0002015>, <http://purl.obolibrary.org/obo/UBERON_0001227>, <http://purl.obolibrary.org/obo/UBERON_0002189>, <http://purl.obolibrary.org/obo/UBERON_0008716>, <http://purl.obolibrary.org/obo/UBERON_0001284>, <http://purl.obolibrary.org/obo/UBERON_0006517>, <http://purl.obolibrary.org/obo/UBERON_0001226>, <http://purl.obolibrary.org/obo/UBERON_0004200>, <http://purl.obolibrary.org/obo/UBERON_0001224>, <http://purl.obolibrary.org/obo/UBERON_0002113>, <http://purl.obolibrary.org/obo/UBERON_0000362>, <http://purl.obolibrary.org/obo/UBERON_0000056>, <http://purl.obolibrary.org/obo/UBERON_0001228>, <http://purl.obolibrary.org/obo/UBERON_0001225>, <http://purl.obolibrary.org/obo/UBERON_0013702>, <http://purl.obolibrary.org/obo/UBERON_0001223>, <http://purl.obolibrary.org/obo/UBERON_0004538>))

}
```