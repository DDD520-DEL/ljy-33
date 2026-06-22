import {
  getFloors,
  getStalls,
  getUsageRecords,
  updateStallStatus as dbUpdateStallStatus,
  initializeData,
  getQueueByFloor as dbGetQueueByFloor,
  addToQueue as dbAddToQueue,
  removeFromQueue as dbRemoveFromQueue,
  isVisitorInQueue as dbIsVisitorInQueue,
  checkTimeoutStalls,
  getAlerts,
  getUnresolvedAlerts,
  getWorkOrders as dbGetWorkOrders,
  getWorkOrderStats as dbGetWorkOrderStats,
  getReservations as dbGetReservations,
  getReservationsByFloor as dbGetReservationsByFloor,
  getReservationsByVisitor as dbGetReservationsByVisitor,
  createReservation as dbCreateReservation,
  cancelReservation as dbCancelReservation,
  fulfillReservation as dbFulfillReservation,
  getFirstPendingReservation as dbGetFirstPendingReservation,
  expireReservations as dbExpireReservations,
  isVisitorAlreadyReserved as dbIsVisitorAlreadyReserved,
  releaseExpiredReservedStalls as dbReleaseExpiredReservedStalls,
} from '../db/database.js';
import { TIMEOUT_THRESHOLD_MS } from '../../shared/types.js';
import type {
  FloorWithStatus,
  Stall,
  StallStatus,
  HeatmapPoint,
  TrendPoint,
  PeakPeriod,
  FloorQueue,
  QueueItem,
  AlertRecord,
  AbnormalStats,
  WorkOrder,
  WorkOrderStats,
  StallDurationRank,
  FloorTrendData,
  FloorPeakData,
  FloorDailyUsage,
  FloorComparisonData,
  Reservation,
} from '../../shared/types.js';

export function getAllFloors(): { floors: FloorWithStatus[]; newAlerts: AlertRecord[] } {
  const newAlerts = checkTimeoutStalls();
  dbReleaseExpiredReservedStalls();
  dbExpireReservations();
  const floors = getFloors();
  const stalls = getStalls();

  const floorsWithStatus = floors.map((floor) => {
    const floorStalls = stalls.filter((s) => s.floorId === floor.id);
    const availableStalls = floorStalls.filter((s) => s.status === 'available').length;
    const occupiedStalls = floorStalls.filter((s) => s.status === 'occupied').length;

    return {
      ...floor,
      availableStalls,
      occupiedStalls,
      stalls: floorStalls,
    };
  });

  return { floors: floorsWithStatus, newAlerts };
}

export function getFloorById(floorId: string): { floor: FloorWithStatus | null; newAlerts: AlertRecord[] } {
  const { floors, newAlerts } = getAllFloors();
  return { floor: floors.find((f) => f.id === floorId) || null, newAlerts };
}

export function getStallsByFloor(floorId: string): Stall[] {
  checkTimeoutStalls();
  dbReleaseExpiredReservedStalls();
  dbExpireReservations();
  const stalls = getStalls();
  return stalls.filter((s) => s.floorId === floorId);
}

export function updateStallStatus(stallId: string, status: StallStatus): Stall | null {
  return dbUpdateStallStatus(stallId, status);
}

