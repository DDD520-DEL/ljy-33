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
} from '../db/database.js';
import type {
  FloorWithStatus,
  Stall,
  StallStatus,
  HeatmapPoint,
  TrendPoint,
  PeakPeriod,
  FloorQueue,
  QueueItem,
} from '../../shared/types.js';

export function getAllFloors(): FloorWithStatus[] {
  const floors = getFloors();
  const stalls = getStalls();

  return floors.map((floor) => {
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
}

export function getFloorById(floorId: string): FloorWithStatus | null {
  const floors = getAllFloors();
  return floors.find((f) => f.id === floorId) || null;
}

export function getStallsByFloor(floorId: string): Stall[] {
  const stalls = getStalls();
  return stalls.filter((s) => s.floorId === floorId);
}

export function updateStallStatus(stallId: string, status: StallStatus): Stall | null {
  return dbUpdateStallStatus(stallId, status);
}

export function getHeatmapData(days: number = 30): HeatmapPoint[] {
  const records = getUsageRecords();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const filtered = records.filter((r) => r.startTime >= cutoff);

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

export function getTrendData(days: number = 30): TrendPoint[] {
  const records = getUsageRecords();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const filtered = records.filter((r) => r.startTime >= cutoff);

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

export function getPeakPeriods(): PeakPeriod[] {
  const records = getUsageRecords();
  const now = Date.now();
  const days = 30;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const filtered = records.filter((r) => r.startTime >= cutoff);

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

export { initializeData };
