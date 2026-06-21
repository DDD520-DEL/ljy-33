import { create } from 'zustand';
import type { FloorWithStatus, Stall, StallStatus } from '../types';
import { getAllFloors, getFloorStatus, updateStallStatus as apiUpdateStallStatus } from '../utils/api';

interface BathroomState {
  floors: FloorWithStatus[];
  currentFloor: FloorWithStatus | null;
  loading: boolean;
  error: string | null;
  fetchFloors: () => Promise<void>;
  fetchFloorStatus: (floorId: string) => Promise<void>;
  updateStallStatus: (stallId: string, status: StallStatus) => Promise<void>;
  startPolling: (floorId?: string) => void;
  stopPolling: () => void;
  clearError: () => void;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

export const useBathroomStore = create<BathroomState>((set, get) => ({
  floors: [],
  currentFloor: null,
  loading: false,
  error: null,

  fetchFloors: async () => {
    set({ loading: true, error: null });
    try {
      const floors = await getAllFloors();
      set({ floors, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchFloorStatus: async (floorId: string) => {
    set({ loading: true, error: null });
    try {
      const floor = await getFloorStatus(floorId);
      set({ currentFloor: floor, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateStallStatus: async (stallId: string, status: StallStatus) => {
    try {
      const updatedStall = await apiUpdateStallStatus(stallId, status);
      
      const { currentFloor, floors } = get();
      
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
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  startPolling: (floorId?: string) => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    pollInterval = setInterval(() => {
      const { fetchFloors, fetchFloorStatus } = get();
      if (floorId) {
        fetchFloorStatus(floorId);
      }
      fetchFloors();
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
}));
