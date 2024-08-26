import { getCorridor } from '../../../../library/operations/v1';

/**
 * Create an Express route handler that generates a corridor for a given rui_location.
 *
 * @param {Object} req - The Express request object containing the rui_location in the request body.
 * @param {Object} res - The Express response object used to send the generated collisions JSON.
 * @param {function} _next - The Express next middleware function (not used in this context).
 */
export function getCorridorHandler() {
  return async (req, res, _next) => {
    const rui_location = req.body;

    if (rui_location?.['@type'] !== 'SpatialEntity') {
      res.status(404).send('Must provide a rui_location in the request body');
      return;
    }
    const result = await getCorridor(rui_location);
    if (!result) {
      res.status(404).json({ error: 'Error getting collisions' });
    } else {
      res.set('content-type', 'model/gltf-binary').send(result);
    }
  };
}