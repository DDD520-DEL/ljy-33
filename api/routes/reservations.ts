import { Router, type Request, type Response } from 'express';
import {
  getFloorReservations,
  getVisitorReservations,
  createReservation,
  cancelReservationById,
  expireAllReservations,
} from '../services/bathroomService.js';

const router = Router();

router.get('/floor/:floorId', (req: Request, res: Response): void => {
  try {
    const { floorId } = req.params;
    const reservations = getFloorReservations(floorId);

    res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error('Get floor reservations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reservations',
    });
  }
});

router.get('/visitor/:visitorName', (req: Request, res: Response): void => {
  try {
    const { visitorName } = req.params;
    const reservations = getVisitorReservations(decodeURIComponent(visitorName));

    res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    console.error('Get visitor reservations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reservations',
    });
  }
});

router.post('/', (req: Request, res: Response): void => {
  try {
    const { floorId, visitorName, timeSlot } = req.body as {
      floorId: string;
      visitorName: string;
      timeSlot: string;
    };

    if (!floorId || !visitorName || !timeSlot) {
      res.status(400).json({
        success: false,
        error: 'floorId, visitorName and timeSlot are required',
      });
      return;
    }

    const reservation = createReservation(floorId, visitorName, timeSlot);

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create reservation';
    const statusCode = message === '楼层不存在' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

router.delete('/:reservationId', (req: Request, res: Response): void => {
  try {
    const { reservationId } = req.params;
    const reservation = cancelReservationById(reservationId);

    if (!reservation) {
      res.status(404).json({
        success: false,
        error: 'Reservation not found or already processed',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel reservation',
    });
  }
});

router.post('/expire', (req: Request, res: Response): void => {
  try {
    const expired = expireAllReservations();
    res.status(200).json({
      success: true,
      data: expired,
    });
  } catch (error) {
    console.error('Expire reservations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to expire reservations',
    });
  }
});

export default router;
