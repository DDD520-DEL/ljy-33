import { useEffect, useState, useCallback } from 'react';
import { Wrench, Clock, CheckCircle2, AlertCircle, RefreshCw, MapPin, Timer, Filter } from 'lucide-react';
import { useBathroomStore } from '../store/useBathroomStore';
import type { WorkOrder, WorkOrderStatus } from '../types';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';

type FilterType = 'all' | WorkOrderStatus;

export default function WorkOrders() {
  const { workOrders, workOrdersLoading, error, fetchWorkOrders, clearError } = useBathroomStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [hasTried, setHasTried] = useState(false);

  const loadData = useCallback(async () => {
    await fetchWorkOrders();
    setHasTried(true);
  }, [fetchWorkOrders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (order: WorkOrder) => {
    if (!order.completedAt) return null;
    const minutes = order.responseMinutes || Math.round((order.completedAt - order.createdAt) / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${minutes}分钟`;
  };

  const filteredOrders = workOrders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const pendingCount = workOrders.filter((o) => o.status === 'pending').length;
  const inProgressCount = workOrders.filter((o) => o.status === 'in_progress').length;
  const completedCount = workOrders.filter((o) => o.status === 'completed').length;

  const statusConfig = {
    pending: {
      label: '待处理',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700',
      dotColor: 'bg-amber-500',
      Icon: AlertCircle,
    },
    in_progress: {
      label: '处理中',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      dotColor: 'bg-blue-500',
      Icon: Timer,
    },
    completed: {
      label: '已完成',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      textColor: 'text-success-700',
      dotColor: 'bg-success-500',
      Icon: CheckCircle2,
    },
  };

  const isInitialLoading = workOrdersLoading && !hasTried;
  const isRefreshing = workOrdersLoading && hasTried;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-warning-600 via-warning-700 to-warning-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Wrench className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">清洁维护工单</h1>
                <p className="text-warning-100 mt-1">自动生成的维护工单记录</p>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={workOrdersLoading}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${workOrdersLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">刷新数据</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isInitialLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white/10 backdrop-blur rounded-xl p-4 animate-pulse"
                  >
                    <div className="h-4 w-20 bg-white/20 rounded mb-2" />
                    <div className="h-8 w-12 bg-white/20 rounded" />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wrench className="w-4 h-4 text-warning-200" />
                    <span className="text-sm text-warning-100">总工单</span>
                  </div>
                  <p className="text-3xl font-bold">{workOrders.length}</p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-300" />
                    <span className="text-sm text-warning-100">待处理</span>
                  </div>
                  <p className="text-3xl font-bold text-amber-300">{pendingCount}</p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Timer className="w-4 h-4 text-blue-300" />
                    <span className="text-sm text-warning-100">处理中</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-300">{inProgressCount}</p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-success-300" />
                    <span className="text-sm text-warning-100">已完成</span>
                  </div>
                  <p className="text-3xl font-bold text-success-300">{completedCount}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <ErrorAlert
            message={error}
            onRetry={loadData}
            onDismiss={clearError}
          />
        )}

        {!isInitialLoading && workOrders.length > 0 && (
          <div className="mb-6 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex items-center space-x-2">
              {(['all', 'pending', 'in_progress', 'completed'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {f === 'all'
                    ? '全部'
                    : f === 'pending'
                    ? '待处理'
                    : f === 'in_progress'
                    ? '处理中'
                    : '已完成'}
                </button>
              ))}
            </div>
          </div>
        )}

        {isInitialLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                    <div className="space-y-2">
                      <div className="h-5 w-40 bg-gray-200 rounded" />
                      <div className="h-4 w-32 bg-gray-100 rounded" />
                      <div className="h-4 w-24 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const config = statusConfig[order.status];
              const StatusIcon = config.Icon;
              const duration = getDuration(order);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl shadow-sm border p-6 transition-all duration-300 hover:shadow-md animate-fade-in-up ${
                    order.status === 'pending'
                      ? 'border-amber-200'
                      : order.status === 'in_progress'
                      ? 'border-blue-200'
                      : 'border-gray-100'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          order.status === 'pending'
                            ? 'bg-amber-100'
                            : order.status === 'in_progress'
                            ? 'bg-blue-100'
                            : 'bg-success-100'
                        }`}
                      >
                        <StatusIcon
                          className={`w-6 h-6 ${
                            order.status === 'pending'
                              ? 'text-amber-600'
                              : order.status === 'in_progress'
                              ? 'text-blue-600'
                              : 'text-success-600'
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>
                            {order.floorNumber}楼 {order.floorName} · {order.stallNumber}号隔间
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{order.reason}</p>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>报修时间: {formatDateTime(order.createdAt)}</span>
                          </span>
                          {duration && (
                            <span className="flex items-center space-x-1">
                              <Timer className="w-3.5 h-3.5" />
                              <span>处理耗时: {duration}</span>
                            </span>
                          )}
                          {order.completedAt && (
                            <span className="flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>完成时间: {formatDateTime(order.completedAt)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                        order.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : order.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-success-100 text-success-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                      <span>{config.label}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={error ? '数据加载失败' : hasTried && workOrders.length > 0 ? '暂无符合条件的工单' : '暂无工单记录'}
            description={
              error
                ? '加载工单数据时出现问题，您可以尝试刷新。若问题持续存在，请稍后再试。'
                : hasTried && workOrders.length > 0
                ? '当前筛选条件下没有工单，您可以尝试切换筛选条件查看其他工单。'
                : '当前还没有维护工单记录。当蹲位状态被标记为"维护中"时，系统会自动生成清洁维护工单。'
            }
            onRefresh={loadData}
            loading={isRefreshing}
          />
        )}
      </div>
    </div>
  );
}
