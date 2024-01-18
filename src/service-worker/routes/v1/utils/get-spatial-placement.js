import { getSpatialPlacement } from '../../../../library/v1/operations/get-spatial-placement';

/**
 * Create an Express route handler that generates spatial placement information for a given target.
 * This information includes the source, target, placement date, translation, rotation, and scaling data.
 *
 * @param {Object} req - The Express request object containing the target_iri and rui_location in the request body.
 * @param {Object} res - The Express response object used to send the generated spatial placement JSON.
 * @param {function} _next - The Express next middleware function (not used in this context).
 */
export function getSpatialPlacementHandler() {
  return async (req, res, _next) => {
    const { target_iri, rui_location } = req.body;
    const targetIri = target_iri || undefined;

    if (!targetIri) {
      res.status(404).send('Must provide a target_iri in the request body');
      return;
    }
    if (!rui_location) {
      res.status(404).send('Must provide a rui_location in the request body');
      return;
    }
    const result = await getSpatialPlacement(rui_location, targetIri, SPARQL_ENDPOINT);
    if (!result) {
      res.status(404).json({ 'error': 'Placement path not found from rui_location to targetIri' });
    } else {
      res.json(result);
    }
  };
}
