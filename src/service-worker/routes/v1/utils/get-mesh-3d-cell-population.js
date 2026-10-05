import { getMesh3dCellPopulation } from '../../../../library/v1/operations/mesh-3d-cell-population.js';
import { getJsonBody, handler } from '../../../utils/request.js';

/**
 * Creates a route handler that generates a cell population (CSV) for the file, num_nodes, and node_distribution in
 * the request body.
 */
export function getMesh3dCellPopulationHandler() {
  return handler(async (req, res) => {
    const request = await getJsonBody(req);
    const { file, num_nodes, node_distribution } = request ?? {};
    if (!file) {
      res.text('Must provide a file in the request body', { status: 400 });
      return;
    }
    if (!num_nodes) {
      res.text('Must provide a num_nodes in the request body', { status: 400 });
      return;
    }
    if (!node_distribution) {
      res.text('Must provide a node_distribution in the request body', { status: 400 });
      return;
    }
    const result = await getMesh3dCellPopulation(request);
    if (!result) {
      res.json({ error: 'Error generating cell population' }, { status: 404 });
    } else {
      res.send(result, { type: 'text/csv' });
    }
  });
}
