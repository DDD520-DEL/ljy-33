import { Router, type Request, type Response } from 'express';
import {
  getHeatmapData,
  getTrendData,
  getPeakPeriods,
  getAbnormalStats,
  getStallDurationRanking,
} from '../services/bathroomService.js';

const router = Router();

router.get('/heatmap', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = getHeatmapData(days);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get heatmap error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get heatmap data',
    });
  }
});

router.get('/trend', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = getTrendData(days);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get trend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trend data',
    });
  }
});

router.get('/peak', (req: Request, res: Response): void => {
  try {
    const data = getPeakPeriods();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get peak periods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get peak periods',
    });
  }
});

router.get('/abnormal', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = getAbnormalStats(days);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get abnormal stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get abnormal stats',
    });
  }
});

router.get('/stall-duration', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const floorId = req.query.floorId as string | undefined;
    const data = getStallDurationRanking(days, floorId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get stall duration ranking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stall duration ranking',
    });
  }
});

export default router;
