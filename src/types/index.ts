export type StallStatus = 'available' | 'occupied' | 'maintenance';

export interface Stall {
  id: string;
  floorId: string;
  stallNumber: number;
  status: StallStatus;
  lastUpdated: number;
}

export interface Floor {
  id: string;
  floorNumber: number;
  floorName: string;
  totalStalls: number;
}

export interface FloorWithStatus extends Floor {
  availableStalls: number;
  occupiedStalls: number;
  stalls: Stall[];
}

export interface HeatmapPoint {
  hour: number;
  weekday: number;
  count: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface PeakPeriod {
  period: string;
  avgCount: number;
}

export interface QueueItem {
  id: string;
  floorId: string;
  visitorName: string;
  joinedAt: number;
  position: number;
}

export interface FloorQueue {
  floorId: string;
  items: QueueItem[];
  count: number;
}
