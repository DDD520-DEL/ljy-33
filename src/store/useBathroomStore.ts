import { create } from 'zustand';
import type { FloorWithStatus, Stall, StallStatus, FloorQueue, QueueItem, AlertRecord } from '../types';
import {
  getAllFloors,
  getFloorStatus,
  updateStallStatus as apiUpdateStallStatus,
  getFloorQueue as apiGetFloorQueue,
  joinQueue as apiJoinQueue,
  leaveQueue as apiLeaveQueue,
  checkAlerts,
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
}));
