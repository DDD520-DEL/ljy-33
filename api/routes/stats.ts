import { Router, type Request, type Response } from 'express';
import {
  getHeatmapData,
  getTrendData,
  getPeakPeriods,
  getAbnormalStats,
  getStallDurationRanking,
  getFloorComparisonData,
  getFloorTrendData,
  getFloorPeakPeriods,
  getFloorDailyUsage,
  getSmartRecommendation,
  getFloorHourlyOccupancy,
} from '../services/bathroomService.js';

const router = Router();

router.get('/heatmap', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const floorId = req.query.floorId as string | undefined;
    const data = getHeatmapData(days, floorId);
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
    const floorId = req.query.floorId as string | undefined;
    const data = getTrendData(days, floorId);
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
    const floorId = req.query.floorId as string | undefined;
    const days = parseInt(req.query.days as string) || 30;
    const data = getPeakPeriods(days, floorId);
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

router.get('/floor-comparison', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const floorIdsParam = req.query.floorIds as string | undefined;
    const floorIds = floorIdsParam ? floorIdsParam.split(',') : undefined;
    const data = getFloorComparisonData(days, floorIds);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get floor comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get floor comparison data',
    });
  }
});

router.get('/floor-trend', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const floorIdsParam = req.query.floorIds as string | undefined;
    const floorIds = floorIdsParam ? floorIdsParam.split(',') : undefined;
    const data = getFloorTrendData(days, floorIds);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get floor trend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get floor trend data',
    });
  }
});

router.get('/floor-peak', (req: Request, res: Response): void => {
  try {
    const floorIdsParam = req.query.floorIds as string | undefined;
    const floorIds = floorIdsParam ? floorIdsParam.split(',') : undefined;
    const data = getFloorPeakPeriods(floorIds);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get floor peak periods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get floor peak periods',
    });
  }
});

router.get('/floor-daily-usage', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const floorIdsParam = req.query.floorIds as string | undefined;
    const floorIds = floorIdsParam ? floorIdsParam.split(',') : undefined;
    const data = getFloorDailyUsage(days, floorIds);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get floor daily usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get floor daily usage',
    });
  }
});

router.get('/hourly-occupancy', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = getFloorHourlyOccupancy(days);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get hourly occupancy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hourly occupancy data',
    });
  }
});

router.get('/smart-recommendation', (req: Request, res: Response): void => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = getSmartRecommendation(days);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get smart recommendation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get smart recommendation',
    });
  }
});

export default router;
