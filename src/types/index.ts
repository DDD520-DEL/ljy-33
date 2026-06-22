export type StallStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

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
  reservedByReservationId?: string;
  reservedUntil?: number;
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

export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed';

export interface WorkOrder {
  id: string;
  stallId: string;
  floorId: string;
  stallNumber: number;
  floorNumber: number;
  floorName: string;
  createdAt: number;
  completedAt?: number;
  status: WorkOrderStatus;
  reason: string;
  responseMinutes?: number;
}

export interface WorkOrderStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  avgResponseMinutes: number;
  todayOrders: number;
  todayCompleted: number;
}

export interface StallDurationRank {
  stallId: string;
  stallNumber: number;
  floorId: string;
  floorNumber: number;
  floorName: string;
  avgDurationMinutes: number;
  totalUsageCount: number;
  totalDurationMinutes: number;
}

export interface FloorTrendData {
  floorId: string;
  floorNumber: number;
  floorName: string;
  data: TrendPoint[];
}

export interface FloorPeakData {
  floorId: string;
  floorNumber: number;
  floorName: string;
  data: PeakPeriod[];
}

export interface FloorDailyUsage {
  floorId: string;
  floorNumber: number;
  floorName: string;
  avgDailyUsage: number;
  totalUsage: number;
  maxDailyUsage: number;
  avgOccupancyRate: number;
}

export interface FloorComparisonData {
  trends: FloorTrendData[];
  peaks: FloorPeakData[];
  dailyUsage: FloorDailyUsage[];
}

export type ReservationStatus = 'pending' | 'fulfilled' | 'cancelled' | 'expired';

export const RESERVATION_TIMEOUT_MINUTES = 30;

export interface Reservation {
  id: string;
  floorId: string;
  floorNumber: number;
  floorName: string;
  visitorName: string;
  timeSlot: string;
  status: ReservationStatus;
  createdAt: number;
  fulfilledAt?: number;
  cancelledAt?: number;
  queuePosition: number;
  assignedStallId?: string;
  assignedStallNumber?: number;
}
