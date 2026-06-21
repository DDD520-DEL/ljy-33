export type StallStatus = 'available' | 'occupied' | 'maintenance';

export const TIMEOUT_THRESHOLD_MINUTES = 20;
export const TIMEOUT_THRESHOLD_MS = TIMEOUT_THRESHOLD_MINUTES * 60 * 1000;

export interface Stall {
  id: string;
  floorId: string;
  stallNumber: number;
  status: StallStatus;
  lastUpdated: number;
  occupiedStartTime?: number;
  isAbnormal?: boolean;
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

export interface UsageRecord {
  id: string;
  stallId: string;
  floorId: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  isAbnormal: boolean;
}

export interface AlertRecord {
  id: string;
  stallId: string;
  floorId: string;
  stallNumber: number;
  floorNumber: number;
  floorName: string;
  startTime: number;
  alertedAt: number;
  resolved: boolean;
  resolvedAt?: number;
  durationMinutes: number;
}

export interface AbnormalStats {
  totalAbnormalCount: number;
  todayAbnormalCount: number;
  currentAbnormalCount: number;
  avgDurationMinutes: number;
  abnormalRecords: AlertRecord[];
}
