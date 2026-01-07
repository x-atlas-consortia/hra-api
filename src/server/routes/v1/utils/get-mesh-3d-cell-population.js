import { getMesh3dCellPopulation } from '../../../../library/v1/operations/mesh-3d-cell-population.js';

/**
 * Create an Express route handler that generates a cell population.
 *
 * @param {Object} req - The Express request object containing the file, num_nodes, and node_distribution in the request body.
 * @param {Object} res - The Express response object used to send the generated spatial placement JSON.
 * @param {function} _next - The Express next middleware function (not used in this context).
 */
export function getMesh3dCellPopulationHandler() {
  return async (req, res, _next) => {
    const { file, num_nodes, node_distribution } = req.body ?? {};

    if (!file) {
      res.status(404).send('Must provide a file in the request body');
      return;
    }
    if (!num_nodes) {
      res.status(404).send('Must provide a num_nodes in the request body');
      return;
    }
    if (!node_distribution) {
      res.status(404).send('Must provide a node_distribution in the request body');
      return;
    }
    const result = await getMesh3dCellPopulation(req.body);
    if (!result) {
      res.status(404).json({ error: 'Error generating cell population' });
    } else {
      res.type('text/csv').send(result);
    }
  };
}
