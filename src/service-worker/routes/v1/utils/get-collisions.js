import { getCollisions } from '../../../../library/operations/v1.js';
import { getJsonBody, handler } from '../../../utils/request.js';

/**
 * Creates a route handler that generates mesh-based collisions for the rui_location in the request body.
 */
export function getCollisionsHandler() {
  return handler(async (req, res) => {
    const ruiLocation = await getJsonBody(req);
    if (ruiLocation?.['@type'] !== 'SpatialEntity') {
      res.text('Must provide a rui_location in the request body', { status: 400 });
      return;
    }
    const result = await getCollisions(ruiLocation);
    if (!result) {
      res.json({ error: 'Error getting collisions' }, { status: 404 });
    } else {
      res.json(result);
    }
  });
}
