import {
  atlasD2kRegistrations,
  gtexRegistrations,
  hubmapRegistrations,
  sennetRegistrations,
} from '../../library/operations/ds-graph.js';

function forwardFilteredRequest(method) {
  return async (req, res) => {
    try {
      const query = getQuery(req.url);
      const token = query.token ?? undefined;
      const result = await method(token);
      res.json(result);
    } catch (error) {
      // Handle errors here
      console.error('Error:', error.message);
      res.status(500).send('Internal Server Error');
    }
  };
}

function routes(app) {
  return app
    .get('/api/ds-graph/atlas-d2k', forwardFilteredRequest(atlasD2kRegistrations))
    .get('/api/ds-graph/gtex', forwardFilteredRequest(gtexRegistrations))
    .get('/api/ds-graph/hubmap', forwardFilteredRequest(hubmapRegistrations))
    .get('/api/ds-graph/sennet', forwardFilteredRequest(sennetRegistrations));
}

export default routes;
