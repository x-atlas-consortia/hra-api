import { getCorridor } from '../../../../library/operations/v1.js';
import { getJsonBody, handler } from '../../../utils/request.js';

/**
 * Creates a route handler that generates a corridor (GLB) for the rui_location in the request body.
 */
export function getCorridorHandler() {
  return handler(async (req, res) => {
    const ruiLocation = await getJsonBody(req);
    if (ruiLocation?.['@type'] !== 'SpatialEntity') {
      res.text('Must provide a rui_location in the request body', { status: 400 });
      return;
    }
    const result = await getCorridor(ruiLocation);
    if (!result) {
      res.json({ error: 'Error getting corridors' }, { status: 404 });
    } else {
      res.send(result, { type: 'model/gltf-binary' });
    }
  });
}
