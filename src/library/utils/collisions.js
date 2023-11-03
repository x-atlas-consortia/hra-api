
const DEFAULT_ENDPOINT='https://pfn8zf2gtu.us-east-2.awsapprunner.com/get-collisions';

export async function getCollisions(ruiLocation, endpoint=DEFAULT_ENDPOINT) {
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ruiLocation),
  });
  if (resp.ok) {
    return await resp.json();
  } else {
    return [];
  }
}
