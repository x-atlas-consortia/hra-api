const DEFAULT_ENDPOINT = 'https://apps.humanatlas.io/api/v1/corridor';

export async function getCorridor(ruiLocation, endpoint = DEFAULT_ENDPOINT) {
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'model/gltf-binary' },
    body: JSON.stringify(ruiLocation),
  });
  if (resp.ok) {
    return await resp.arrayBuffer();
  } else {
    return undefined;
  }
}
