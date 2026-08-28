import { Router, Request, Response } from 'express';
import userRoutes from '../modules/user';
import commodityRoutes from '../modules/commodity';
import srpRoutes from '../modules/srp';
import priceRecordRoutes from '../modules/price-record';
import reportRoutes from '../modules/report';
import forecastRoutes from '../modules/forecast';
import storeRoutes from '../modules/store';
import dashboardRoutes from '../modules/dashboard';
import auditLogRoutes from '../modules/audit-log';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'PresyoSerbisyo' });
});

router.use('/users', userRoutes);
router.use('/commodities', commodityRoutes);
router.use('/srps', srpRoutes);
router.use('/price-records', priceRecordRoutes);
router.use('/reports', reportRoutes);
router.use('/forecasts', forecastRoutes);
router.use('/stores', storeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
