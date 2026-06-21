import type {
  FloorWithStatus,
  Stall,
  HeatmapPoint,
  TrendPoint,
  PeakPeriod,
  StallStatus,
  FloorQueue,
  QueueItem,
  AlertRecord,
  AbnormalStats,
  WorkOrder,
  WorkOrderStats,
  StallDurationRank,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  newAlerts?: AlertRecord[];
}

async function request<T>(url: string, options?: RequestInit): Promise<{ data: T; newAlerts?: AlertRecord[] }> {
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

  return {
    data: result.data as T,
    newAlerts: result.newAlerts,
  };
}

export async function getAllFloors(): Promise<{ data: FloorWithStatus[]; newAlerts?: AlertRecord[] }> {
  return request<FloorWithStatus[]>('/api/floors');
}

export async function getFloorStatus(floorId: string): Promise<{ data: FloorWithStatus; newAlerts?: AlertRecord[] }> {
  return request<FloorWithStatus>(`/api/floors/${floorId}/status`);
}

export async function checkAlerts(): Promise<{ data: AlertRecord[] }> {
  return request<AlertRecord[]>('/api/floors/alerts/check');
}

export async function getAbnormalStats(days: number = 30): Promise<{ data: AbnormalStats }> {
  return request<AbnormalStats>(`/api/stats/abnormal?days=${days}`);
}

export async function updateStallStatus(
  stallId: string,
  status: StallStatus,
): Promise<{ data: Stall }> {
  return request<Stall>(`/api/stalls/${stallId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getHeatmapData(days: number = 30): Promise<{ data: HeatmapPoint[] }> {
  return request<HeatmapPoint[]>(`/api/stats/heatmap?days=${days}`);
}

export async function getTrendData(days: number = 30): Promise<{ data: TrendPoint[] }> {
  return request<TrendPoint[]>(`/api/stats/trend?days=${days}`);
}

export async function getPeakPeriods(): Promise<{ data: PeakPeriod[] }> {
  return request<PeakPeriod[]>('/api/stats/peak');
}

export async function getFloorQueue(floorId: string): Promise<{ data: FloorQueue }> {
  return request<FloorQueue>(`/api/queue/${floorId}`);
}

export async function joinQueue(floorId: string, visitorName: string): Promise<{ data: QueueItem }> {
  return request<QueueItem>(`/api/queue/${floorId}/join`, {
    method: 'POST',
    body: JSON.stringify({ visitorName }),
  });
}

export async function leaveQueue(queueId: string): Promise<{ data: QueueItem }> {
  return request<QueueItem>(`/api/queue/${queueId}`, {
    method: 'DELETE',
  });
}

export async function getWorkOrders(): Promise<{ data: WorkOrder[] }> {
  return request<WorkOrder[]>('/api/work-orders');
}

export async function getWorkOrderStats(days: number = 30): Promise<{ data: WorkOrderStats }> {
  return request<WorkOrderStats>(`/api/work-orders/stats?days=${days}`);
}

export async function getStallDurationRanking(
  days: number = 30,
  floorId?: string
): Promise<{ data: StallDurationRank[] }> {
  const params = new URLSearchParams();
  params.append('days', days.toString());
  if (floorId) {
    params.append('floorId', floorId);
  }
  return request<StallDurationRank[]>(`/api/stats/stall-duration?${params.toString()}`);
}
