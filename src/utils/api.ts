import type {
  FloorWithStatus,
  Stall,
  HeatmapPoint,
  TrendPoint,
  PeakPeriod,
  StallStatus,
  FloorQueue,
  QueueItem,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!result.success || result.error) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data as T;
}

export async function getAllFloors(): Promise<FloorWithStatus[]> {
  return request<FloorWithStatus[]>('/api/floors');
}

export async function getFloorStatus(floorId: string): Promise<FloorWithStatus> {
  return request<FloorWithStatus>(`/api/floors/${floorId}/status`);
}

export async function updateStallStatus(
  stallId: string,
  status: StallStatus,
): Promise<Stall> {
  return request<Stall>(`/api/stalls/${stallId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getHeatmapData(days: number = 30): Promise<HeatmapPoint[]> {
  return request<HeatmapPoint[]>(`/api/stats/heatmap?days=${days}`);
}

export async function getTrendData(days: number = 30): Promise<TrendPoint[]> {
  return request<TrendPoint[]>(`/api/stats/trend?days=${days}`);
}

export async function getPeakPeriods(): Promise<PeakPeriod[]> {
  return request<PeakPeriod[]>('/api/stats/peak');
}

export async function getFloorQueue(floorId: string): Promise<FloorQueue> {
  return request<FloorQueue>(`/api/queue/${floorId}`);
}

export async function joinQueue(floorId: string, visitorName: string): Promise<QueueItem> {
  return request<QueueItem>(`/api/queue/${floorId}/join`, {
    method: 'POST',
    body: JSON.stringify({ visitorName }),
  });
}

export async function leaveQueue(queueId: string): Promise<QueueItem> {
  return request<QueueItem>(`/api/queue/${queueId}`, {
    method: 'DELETE',
  });
}
