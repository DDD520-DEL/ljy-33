import { Router, type Request, type Response } from 'express';
import { updateStallStatus } from '../services/bathroomService.js';
import type { StallStatus } from '../../shared/types.js';

const router = Router();

router.put('/:id/status', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: StallStatus };

    if (!status || !['available', 'occupied', 'maintenance'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status. Must be available, occupied, or maintenance',
      });
      return;
    }

    const stall = updateStallStatus(id, status);

    if (!stall) {
      res.status(404).json({
        success: false,
        error: 'Stall not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: stall,
    });
  } catch (error) {
    console.error('Update stall status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stall status',
    });
  }
});

export default router;
