Example notebooks showcasing how to use the HRA-API from Python via the [hra-api-client](https://pypi.org/project/hra-api-client/) module.

# Updates for [hra-api-client-usage](hra-api-client-usage)

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
None.