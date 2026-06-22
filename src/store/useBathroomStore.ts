import { create } from 'zustand';
import type { FloorWithStatus, Stall, StallStatus, FloorQueue, QueueItem, AlertRecord, WorkOrder, WorkOrderStats, Reservation, StallStatusLog, SmartRecommendation, Review, FloorReviewSummary } from '../types';
import {
  getAllFloors,
  getFloorStatus,
  updateStallStatus as apiUpdateStallStatus,
  getFloorQueue as apiGetFloorQueue,
  joinQueue as apiJoinQueue,
  leaveQueue as apiLeaveQueue,
  checkAlerts,
  getWorkOrders as apiGetWorkOrders,
  getWorkOrderStats as apiGetWorkOrderStats,
  getFloorReservations as apiGetFloorReservations,
  createReservation as apiCreateReservation,
  cancelReservation as apiCancelReservation,
  getVisitorReservations as apiGetVisitorReservations,
  getStallStatusLogs as apiGetStallStatusLogs,
  getSmartRecommendation as apiGetSmartRecommendation,
  createReview as apiCreateReview,
  getReviewsByFloor as apiGetReviewsByFloor,
  getFloorReviewSummary as apiGetFloorReviewSummary,
  getAllFloorReviewSummaries as apiGetAllFloorReviewSummaries,
} from '../utils/api';

