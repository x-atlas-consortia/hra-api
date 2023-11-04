import { Wayne } from '@jcubic/wayne';
import ctpopRoutes from './routes/ctpop.js';
import v1Routes from './routes/v1';

const app = new Wayne();

v1Routes(app);
ctpopRoutes(app);

export default app;
