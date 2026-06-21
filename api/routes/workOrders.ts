import { Router, type Request, type Response } from 'express';
import { getWorkOrders, getWorkOrderStats } from '../services/bathroomService.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const data = getWorkOrders();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get work orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get work orders',
    });
  }
});

router.get('/stats', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = getWorkOrderStats(days);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get work order stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get work order stats',
    });
  }
});

export default router;
