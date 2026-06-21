import { Router, type Request, type Response } from 'express';
import {
  getFloorQueue,
  joinQueue,
  leaveQueue,
} from '../services/bathroomService.js';

const router = Router();

router.get('/:floorId', (req: Request, res: Response): void => {
  try {
    const { floorId } = req.params;
    const queue = getFloorQueue(floorId);

    res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue',
    });
  }
});

router.post('/:floorId/join', (req: Request, res: Response): void => {
  try {
    const { floorId } = req.params;
    const { visitorName } = req.body as { visitorName: string };

    if (!visitorName || visitorName.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Visitor name is required',
      });
      return;
    }

    const item = joinQueue(floorId, visitorName.trim());

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Join queue error:', error);
    const message = error instanceof Error ? error.message : 'Failed to join queue';
    const statusCode = message === 'Floor not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

router.delete('/:queueId', (req: Request, res: Response): void => {
  try {
    const { queueId } = req.params;
    const item = leaveQueue(queueId);

    if (!item) {
      res.status(404).json({
        success: false,
        error: 'Queue item not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Leave queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave queue',
    });
  }
});

export default router;
