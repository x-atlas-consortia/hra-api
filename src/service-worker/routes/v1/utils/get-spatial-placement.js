import { getSpatialPlacement } from '../../../../library/v1/operations/get-spatial-placement.js';
import { getJsonBody, handler } from '../../../utils/request.js';

/**
 * Creates a route handler that generates the spatial placement of the rui_location in the request body relative to
 * the target_iri in the request body.
 */
export function getSpatialPlacementHandler() {
  return handler(async (req, res) => {
    const { target_iri, rui_location } = (await getJsonBody(req)) ?? {};
    const targetIri = target_iri || undefined;
    if (!targetIri) {
      res.text('Must provide a target_iri in the request body', { status: 400 });
      return;
    }
    if (!rui_location) {
      res.text('Must provide a rui_location in the request body', { status: 400 });
      return;
    }
    const result = await getSpatialPlacement(rui_location, targetIri, SPARQL_ENDPOINT);
    if (!result) {
      res.json({ error: 'Placement path not found from rui_location to targetIri' }, { status: 404 });
    } else {
      res.json(result);
    }
  });
}
