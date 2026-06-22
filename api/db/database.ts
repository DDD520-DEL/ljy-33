import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { TIMEOUT_THRESHOLD_MS, RESERVATION_TIMEOUT_MINUTES } from '../../shared/types.js';
import type { Stall, Floor, UsageRecord, StallStatus, QueueItem, FloorQueue, AlertRecord, WorkOrder, WorkOrderStats, Reservation, ReservationStatus } from '../../shared/types.js';

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

  stall.status = status;
  stall.lastUpdated = now;

  if (previousStatus !== 'maintenance' && status === 'maintenance') {
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
    completeWorkOrder(stallId);
  }

  if (previousStatus === 'reserved' && status === 'available') {
    stall.reservedByReservationId = undefined;
    stall.reservedUntil = undefined;

    const reservations = getReservations();
    const pendingReservation = getFirstPendingReservation(stall.floorId);
    if (pendingReservation) {
      fulfillReservation(pendingReservation.id, stall.id, stall.stallNumber);
    }
    saveReservations(reservations);
  } else if (previousStatus === 'available' && status === 'occupied') {
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

    const pendingReservation = getFirstPendingReservation(stall.floorId);
    if (pendingReservation) {
      fulfillReservation(pendingReservation.id, stall.id, stall.stallNumber);
    } else {
      popFromQueue(stall.floorId);
    }
  }

  saveStalls(stalls);
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
  if (existingFloors.length > 0) return;

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
  stalls.forEach((stall) => {
    if (stall.reservedByReservationId === reservationId) {
      stall.status = 'available';
      stall.reservedByReservationId = undefined;
      stall.reservedUntil = undefined;
      stall.lastUpdated = Date.now();
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
    stall.status = 'reserved';
    stall.reservedByReservationId = reservationId;
    stall.reservedUntil = Date.now() + RESERVATION_TIMEOUT_MINUTES * 60 * 1000;
    stall.lastUpdated = Date.now();
    saveStalls(stalls);
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

  return stall;
}

export function releaseExpiredReservedStalls(): Stall[] {
  const stalls = getStalls();
  const reservations = getReservations();
  const now = Date.now();
  const released: Stall[] = [];

  stalls.forEach((stall) => {
    if (stall.status === 'reserved' && stall.reservedUntil && now >= stall.reservedUntil) {
      const reservationId = stall.reservedByReservationId;
      stall.status = 'available';
      stall.reservedByReservationId = undefined;
      stall.reservedUntil = undefined;
      stall.lastUpdated = now;
      released.push(stall);

      if (reservationId) {
        const reservation = reservations.find((r) => r.id === reservationId);
        if (reservation && reservation.status === 'fulfilled') {
          reservation.status = 'expired';
        }
      }
    }
  });

  if (released.length > 0) {
    saveStalls(stalls);
    saveReservations(reservations);
  }

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
