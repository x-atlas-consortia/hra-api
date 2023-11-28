import { Wayne } from '@jcubic/wayne';
import hraPopRoutes from './routes/hra-pop.js';
import v1Routes from './routes/v1';

const app = new Wayne();

v1Routes(app);
hraPopRoutes(app);

export default app;
