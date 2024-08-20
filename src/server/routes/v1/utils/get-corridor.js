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
      res.status(404).json({ error: 'Error getting corridors' });
    } else {
      // Ideally the type is 'model/gltf-binary', but in the API browser it doesn't look right.
      res.attachment('corridor.glb').type('application/octet-stream');
      res.send(Buffer.from(result, 'binary'));
    }
    return result;
  };
}
