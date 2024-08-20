const DEFAULT_ENDPOINT = 'https://apps.humanatlas.io/api/v1/mesh-3d-cell-population';

export async function getMesh3dCellPopulation(request, endpoint = DEFAULT_ENDPOINT) {
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (resp.ok) {
    return await resp.text();
  } else {
    return 'x,y,z,Cell Type';
  }
}
