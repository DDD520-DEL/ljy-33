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

export interface UsageRecord {
  id: string;
  stallId: string;
  floorId: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
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
