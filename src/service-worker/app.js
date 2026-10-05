import { Wayne } from '@jcubic/wayne';
import hraPopRoutes from './routes/hra-pop.js';
import v1Routes from './routes/v1/index.js';

// The ds-graph routes are not available in the service worker: they need node (hra-rui-locations-processor)
const app = new Wayne();

v1Routes(app);
hraPopRoutes(app);

export default app;
