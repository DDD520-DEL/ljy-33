import { Router, type Request, type Response } from 'express';
import {
  getAllFloors,
  getFloorById,
} from '../services/bathroomService.js';

const router = Router();

router.get('/', (req: Request, res: Response): void => {
  try {
    const floors = getAllFloors();
    res.status(200).json({
      success: true,
      data: floors,
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
    const floor = getFloorById(id);

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
    });
  } catch (error) {
    console.error('Get floor status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get floor status',
    });
  }
});

export default router;
