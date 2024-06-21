import md5 from 'md5';
import { startDatasetWork } from '../utils/dataset-graph/start-dataset-graph-work.js';

function isValidUrl(url) {
  try {
    const resource = new URL(url);
    if (!(resource.protocol === 'http:' || resource.protocol === 'https:')) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

export async function createSessionToken(request, endpoint) {
  const token = md5(JSON.stringify(request));

  if (request?.dataSources?.length > 0) {
    if (!request.dataSources.every(isValidUrl)) {
      return { error: 'One or more data sources had an invalid URL.' };
    }

    await startDatasetWork(token, request, endpoint);
  }

  return { token };
}
