import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { Stall, Floor, UsageRecord, StallStatus, QueueItem, FloorQueue } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const FLOORS_FILE = path.join(DATA_DIR, 'floors.json');
const STALLS_FILE = path.join(DATA_DIR, 'stalls.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage_records.json');
const QUEUE_FILE = path.join(DATA_DIR, 'queue.json');

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
  stall.status = status;
  stall.lastUpdated = Date.now();
  saveStalls(stalls);

  if (previousStatus === 'available' && status === 'occupied') {
    (stall as unknown as { _startTime: number })._startTime = Date.now();
  } else if (previousStatus === 'occupied' && status === 'available') {
    const startTime = (stall as unknown as { _startTime?: number })._startTime || stall.lastUpdated - 300000;
    const endTime = Date.now();
    addUsageRecord({
      stallId: stall.id,
      floorId: stall.floorId,
      startTime,
      endTime,
      durationSeconds: Math.floor((endTime - startTime) / 1000),
    });
    popFromQueue(stall.floorId);
  }

  return stall;
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
        const startTime = dayTime + hour * 60 * 60 * 1000 + minute * 60 * 1000;

        records.push({
          id: uuidv4(),
          stallId: stall.id,
          floorId: stall.floorId,
          startTime,
          endTime: startTime + duration * 60 * 1000,
          durationSeconds: duration * 60,
        });
      }
    });
  }

  saveUsageRecords(records);
}
