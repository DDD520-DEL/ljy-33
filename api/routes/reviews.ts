import { Router, type Request, type Response } from 'express';
import {
  createReview,
  getReviewsByFloor,
  getRecentReviews,
  getFloorReviewSummary,
  getAllFloorReviewSummaries,
} from '../services/bathroomService.js';

const router = Router();

router.post('/', (req: Request, res: Response): void => {
  try {
    const { floorId, visitorName, cleanliness, odor, facilities, comment, stallId, stallNumber } = req.body;
    const review = createReview({
      floorId,
      visitorName,
      cleanliness: Number(cleanliness),
      odor: Number(odor),
      facilities: Number(facilities),
      comment,
      stallId,
      stallNumber: stallNumber ? Number(stallNumber) : undefined,
    });
    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(400).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

router.get('/floor/:floorId', (req: Request, res: Response): void => {
  try {
    const { floorId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;
    const reviews = getReviewsByFloor(floorId, limit, days);
    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Get reviews by floor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews',
    });
  }
});

router.get('/recent', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const floorId = req.query.floorId as string | undefined;
    const reviews = getRecentReviews(days, floorId);
    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error('Get recent reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent reviews',
    });
  }
});

router.get('/summary/:floorId', (req: Request, res: Response): void => {
  try {
    const { floorId } = req.params;
    const days = parseInt(req.query.days as string) || 7;
    const summary = getFloorReviewSummary(floorId, days);
    if (!summary) {
      res.status(404).json({
        success: false,
        error: 'Floor not found',
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get floor review summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get floor review summary',
    });
  }
});

router.get('/summaries', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const summaries = getAllFloorReviewSummaries(days);
    res.status(200).json({
      success: true,
      data: summaries,
    });
  } catch (error) {
    console.error('Get all floor review summaries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get review summaries',
    });
  }
});

export default router;
