import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes.js';

export const apiRouter = Router();
apiRouter.use('/health', healthRouter);

import { authRouter } from '../modules/auth/auth.routes.js';
import { adminRouter } from '../modules/admin/admin.routes.js';
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