interface BathroomState {
  floors: FloorWithStatus[];
  currentFloor: FloorWithStatus | null;
  currentQueue: FloorQueue | null;
  loading: boolean;
  queueLoading: boolean;
  error: string | null;
  alerts: AlertRecord[];
  showAlertModal: boolean;
  currentAlert: AlertRecord | null;
  currentAlertCount: number;
  workOrders: WorkOrder[];
  workOrderStats: WorkOrderStats | null;
  workOrdersLoading: boolean;
  reservations: Reservation[];
  reservationsLoading: boolean;
  stallStatusLogs: StallStatusLog[];
  stallStatusLogsLoading: boolean;
  smartRecommendation: SmartRecommendation | null;
  smartRecommendationLoading: boolean;
  reviews: Review[];
  reviewsLoading: boolean;
  floorReviewSummary: FloorReviewSummary | null;
  allFloorReviewSummaries: FloorReviewSummary[];
  reviewSummariesLoading: boolean;
  fetchFloors: () => Promise<void>;
  fetchFloorStatus: (floorId: string) => Promise<void>;
  fetchFloorQueue: (floorId: string) => Promise<void>;
  updateStallStatus: (stallId: string, status: StallStatus) => Promise<void>;
  joinQueue: (floorId: string, visitorName: string) => Promise<QueueItem>;
  leaveQueue: (queueId: string) => Promise<void>;
  startPolling: (floorId?: string) => void;
  stopPolling: () => void;
  clearError: () => void;
  showAlert: (alert: AlertRecord) => void;
  dismissAlert: () => void;
  checkForAlerts: () => Promise<void>;
  processNewAlerts: (newAlerts?: AlertRecord[]) => void;
  fetchWorkOrders: () => Promise<void>;
  fetchWorkOrderStats: (days?: number) => Promise<void>;
  fetchFloorReservations: (floorId: string) => Promise<void>;
  fetchVisitorReservations: (visitorName: string) => Promise<void>;
  createReservation: (floorId: string, visitorName: string, timeSlot: string) => Promise<Reservation>;
  cancelReservation: (reservationId: string) => Promise<void>;
  fetchStallStatusLogs: (floorId: string, limit?: number) => Promise<void>;
  fetchSmartRecommendation: (days?: number) => Promise<void>;
  createReview: (floorId: string, visitorName: string, cleanliness: number, odor: number, facilities: number, comment?: string, stallId?: string, stallNumber?: number) => Promise<Review>;
  fetchReviewsByFloor: (floorId: string, limit?: number, days?: number) => Promise<void>;
  fetchFloorReviewSummary: (floorId: string, days?: number) => Promise<void>;
  fetchAllFloorReviewSummaries: (days?: number) => Promise<void>;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;
const alertedStallIds = new Set<string>();

export const useBathroomStore = create<BathroomState>((set, get) => ({
  floors: [],
  currentFloor: null,
  currentQueue: null,
  loading: false,
  queueLoading: false,
  error: null,
  alerts: [],
  showAlertModal: false,
  currentAlert: null,
  currentAlertCount: 0,
  workOrders: [],
  workOrderStats: null,
  workOrdersLoading: false,
  reservations: [],
  reservationsLoading: false,
  stallStatusLogs: [],
  stallStatusLogsLoading: false,
  smartRecommendation: null,
  smartRecommendationLoading: false,
  reviews: [],
  reviewsLoading: false,
  floorReviewSummary: null,
  allFloorReviewSummaries: [],
  reviewSummariesLoading: false,

  processNewAlerts: (newAlerts?: AlertRecord[]) => {
    if (!newAlerts || newAlerts.length === 0) return;

    const { alerts } = get();
    const unshownAlerts = newAlerts.filter(
      (alert) => !alertedStallIds.has(alert.stallId)
    );

    if (unshownAlerts.length > 0) {
      unshownAlerts.forEach((alert) => alertedStallIds.add(alert.stallId));
      const updatedAlerts = [...alerts, ...unshownAlerts];
      const currentCount = updatedAlerts.filter((a) => !a.resolved).length;

      set({
        alerts: updatedAlerts,
        currentAlertCount: currentCount,
        currentAlert: unshownAlerts[0],
        showAlertModal: true,
      });
    }
  },

  fetchFloors: async () => {
    set({ loading: true, error: null });
    try {
      const { data: floors, newAlerts } = await getAllFloors();
      set({ floors, loading: false });
      get().processNewAlerts(newAlerts);

      const currentAbnormalCount = floors.reduce(
        (count, floor) =>
          count + floor.stalls.filter((s) => s.isAbnormal).length,
        0
      );
      set({ currentAlertCount: currentAbnormalCount });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchFloorStatus: async (floorId: string) => {
    set({ loading: true, error: null });
    try {
      const { data: floor, newAlerts } = await getFloorStatus(floorId);
      set({ currentFloor: floor, loading: false });
      get().processNewAlerts(newAlerts);
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchFloorQueue: async (floorId: string) => {
    set({ queueLoading: true });
    try {
      const { data: queue } = await apiGetFloorQueue(floorId);
      set({ currentQueue: queue, queueLoading: false });
    } catch {
      set({ queueLoading: false });
    }
  },

  checkForAlerts: async () => {
    try {
      const { data: newAlerts } = await checkAlerts();
      get().processNewAlerts(newAlerts);
    } catch (err) {
      console.error('Check alerts error:', err);
    }
  },

  updateStallStatus: async (stallId: string, status: StallStatus) => {
    try {
      const { data: updatedStall } = await apiUpdateStallStatus(stallId, status);
      
      const { currentFloor, floors, currentQueue } = get();
      
      if (currentFloor) {
        const updatedStalls = currentFloor.stalls.map((s) =>
          s.id === stallId ? updatedStall : s
        );
        const availableStalls = updatedStalls.filter((s) => s.status === 'available').length;
        const occupiedStalls = updatedStalls.filter((s) => s.status === 'occupied').length;
        set({
          currentFloor: {
            ...currentFloor,
            stalls: updatedStalls,
            availableStalls,
            occupiedStalls,
          },
        });
      }

      const updatedFloors = floors.map((floor) => {
        if (floor.stalls.some((s) => s.id === stallId)) {
          const updatedStalls = floor.stalls.map((s) =>
            s.id === stallId ? updatedStall : s
          ) as Stall[];
          const availableStalls = updatedStalls.filter((s) => s.status === 'available').length;
          const occupiedStalls = updatedStalls.filter((s) => s.status === 'occupied').length;
          return { ...floor, stalls: updatedStalls, availableStalls, occupiedStalls };
        }
        return floor;
      });
      set({ floors: updatedFloors });

      if (status === 'available') {
        alertedStallIds.delete(stallId);
        const { alerts } = get();
        const updatedAlerts = alerts.map((a) =>
          a.stallId === stallId ? { ...a, resolved: true, resolvedAt: Date.now() } : a
        );
        set({
          alerts: updatedAlerts,
          currentAlertCount: updatedAlerts.filter((a) => !a.resolved).length,
        });
      }

      if (currentQueue && status === 'available') {
        const floorId = currentQueue.floorId;
        await get().fetchFloorQueue(floorId);
      }

      await get().fetchStallStatusLogs(updatedStall.floorId);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  joinQueue: async (floorId: string, visitorName: string): Promise<QueueItem> => {
    const { data: item } = await apiJoinQueue(floorId, visitorName);
    await get().fetchFloorQueue(floorId);
    return item;
  },

  leaveQueue: async (queueId: string) => {
    const { currentQueue } = get();
    await apiLeaveQueue(queueId);
    if (currentQueue) {
      await get().fetchFloorQueue(currentQueue.floorId);
    }
  },

  startPolling: (floorId?: string) => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    pollInterval = setInterval(() => {
      const { fetchFloors, fetchFloorStatus, fetchFloorQueue, checkForAlerts } = get();
      if (floorId) {
        fetchFloorStatus(floorId);
        fetchFloorQueue(floorId);
      }
      fetchFloors();
      checkForAlerts();
    }, 5000);
  },

  stopPolling: () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  showAlert: (alert: AlertRecord) => {
    set({ currentAlert: alert, showAlertModal: true });
  },

  dismissAlert: () => {
    set({ showAlertModal: false, currentAlert: null });
  },

  fetchWorkOrders: async () => {
    set({ workOrdersLoading: true });
    try {
      const { data: orders } = await apiGetWorkOrders();
      set({ workOrders: orders, workOrdersLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, workOrdersLoading: false });
    }
  },

  fetchWorkOrderStats: async (days: number = 30) => {
    set({ workOrdersLoading: true });
    try {
      const { data: stats } = await apiGetWorkOrderStats(days);
      set({ workOrderStats: stats, workOrdersLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, workOrdersLoading: false });
    }
  },

  fetchFloorReservations: async (floorId: string) => {
    set({ reservationsLoading: true });
    try {
      const { data: reservations } = await apiGetFloorReservations(floorId);
      set({ reservations, reservationsLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, reservationsLoading: false });
    }
  },

  fetchVisitorReservations: async (visitorName: string) => {
    set({ reservationsLoading: true });
    try {
      const { data: reservations } = await apiGetVisitorReservations(visitorName);
      set({ reservations, reservationsLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, reservationsLoading: false });
    }
  },

  createReservation: async (floorId: string, visitorName: string, timeSlot: string): Promise<Reservation> => {
    const { data: reservation } = await apiCreateReservation(floorId, visitorName, timeSlot);
    const { reservations } = get();
    set({ reservations: [reservation, ...reservations] });
    return reservation;
  },

  cancelReservation: async (reservationId: string) => {
    const { data: cancelled } = await apiCancelReservation(reservationId);
    const { reservations } = get();
    set({
      reservations: reservations.map((r) =>
        r.id === cancelled.id ? cancelled : r
      ),
    });
  },

  fetchStallStatusLogs: async (floorId: string, limit: number = 50) => {
    set({ stallStatusLogsLoading: true });
    try {
      const { data: logs } = await apiGetStallStatusLogs(floorId, limit);
      set({ stallStatusLogs: logs, stallStatusLogsLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, stallStatusLogsLoading: false });
    }
  },

  fetchSmartRecommendation: async (days: number = 30) => {
    set({ smartRecommendationLoading: true });
    try {
      const { data: recommendation } = await apiGetSmartRecommendation(days);
      set({ smartRecommendation: recommendation, smartRecommendationLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, smartRecommendationLoading: false });
    }
  },

  createReview: async (
    floorId: string,
    visitorName: string,
    cleanliness: number,
    odor: number,
    facilities: number,
    comment?: string,
    stallId?: string,
    stallNumber?: number
  ): Promise<Review> => {
    const { data: review } = await apiCreateReview(
      floorId,
      visitorName,
      cleanliness,
      odor,
      facilities,
      comment,
      stallId,
      stallNumber
    );
    const { reviews } = get();
    set({ reviews: [review, ...reviews] });
    return review;
  },

  fetchReviewsByFloor: async (floorId: string, limit?: number, days?: number) => {
    set({ reviewsLoading: true });
    try {
      const { data: reviews } = await apiGetReviewsByFloor(floorId, limit, days);
      set({ reviews, reviewsLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, reviewsLoading: false });
    }
  },

  fetchFloorReviewSummary: async (floorId: string, days: number = 7) => {
    try {
      const { data: summary } = await apiGetFloorReviewSummary(floorId, days);
      set({ floorReviewSummary: summary });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchAllFloorReviewSummaries: async (days: number = 7) => {
    set({ reviewSummariesLoading: true });
    try {
      const { data: summaries } = await apiGetAllFloorReviewSummaries(days);
      set({ allFloorReviewSummaries: summaries, reviewSummariesLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, reviewSummariesLoading: false });
    }
  },
}));
