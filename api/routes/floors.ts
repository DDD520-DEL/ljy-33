import { Router, type Request, type Response } from 'express';
import {
  getAllFloors,
  getFloorById,
  checkForNewAlerts,
  getStallStatusLogs,
} from '../services/bathroomService.js';
import type { AlertRecord } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const { floors, newAlerts } = getAllFloors();
    res.status(200).json({
      success: true,
      data: floors,
      newAlerts,
    });
  } catch (error) {
    console.error('Get floors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get floors',
    });
  }
});

router.get('/:id/status', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { floor, newAlerts } = getFloorById(id);

    if (!floor) {
      res.status(404).json({
        success: false,
        error: 'Floor not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: floor,
      newAlerts,
    });
  } catch (error) {
    console.error('Get floor status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get floor status',
    });
  }
});

router.get('/alerts/check', (req: Request, res: Response): void => {
  try {
    const newAlerts = checkForNewAlerts();
    res.status(200).json({
      success: true,
      data: newAlerts,
    });
  } catch (error) {
    console.error('Check alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check alerts',
    });
  }
});

router.get('/:id/status-logs', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const logs = getStallStatusLogs(id, limit);
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Get stall status logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stall status logs',
    });
  }
});

export default router;
