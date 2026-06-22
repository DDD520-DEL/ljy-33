import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { TIMEOUT_THRESHOLD_MS, RESERVATION_TIMEOUT_MINUTES } from '../../shared/types.js';
import type { Stall, Floor, UsageRecord, StallStatus, QueueItem, FloorQueue, AlertRecord, WorkOrder, WorkOrderStats, Reservation, ReservationStatus, StallStatusLog, Review, FloorReviewSummary } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const FLOORS_FILE = path.join(DATA_DIR, 'floors.json');
const STALLS_FILE = path.join(DATA_DIR, 'stalls.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage_records.json');
const QUEUE_FILE = path.join(DATA_DIR, 'queue.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');
const WORK_ORDERS_FILE = path.join(DATA_DIR, 'work_orders.json');
const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservations.json');
const STATUS_LOGS_FILE = path.join(DATA_DIR, 'stall_status_logs.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(filePath: string, defaultValue: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

function writeJSON<T>(filePath: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getFloors(): Floor[] {
  return readJSON<Floor[]>(FLOORS_FILE, []);
}

export function getStalls(): Stall[] {
  return readJSON<Stall[]>(STALLS_FILE, []);
}

export function getUsageRecords(): UsageRecord[] {
  return readJSON<UsageRecord[]>(USAGE_FILE, []);
}

export function saveFloors(floors: Floor[]): void {
  writeJSON(FLOORS_FILE, floors);
}

export function saveStalls(stalls: Stall[]): void {
  writeJSON(STALLS_FILE, stalls);
}

export function saveUsageRecords(records: UsageRecord[]): void {
  writeJSON(USAGE_FILE, records);
}

export function getAlerts(): AlertRecord[] {
  return readJSON<AlertRecord[]>(ALERTS_FILE, []);
}

export function saveAlerts(alerts: AlertRecord[]): void {
  writeJSON(ALERTS_FILE, alerts);
}

export function addAlert(alert: Omit<AlertRecord, 'id'>): AlertRecord {
  const alerts = getAlerts();
  const newAlert: AlertRecord = {
    ...alert,
    id: uuidv4(),
  };
  alerts.push(newAlert);
  saveAlerts(alerts);
  return newAlert;
}

export function resolveAlert(stallId: string): AlertRecord | null {
  const alerts = getAlerts();
  const unresolvedAlert = alerts.find(
    (a) => a.stallId === stallId && !a.resolved
  );
  if (!unresolvedAlert) return null;

  unresolvedAlert.resolved = true;
  unresolvedAlert.resolvedAt = Date.now();
  unresolvedAlert.durationMinutes = Math.round(
    (Date.now() - unresolvedAlert.startTime) / 60000
  );
  saveAlerts(alerts);
  return unresolvedAlert;
}

export function getUnresolvedAlerts(): AlertRecord[] {
  const alerts = getAlerts();
  return alerts.filter((a) => !a.resolved);
}

export function getWorkOrders(): WorkOrder[] {
  return readJSON<WorkOrder[]>(WORK_ORDERS_FILE, []);
}

export function saveWorkOrders(orders: WorkOrder[]): void {
  writeJSON(WORK_ORDERS_FILE, orders);
}

export function createWorkOrder(
  order: Omit<WorkOrder, 'id' | 'createdAt' | 'status'>
): WorkOrder {
  const orders = getWorkOrders();
  const newOrder: WorkOrder = {
    ...order,
    id: uuidv4(),
    createdAt: Date.now(),
    status: 'pending',
  };
  orders.push(newOrder);
  saveWorkOrders(orders);
  return newOrder;
}

export function completeWorkOrder(stallId: string): WorkOrder | null {
  const orders = getWorkOrders();
  const pendingOrder = orders.find(
    (o) => o.stallId === stallId && o.status !== 'completed'
  );
  if (!pendingOrder) return null;

  const now = Date.now();
  pendingOrder.status = 'completed';
  pendingOrder.completedAt = now;
  pendingOrder.responseMinutes = Math.round(
    (now - pendingOrder.createdAt) / 60000
  );
  saveWorkOrders(orders);
  return pendingOrder;
}

export function getPendingWorkOrderByStall(stallId: string): WorkOrder | null {
  const orders = getWorkOrders();
  return orders.find((o) => o.stallId === stallId && o.status !== 'completed') || null;
}

export function getStallStatusLogs(): StallStatusLog[] {
  return readJSON<StallStatusLog[]>(STATUS_LOGS_FILE, []);
}

export function saveStallStatusLogs(logs: StallStatusLog[]): void {
  writeJSON(STATUS_LOGS_FILE, logs);
}

export function addStallStatusLog(
  log: Omit<StallStatusLog, 'id' | 'changedAt'>
): StallStatusLog {
  const logs = getStallStatusLogs();
  const newLog: StallStatusLog = {
    ...log,
    id: uuidv4(),
    changedAt: Date.now(),
  };
  logs.push(newLog);
  saveStallStatusLogs(logs);
  return newLog;
}

export function getStallStatusLogsByFloor(
  floorId: string,
  limit: number = 50
): StallStatusLog[] {
  const logs = getStallStatusLogs();
  return logs
    .filter((log) => log.floorId === floorId)
    .sort((a, b) => b.changedAt - a.changedAt)
    .slice(0, limit);
}

export function getWorkOrderStats(days: number = 30): WorkOrderStats {
  const orders = getWorkOrders();
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();

  const filteredOrders = orders.filter((o) => o.createdAt >= startTime);
  const completedOrders = filteredOrders.filter((o) => o.status === 'completed');
  const pendingOrders = filteredOrders.filter((o) => o.status !== 'completed');

  const todayOrders = orders.filter((o) => o.createdAt >= todayStart);
  const todayCompleted = todayOrders.filter((o) => o.status === 'completed');

  const avgResponseMinutes = completedOrders.length > 0
    ? Math.round(
        completedOrders.reduce((sum, o) => sum + (o.responseMinutes || 0), 0) /
          completedOrders.length
      )
    : 0;

  return {
    totalOrders: filteredOrders.length,
    completedOrders: completedOrders.length,
    pendingOrders: pendingOrders.length,
    avgResponseMinutes,
    todayOrders: todayOrders.length,
    todayCompleted: todayCompleted.length,
  };
}

export function getQueue(): QueueItem[] {
  return readJSON<QueueItem[]>(QUEUE_FILE, []);
}

export function saveQueue(queue: QueueItem[]): void {
  writeJSON(QUEUE_FILE, queue);
}

export function getQueueByFloor(floorId: string): FloorQueue {
  const allItems = getQueue();
  const items = allItems
    .filter((item) => item.floorId === floorId)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((item, index) => ({ ...item, position: index + 1 }));
  return {
    floorId,
    items,
    count: items.length,
  };
}

export function addToQueue(floorId: string, visitorName: string): QueueItem {
  const queue = getQueue();
  const newItem: QueueItem = {
    id: uuidv4(),
    floorId,
    visitorName,
    joinedAt: Date.now(),
    position: 0,
  };
  queue.push(newItem);
  saveQueue(queue);
  const floorQueue = getQueueByFloor(floorId);
  const itemWithPosition = floorQueue.items.find((i) => i.id === newItem.id)!;
  return itemWithPosition;
}

export function removeFromQueue(queueId: string): QueueItem | null {
  const queue = getQueue();
  const index = queue.findIndex((item) => item.id === queueId);
  if (index === -1) return null;
  const removed = queue.splice(index, 1)[0];
  saveQueue(queue);
  return removed;
}

export function popFromQueue(floorId: string): QueueItem | null {
  const floorQueue = getQueueByFloor(floorId);
  if (floorQueue.items.length === 0) return null;
  const firstItem = floorQueue.items[0];
  removeFromQueue(firstItem.id);
  return firstItem;
}

export function isVisitorInQueue(floorId: string, visitorName: string): boolean {
  const queue = getQueue();
  return queue.some((item) => item.floorId === floorId && item.visitorName === visitorName);
}

export function addUsageRecord(record: Omit<UsageRecord, 'id'>): UsageRecord {
  const records = getUsageRecords();
  const newRecord: UsageRecord = {
    ...record,
    id: uuidv4(),
  };
  records.push(newRecord);
  saveUsageRecords(records);
  return newRecord;
}

export function updateStallStatus(stallId: string, status: StallStatus): Stall | null {
  const stalls = getStalls();
  const stall = stalls.find((s) => s.id === stallId);
  if (!stall) return null;

  const previousStatus = stall.status;
  const now = Date.now();

  if (previousStatus === 'reserved' && status === 'occupied') {
    saveStalls(stalls);
    return occupyReservedStall(stallId);
  }

  stall.lastUpdated = now;

  if (previousStatus !== 'maintenance' && status === 'maintenance') {
    stall.status = status;
    const floors = getFloors();
    const floor = floors.find((f) => f.id === stall.floorId);
    if (floor) {
      createWorkOrder({
        stallId: stall.id,
        floorId: stall.floorId,
        stallNumber: stall.stallNumber,
        floorNumber: floor.floorNumber,
        floorName: floor.floorName,
        reason: '设施清洁维护',
      });
    }
  } else if (previousStatus === 'maintenance' && status === 'available') {
    stall.status = status;
    completeWorkOrder(stallId);
  } else if (previousStatus === 'reserved' && status === 'available') {
    const reservations = getReservations();
    const oldReservationId = stall.reservedByReservationId;

    if (oldReservationId) {
      const oldR = reservations.find((r) => r.id === oldReservationId);
      if (oldR && oldR.status === 'fulfilled') {
        oldR.status = 'cancelled';
        oldR.cancelledAt = now;
      }
    }

    stall.reservedByReservationId = undefined;
    stall.reservedUntil = undefined;

    const nextReservation = (() => {
      const GRACE_BEFORE = 5 * 60 * 1000;
      const ready = reservations
        .filter((r) => r.floorId === stall.floorId && r.status === 'pending')
        .filter((r) => {
          const slotTime = new Date(r.timeSlot).getTime();
          return now >= slotTime - GRACE_BEFORE;
        })
        .sort((a, b) => {
          const slotA = new Date(a.timeSlot).getTime();
          const slotB = new Date(b.timeSlot).getTime();
          if (slotA !== slotB) return slotA - slotB;
          return a.createdAt - b.createdAt;
        });
      return ready.length > 0 ? ready[0] : null;
    })();

    if (nextReservation) {
      nextReservation.status = 'fulfilled';
      nextReservation.fulfilledAt = now;
      nextReservation.assignedStallId = stall.id;
      nextReservation.assignedStallNumber = stall.stallNumber;
      stall.status = 'reserved';
      stall.reservedByReservationId = nextReservation.id;
      stall.reservedUntil = now + RESERVATION_TIMEOUT_MINUTES * 60 * 1000;
    } else {
      stall.status = 'available';
    }

    saveReservations(reservations);
  } else if (previousStatus === 'available' && status === 'occupied') {
    stall.status = status;
    stall.occupiedStartTime = now;
    stall.isAbnormal = false;
  } else if (previousStatus === 'occupied' && status === 'available') {
    const startTime = stall.occupiedStartTime || stall.lastUpdated - 300000;
    const endTime = now;
    const durationMs = endTime - startTime;
    const isAbnormal = durationMs >= TIMEOUT_THRESHOLD_MS;

    addUsageRecord({
      stallId: stall.id,
      floorId: stall.floorId,
      startTime,
      endTime,
      durationSeconds: Math.floor(durationMs / 1000),
      isAbnormal,
    });

    stall.occupiedStartTime = undefined;
    stall.isAbnormal = false;

    resolveAlert(stallId);

    const reservations = getReservations();
    const nextReservation = (() => {
      const GRACE_BEFORE = 5 * 60 * 1000;
      const ready = reservations
        .filter((r) => r.floorId === stall.floorId && r.status === 'pending')
        .filter((r) => {
          const slotTime = new Date(r.timeSlot).getTime();
          return now >= slotTime - GRACE_BEFORE;
        })
        .sort((a, b) => {
          const slotA = new Date(a.timeSlot).getTime();
          const slotB = new Date(b.timeSlot).getTime();
          if (slotA !== slotB) return slotA - slotB;
          return a.createdAt - b.createdAt;
        });
      return ready.length > 0 ? ready[0] : null;
    })();

    if (nextReservation) {
      nextReservation.status = 'fulfilled';
      nextReservation.fulfilledAt = now;
      nextReservation.assignedStallId = stall.id;
      nextReservation.assignedStallNumber = stall.stallNumber;
      stall.status = 'reserved';
      stall.reservedByReservationId = nextReservation.id;
      stall.reservedUntil = now + RESERVATION_TIMEOUT_MINUTES * 60 * 1000;
      saveReservations(reservations);
    } else {
      stall.status = 'available';
      saveReservations(reservations);
      popFromQueue(stall.floorId);
    }
  } else {
    stall.status = status;
  }

  saveStalls(stalls);

  const finalStatus = stall.status;
  if (previousStatus !== finalStatus) {
    const floors = getFloors();
    const floor = floors.find((f) => f.id === stall.floorId);
    if (floor) {
      addStallStatusLog({
        stallId: stall.id,
        floorId: stall.floorId,
        stallNumber: stall.stallNumber,
        floorNumber: floor.floorNumber,
        floorName: floor.floorName,
        previousStatus,
        newStatus: finalStatus,
      });
    }
  }

  return stall;
}

export function checkTimeoutStalls(): AlertRecord[] {
  const stalls = getStalls();
  const floors = getFloors();
  const unresolvedAlerts = getUnresolvedAlerts();
  const unresolvedStallIds = new Set(unresolvedAlerts.map((a) => a.stallId));
  const now = Date.now();
  const newAlerts: AlertRecord[] = [];

  stalls.forEach((stall) => {
    if (stall.status === 'occupied' && stall.occupiedStartTime) {
      const occupiedDuration = now - stall.occupiedStartTime;
      if (occupiedDuration >= TIMEOUT_THRESHOLD_MS) {
        stall.isAbnormal = true;

        if (!unresolvedStallIds.has(stall.id)) {
          const floor = floors.find((f) => f.id === stall.floorId);
          if (floor) {
            const newAlert = addAlert({
              stallId: stall.id,
              floorId: stall.floorId,
              stallNumber: stall.stallNumber,
              floorNumber: floor.floorNumber,
              floorName: floor.floorName,
              startTime: stall.occupiedStartTime,
              alertedAt: now,
              resolved: false,
              durationMinutes: Math.round(occupiedDuration / 60000),
            });
            newAlerts.push(newAlert);
          }
        }
      }
    }
  });

  saveStalls(stalls);
  return newAlerts;
}

export function initializeData(): void {
  const existingFloors = getFloors();
  const isFirstInit = existingFloors.length === 0;

  if (isFirstInit) {
    const floors: Floor[] = [
      { id: 'floor-1', floorNumber: 1, floorName: '1楼 大堂', totalStalls: 6 },
      { id: 'floor-2', floorNumber: 2, floorName: '2楼 办公区', totalStalls: 6 },
      { id: 'floor-3', floorNumber: 3, floorName: '3楼 办公区', totalStalls: 6 },
      { id: 'floor-4', floorNumber: 4, floorName: '4楼 办公区', totalStalls: 6 },
      { id: 'floor-5', floorNumber: 5, floorName: '5楼 高管层', totalStalls: 4 },
    ];

    const stalls: Stall[] = [];
    floors.forEach((floor) => {
      for (let i = 1; i <= floor.totalStalls; i++) {
        stalls.push({
          id: `stall-${floor.floorNumber}-${i}`,
          floorId: floor.id,
          stallNumber: i,
          status: 'available',
          lastUpdated: Date.now(),
          occupiedStartTime: undefined,
          isAbnormal: false,
        });
      }
    });

    saveFloors(floors);
    saveStalls(stalls);
    generateMockUsageData();
  }

  const existingReviews = getReviews();
  if (existingReviews.length === 0) {
    generateMockReviewData();
  }
}

function generateMockUsageData(): void {
  const records: UsageRecord[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const floors = getFloors();
  const stalls = getStalls();

  for (let day = 30; day >= 0; day--) {
    const dayTime = now - day * oneDay;
    const date = new Date(dayTime);
    const weekday = date.getDay();

    if (weekday === 0 || weekday === 6) continue;

    const peakHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    peakHours.forEach((hour) => {
      const isPeak = hour === 9 || hour === 12 || hour === 14 || hour === 17;
      const count = isPeak ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < count; i++) {
        const stall = stalls[Math.floor(Math.random() * stalls.length)];
        const minute = Math.floor(Math.random() * 60);
        const duration = Math.floor(Math.random() * 10) + 3;
        const isAbnormal = Math.random() < 0.05;
        const finalDuration = isAbnormal ? Math.floor(Math.random() * 30) + 25 : duration;
        const startTime = dayTime + hour * 60 * 60 * 1000 + minute * 60 * 1000;

        records.push({
          id: uuidv4(),
          stallId: stall.id,
          floorId: stall.floorId,
          startTime,
          endTime: startTime + finalDuration * 60 * 1000,
          durationSeconds: finalDuration * 60,
          isAbnormal,
        });
      }
    });
  }

  saveUsageRecords(records);
}

export function getReservations(): Reservation[] {
  return readJSON<Reservation[]>(RESERVATIONS_FILE, []);
}

export function saveReservations(reservations: Reservation[]): void {
  writeJSON(RESERVATIONS_FILE, reservations);
}

export function getReservationsByFloor(floorId: string): Reservation[] {
  const reservations = getReservations();
  return reservations
    .filter((r) => r.floorId === floorId && r.status === 'pending')
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((r, index) => ({ ...r, queuePosition: index + 1 }));
}

export function getReservationsByVisitor(visitorName: string): Reservation[] {
  const reservations = getReservations();
  return reservations
    .filter((r) => r.visitorName === visitorName)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function createReservation(
  reservation: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'queuePosition'>
): Reservation {
  const reservations = getReservations();
  const pendingCount = reservations.filter(
    (r) => r.floorId === reservation.floorId && r.status === 'pending'
  ).length;
  const newReservation: Reservation = {
    ...reservation,
    id: uuidv4(),
    createdAt: Date.now(),
    status: 'pending',
    queuePosition: pendingCount + 1,
  };
  reservations.push(newReservation);
  saveReservations(reservations);
  return newReservation;
}

export function cancelReservation(reservationId: string): Reservation | null {
  const reservations = getReservations();
  const reservation = reservations.find((r) => r.id === reservationId);
  if (!reservation || reservation.status !== 'pending') return null;

  reservation.status = 'cancelled';
  reservation.cancelledAt = Date.now();

  const stalls = getStalls();
  const floors = getFloors();
  stalls.forEach((stall) => {
    if (stall.reservedByReservationId === reservationId) {
      const previousStatus = stall.status;
      stall.status = 'available';
      stall.reservedByReservationId = undefined;
      stall.reservedUntil = undefined;
      stall.lastUpdated = Date.now();

      const floor = floors.find((f) => f.id === stall.floorId);
      if (floor && previousStatus !== stall.status) {
        addStallStatusLog({
          stallId: stall.id,
          floorId: stall.floorId,
          stallNumber: stall.stallNumber,
          floorNumber: floor.floorNumber,
          floorName: floor.floorName,
          previousStatus,
          newStatus: stall.status,
        });
      }
    }
  });
  saveStalls(stalls);

  saveReservations(reservations);
  return reservation;
}

export function fulfillReservation(
  reservationId: string,
  stallId: string,
  stallNumber: number
): Reservation | null {
  const reservations = getReservations();
  const reservation = reservations.find((r) => r.id === reservationId);
  if (!reservation || reservation.status !== 'pending') return null;

  reservation.status = 'fulfilled';
  reservation.fulfilledAt = Date.now();
  reservation.assignedStallId = stallId;
  reservation.assignedStallNumber = stallNumber;

  const stalls = getStalls();
  const stall = stalls.find((s) => s.id === stallId);
  if (stall) {
    const previousStatus = stall.status;
    stall.status = 'reserved';
    stall.reservedByReservationId = reservationId;
    stall.reservedUntil = Date.now() + RESERVATION_TIMEOUT_MINUTES * 60 * 1000;
    stall.lastUpdated = Date.now();
    saveStalls(stalls);

    const floors = getFloors();
    const floor = floors.find((f) => f.id === stall.floorId);
    if (floor && previousStatus !== stall.status) {
      addStallStatusLog({
        stallId: stall.id,
        floorId: stall.floorId,
        stallNumber: stall.stallNumber,
        floorNumber: floor.floorNumber,
        floorName: floor.floorName,
        previousStatus,
        newStatus: stall.status,
      });
    }
  }

  saveReservations(reservations);
  return reservation;
}

export function getFirstPendingReservation(floorId: string): Reservation | null {
  const reservations = getReservations();
  const now = Date.now();
  const GRACE_BEFORE = 5 * 60 * 1000;

  const ready = reservations
    .filter((r) => r.floorId === floorId && r.status === 'pending')
    .filter((r) => {
      const slotTime = new Date(r.timeSlot).getTime();
      return now >= slotTime - GRACE_BEFORE;
    })
    .sort((a, b) => {
      const slotA = new Date(a.timeSlot).getTime();
      const slotB = new Date(b.timeSlot).getTime();
      if (slotA !== slotB) return slotA - slotB;
      return a.createdAt - b.createdAt;
    });

  return ready.length > 0 ? ready[0] : null;
}

export function occupyReservedStall(stallId: string): Stall | null {
  const stalls = getStalls();
  const stall = stalls.find((s) => s.id === stallId);
  if (!stall || stall.status !== 'reserved') return null;

  const previousStatus = stall.status;
  const reservations = getReservations();
  const reservation = reservations.find((r) => r.id === stall.reservedByReservationId);

  stall.status = 'occupied';
  stall.occupiedStartTime = Date.now();
  stall.isAbnormal = false;
  stall.lastUpdated = Date.now();

  if (reservation) {
    reservation.status = 'fulfilled';
  }

  stall.reservedByReservationId = undefined;
  stall.reservedUntil = undefined;

  saveStalls(stalls);
  saveReservations(reservations);

  const floors = getFloors();
  const floor = floors.find((f) => f.id === stall.floorId);
  if (floor) {
    addStallStatusLog({
      stallId: stall.id,
      floorId: stall.floorId,
      stallNumber: stall.stallNumber,
      floorNumber: floor.floorNumber,
      floorName: floor.floorName,
      previousStatus,
      newStatus: stall.status,
    });
  }

  return stall;
}

export function releaseExpiredReservedStalls(): Stall[] {
  const stalls = getStalls();
  const now = Date.now();
  const expiredStallIds: string[] = [];

  stalls.forEach((stall) => {
    if (stall.status === 'reserved' && stall.reservedUntil && now >= stall.reservedUntil) {
      expiredStallIds.push(stall.id);
    }
  });

  if (expiredStallIds.length === 0) return [];

  saveStalls(stalls);
  const released: Stall[] = [];
  expiredStallIds.forEach((stallId) => {
    const updated = updateStallStatus(stallId, 'available');
    if (updated) released.push(updated);
  });
  return released;
}

export function expireReservations(): Reservation[] {
  const now = Date.now();
  releaseExpiredReservedStalls();

  const reservations = getReservations();
  const RESERVATION_TIMEOUT_MS = RESERVATION_TIMEOUT_MINUTES * 60 * 1000;
  const expired: Reservation[] = [];

  reservations.forEach((r) => {
    if (r.status !== 'pending') return;

    const slotTime = new Date(r.timeSlot).getTime();
    if (now >= slotTime + RESERVATION_TIMEOUT_MS) {
      r.status = 'expired';
      expired.push(r);
    }
  });

  if (expired.length > 0) {
    saveReservations(reservations);
  }

  return expired;
}

export function isVisitorAlreadyReserved(floorId: string, visitorName: string, timeSlot: string): boolean {
  const reservations = getReservations();
  return reservations.some(
    (r) =>
      r.floorId === floorId &&
      r.visitorName === visitorName &&
      r.timeSlot === timeSlot &&
      r.status === 'pending'
  );
}

export function getReviews(): Review[] {
  return readJSON<Review[]>(REVIEWS_FILE, []);
}

export function saveReviews(reviews: Review[]): void {
  writeJSON(REVIEWS_FILE, reviews);
}

export function addReview(
  review: Omit<Review, 'id' | 'createdAt'>
): Review {
  const reviews = getReviews();
  const newReview: Review = {
    ...review,
    id: uuidv4(),
    createdAt: Date.now(),
  };
  reviews.push(newReview);
  saveReviews(reviews);
  return newReview;
}

export function getReviewsByFloor(floorId: string, limit?: number): Review[] {
  const reviews = getReviews();
  const filtered = reviews
    .filter((r) => r.floorId === floorId)
    .sort((a, b) => b.createdAt - a.createdAt);
  return limit ? filtered.slice(0, limit) : filtered;
}

export function getRecentReviews(days: number = 7, floorId?: string): Review[] {
  const reviews = getReviews();
  const now = Date.now();
  const startTime = now - days * 24 * 60 * 60 * 1000;
  let filtered = reviews.filter((r) => r.createdAt >= startTime);
  if (floorId) {
    filtered = filtered.filter((r) => r.floorId === floorId);
  }
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}

function calculateAvg(reviews: Review[]): {
  avgCleanliness: number;
  avgOdor: number;
  avgFacilities: number;
  avgOverall: number;
} {
  if (reviews.length === 0) {
    return { avgCleanliness: 0, avgOdor: 0, avgFacilities: 0, avgOverall: 0 };
  }
  const totalCleanliness = reviews.reduce((sum, r) => sum + r.cleanliness, 0);
  const totalOdor = reviews.reduce((sum, r) => sum + r.odor, 0);
  const totalFacilities = reviews.reduce((sum, r) => sum + r.facilities, 0);
  const avgCleanliness = Math.round((totalCleanliness / reviews.length) * 10) / 10;
  const avgOdor = Math.round((totalOdor / reviews.length) * 10) / 10;
  const avgFacilities = Math.round((totalFacilities / reviews.length) * 10) / 10;
  const avgOverall = Math.round(((avgCleanliness + avgOdor + avgFacilities) / 3) * 10) / 10;
  return { avgCleanliness, avgOdor, avgFacilities, avgOverall };
}

export function getFloorReviewSummary(floorId: string, days: number = 7): FloorReviewSummary | null {
  const floors = getFloors();
  const floor = floors.find((f) => f.id === floorId);
  if (!floor) return null;

  const recentReviews = getRecentReviews(days, floorId);
  const allReviews = getReviewsByFloor(floorId);
  const avgs = calculateAvg(recentReviews);

  return {
    floorId: floor.id,
    floorNumber: floor.floorNumber,
    floorName: floor.floorName,
    totalReviews: allReviews.length,
    ...avgs,
    recentReviews: recentReviews.slice(0, 10),
  };
}

export function getAllFloorReviewSummaries(days: number = 7): FloorReviewSummary[] {
  const floors = getFloors();
  return floors
    .map((floor) => getFloorReviewSummary(floor.id, days))
    .filter((s): s is FloorReviewSummary => s !== null)
    .sort((a, b) => b.avgOverall - a.avgOverall);
}

function generateMockReviewData(): void {
  const reviews: Review[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const floors = getFloors();
  const visitorNames = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '杨九', '周十', '吴一', '郑二'];
  const comments = [
    '整体还不错，挺干净的',
    '气味有点大，需要加强通风',
    '设施很完善，用着方便',
    '卫生纸有时候不够用',
    '洗手台很干净，好评',
    '地面有点滑，要小心',
    '镜子擦得很亮',
    '洗手液味道很好闻',
    '隔间门锁有点小问题',
    '整体体验一般',
    '非常干净，值得表扬',
    '味道有点重，需要改善',
    '设施完好，用着放心',
    '',
    '',
    '',
  ];

  for (let day = 14; day >= 0; day--) {
    const dayTime = now - day * oneDay;
    const date = new Date(dayTime);
    const weekday = date.getDay();

    if (weekday === 0 || weekday === 6) continue;

    const reviewsPerDay = Math.floor(Math.random() * 5) + 2;

    for (let i = 0; i < reviewsPerDay; i++) {
      const floor = floors[Math.floor(Math.random() * floors.length)];
      const visitor = visitorNames[Math.floor(Math.random() * visitorNames.length)];
      const hour = Math.floor(Math.random() * 12) + 8;
      const minute = Math.floor(Math.random() * 60);
      const createdAt = dayTime + hour * 60 * 60 * 1000 + minute * 60 * 1000;

      const cleanliness = Math.floor(Math.random() * 3) + 3;
      const odor = Math.floor(Math.random() * 3) + 3;
      const facilities = Math.floor(Math.random() * 3) + 3;
      const comment = comments[Math.floor(Math.random() * comments.length)];

      reviews.push({
        id: uuidv4(),
        floorId: floor.id,
        floorNumber: floor.floorNumber,
        floorName: floor.floorName,
        visitorName: visitor,
        cleanliness,
        odor,
        facilities,
        comment: comment || undefined,
        createdAt,
      });
    }
  }

  saveReviews(reviews);
}