export function getHeatmapData(days: number = 30, floorId?: string): HeatmapPoint[] {
  const records = getUsageRecords();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  let filtered = records.filter((r) => r.startTime >= cutoff);
  if (floorId) {
    filtered = filtered.filter((r) => r.floorId === floorId);
  }

  const heatmap: Record<string, number> = {};

  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 7; d++) {
      heatmap[`${d}-${h}`] = 0;
    }
  }

  filtered.forEach((record) => {
    const date = new Date(record.startTime);
    const hour = date.getHours();
    const weekday = date.getDay();
    const key = `${weekday}-${hour}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  });

  const result: HeatmapPoint[] = [];
  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 7; d++) {
      result.push({
        hour: h,
        weekday: d,
        count: heatmap[`${d}-${h}`] || 0,
      });
    }
  }

  return result;
}

export function getTrendData(days: number = 30, floorId?: string): TrendPoint[] {
  const records = getUsageRecords();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  let filtered = records.filter((r) => r.startTime >= cutoff);
  if (floorId) {
    filtered = filtered.filter((r) => r.floorId === floorId);
  }

  const dailyCount: Record<string, number> = {};

  filtered.forEach((record) => {
    const date = new Date(record.startTime);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    dailyCount[dateStr] = (dailyCount[dateStr] || 0) + 1;
  });

  const result: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    result.push({
      date: dateStr,
      count: dailyCount[dateStr] || 0,
    });
  }

  return result;
}

export function getPeakPeriods(days: number = 30, floorId?: string): PeakPeriod[] {
  const records = getUsageRecords();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  let filtered = records.filter((r) => r.startTime >= cutoff);
  if (floorId) {
    filtered = filtered.filter((r) => r.floorId === floorId);
  }

  const periods = [
    { name: '早高峰 (8:00-10:00)', start: 8, end: 10 },
    { name: '午间高峰 (11:30-13:30)', start: 11, end: 14 },
    { name: '下午高峰 (14:00-16:00)', start: 14, end: 16 },
    { name: '晚高峰 (17:00-19:00)', start: 17, end: 19 },
  ];

  let weekdayCount = 0;
  const dailyCounts: Record<string, number[]> = {};
  periods.forEach((p) => {
    dailyCounts[p.name] = [];
  });

  const dailyRecords: Record<string, number[]> = {};
  filtered.forEach((record) => {
    const date = new Date(record.startTime);
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) return;

    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!dailyRecords[dateStr]) {
      dailyRecords[dateStr] = [];
    }
    dailyRecords[dateStr].push(date.getHours());
  });

  weekdayCount = Object.keys(dailyRecords).length || 1;

  return periods.map((period) => {
    let count = 0;
    Object.values(dailyRecords).forEach((hours) => {
      hours.forEach((h) => {
        if (h >= period.start && h < period.end) {
          count++;
        }
      });
    });

    return {
      period: period.name,
      avgCount: Math.round((count / weekdayCount) * 10) / 10,
    };
  });
}

export function getFloorQueue(floorId: string): FloorQueue {
  return dbGetQueueByFloor(floorId);
}

export function joinQueue(floorId: string, visitorName: string): QueueItem {
  const floor = getFloorById(floorId);
  if (!floor) {
    throw new Error('Floor not found');
  }

  if (!visitorName || visitorName.trim().length === 0) {
    throw new Error('Visitor name is required');
  }

  if (dbIsVisitorInQueue(floorId, visitorName.trim())) {
    throw new Error('您已在排队中');
  }

  return dbAddToQueue(floorId, visitorName.trim());
}

export function leaveQueue(queueId: string): QueueItem | null {
  return dbRemoveFromQueue(queueId);
}

export function getAbnormalStats(days: number = 30): AbnormalStats {
  const alerts = getAlerts();
  const usageRecords = getUsageRecords();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTime = todayStart.getTime();

  const filteredAlerts = alerts.filter((a) => a.alertedAt >= cutoff);
  const todayAlerts = alerts.filter((a) => a.alertedAt >= todayStartTime);
  const unresolvedAlerts = getUnresolvedAlerts();

  const abnormalUsageRecords = usageRecords.filter(
    (r) => r.isAbnormal && r.startTime >= cutoff
  );

  const totalAbnormalCount = abnormalUsageRecords.length;
  const todayAbnormalCount = abnormalUsageRecords.filter(
    (r) => r.startTime >= todayStartTime
  ).length;
  const currentAbnormalCount = unresolvedAlerts.length;

  const avgDurationMinutes =
    filteredAlerts.length > 0
      ? Math.round(
          filteredAlerts.reduce((sum, a) => sum + a.durationMinutes, 0) /
            filteredAlerts.length
        )
      : 0;

  return {
    totalAbnormalCount,
    todayAbnormalCount,
    currentAbnormalCount,
    avgDurationMinutes,
    abnormalRecords: filteredAlerts.sort(
      (a, b) => b.alertedAt - a.alertedAt
    ),
  };
}

export function checkForNewAlerts(): AlertRecord[] {
  return checkTimeoutStalls();
}

export function getWorkOrders(): WorkOrder[] {
  return dbGetWorkOrders().sort((a, b) => b.createdAt - a.createdAt);
}

export function getWorkOrderStats(days: number = 30): WorkOrderStats {
  return dbGetWorkOrderStats(days);
}

export function getStallDurationRanking(days: number = 30, floorId?: string): StallDurationRank[] {
  const records = getUsageRecords();
  const stalls = getStalls();
  const floors = getFloors();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  let filteredRecords = records.filter((r) => r.startTime >= cutoff);

  if (floorId) {
    filteredRecords = filteredRecords.filter((r) => r.floorId === floorId);
  }

  const stallStats: Record<string, { totalDuration: number; count: number }> = {};

  filteredRecords.forEach((record) => {
    if (!stallStats[record.stallId]) {
      stallStats[record.stallId] = { totalDuration: 0, count: 0 };
    }
    stallStats[record.stallId].totalDuration += record.durationSeconds;
    stallStats[record.stallId].count += 1;
  });

  const ranking: StallDurationRank[] = Object.entries(stallStats)
    .map(([stallId, stats]) => {
      const stall = stalls.find((s) => s.id === stallId);
      const floor = floors.find((f) => f.id === stall?.floorId);

      return {
        stallId,
        stallNumber: stall?.stallNumber || 0,
        floorId: stall?.floorId || '',
        floorNumber: floor?.floorNumber || 0,
        floorName: floor?.floorName || '',
        avgDurationMinutes: Math.round((stats.totalDuration / stats.count) / 60 * 10) / 10,
        totalUsageCount: stats.count,
        totalDurationMinutes: Math.round(stats.totalDuration / 60),
      };
    })
    .sort((a, b) => b.avgDurationMinutes - a.avgDurationMinutes);

  return ranking;
}

export function getFloorTrendData(days: number = 30, floorIds?: string[]): FloorTrendData[] {
  const records = getUsageRecords();
  const floors = getFloors();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const filteredRecords = records.filter((r) => r.startTime >= cutoff);
  const targetFloors = floorIds && floorIds.length > 0
    ? floors.filter((f) => floorIds.includes(f.id))
    : floors;

  const result: FloorTrendData[] = targetFloors.map((floor) => {
    const floorRecords = filteredRecords.filter((r) => r.floorId === floor.id);

    const dailyCount: Record<string, number> = {};
    floorRecords.forEach((record) => {
      const date = new Date(record.startTime);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dailyCount[dateStr] = (dailyCount[dateStr] || 0) + 1;
    });

    const data: TrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      data.push({
        date: dateStr,
        count: dailyCount[dateStr] || 0,
      });
    }

    return {
      floorId: floor.id,
      floorNumber: floor.floorNumber,
      floorName: floor.floorName,
      data,
    };
  });

  return result;
}

export function getFloorPeakPeriods(floorIds?: string[]): FloorPeakData[] {
  const records = getUsageRecords();
  const floors = getFloors();
  const now = Date.now();
  const days = 30;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const filteredRecords = records.filter((r) => r.startTime >= cutoff);

  const targetFloors = floorIds && floorIds.length > 0
    ? floors.filter((f) => floorIds.includes(f.id))
    : floors;

  const periods = [
    { name: '早高峰 (8:00-10:00)', start: 8, end: 10 },
    { name: '午间高峰 (11:30-13:30)', start: 11, end: 14 },
    { name: '下午高峰 (14:00-16:00)', start: 14, end: 16 },
    { name: '晚高峰 (17:00-19:00)', start: 17, end: 19 },
  ];

  const result: FloorPeakData[] = targetFloors.map((floor) => {
    const floorRecords = filteredRecords.filter((r) => r.floorId === floor.id);

    const dailyRecords: Record<string, number[]> = {};
    floorRecords.forEach((record) => {
      const date = new Date(record.startTime);
      const weekday = date.getDay();
      if (weekday === 0 || weekday === 6) return;

      const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!dailyRecords[dateStr]) {
        dailyRecords[dateStr] = [];
      }
      dailyRecords[dateStr].push(date.getHours());
    });

    const weekdayCount = Object.keys(dailyRecords).length || 1;

    const data: PeakPeriod[] = periods.map((period) => {
      let count = 0;
      Object.values(dailyRecords).forEach((hours) => {
        hours.forEach((h) => {
          if (h >= period.start && h < period.end) {
            count++;
          }
        });
      });

      return {
        period: period.name,
        avgCount: Math.round((count / weekdayCount) * 10) / 10,
      };
    });

    return {
      floorId: floor.id,
      floorNumber: floor.floorNumber,
      floorName: floor.floorName,
      data,
    };
  });

  return result;
}

export function getFloorDailyUsage(days: number = 30, floorIds?: string[]): FloorDailyUsage[] {
  const records = getUsageRecords();
  const floors = getFloors();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const filteredRecords = records.filter((r) => r.startTime >= cutoff);
  const targetFloors = floorIds && floorIds.length > 0
    ? floors.filter((f) => floorIds.includes(f.id))
    : floors;

  const result: FloorDailyUsage[] = targetFloors.map((floor) => {
    const floorRecords = filteredRecords.filter((r) => r.floorId === floor.id);

    const dailyCount: Record<string, number> = {};
    floorRecords.forEach((record) => {
      const date = new Date(record.startTime);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dailyCount[dateStr] = (dailyCount[dateStr] || 0) + 1;
    });

    const dailyValues = Object.values(dailyCount);
    const totalUsage = dailyValues.reduce((sum, v) => sum + v, 0);
    const avgDailyUsage = dailyValues.length > 0 ? Math.round(totalUsage / dailyValues.length) : 0;
    const maxDailyUsage = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;

    const totalDurationSeconds = floorRecords.reduce((sum, r) => sum + r.durationSeconds, 0);
    const totalSecondsInPeriod = days * 24 * 60 * 60 * floor.totalStalls;
    const avgOccupancyRate = totalSecondsInPeriod > 0
      ? Math.round((totalDurationSeconds / totalSecondsInPeriod) * 1000) / 10
      : 0;

    return {
      floorId: floor.id,
      floorNumber: floor.floorNumber,
      floorName: floor.floorName,
      avgDailyUsage,
      totalUsage,
      maxDailyUsage,
      avgOccupancyRate,
    };
  });

  return result.sort((a, b) => b.avgDailyUsage - a.avgDailyUsage);
}

export function getFloorComparisonData(days: number = 30, floorIds?: string[]): FloorComparisonData {
  return {
    trends: getFloorTrendData(days, floorIds),
    peaks: getFloorPeakPeriods(floorIds),
    dailyUsage: getFloorDailyUsage(days, floorIds),
  };
}

export function getFloorReservations(floorId: string): Reservation[] {
  dbExpireReservations();
  return dbGetReservationsByFloor(floorId);
}

export function getVisitorReservations(visitorName: string): Reservation[] {
  dbExpireReservations();
  return dbGetReservationsByVisitor(visitorName);
}

export function getAllReservations(): Reservation[] {
  dbExpireReservations();
  return dbGetReservations();
}

export function createReservation(
  floorId: string,
  visitorName: string,
  timeSlot: string
): Reservation {
  const floors = getFloors();
  const floor = floors.find((f) => f.id === floorId);
  if (!floor) {
    throw new Error('楼层不存在');
  }

  if (!visitorName || visitorName.trim().length === 0) {
    throw new Error('请输入您的称呼');
  }

  const slotDate = new Date(timeSlot);
  if (isNaN(slotDate.getTime())) {
    throw new Error('无效的时间档位');
  }

  const now = new Date();
  if (slotDate.getTime() < now.getTime() - 5 * 60 * 1000) {
    throw new Error('不能预约过去的时间');
  }

  if (dbIsVisitorAlreadyReserved(floorId, visitorName.trim(), timeSlot)) {
    throw new Error('您已预约该楼层的此时段');
  }

  return dbCreateReservation({
    floorId,
    floorNumber: floor.floorNumber,
    floorName: floor.floorName,
    visitorName: visitorName.trim(),
    timeSlot,
  });
}

export function cancelReservationById(reservationId: string): Reservation | null {
  return dbCancelReservation(reservationId);
}

export function getNextReservationForFloor(floorId: string): Reservation | null {
  return dbGetFirstPendingReservation(floorId);
}

export function expireAllReservations(): Reservation[] {
  return dbExpireReservations();
}

export { initializeData };
