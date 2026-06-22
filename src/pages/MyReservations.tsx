import { useEffect, useState, useCallback } from 'react';
import { CalendarCheck, Clock, MapPin, RefreshCw, XCircle, CheckCircle2, AlertCircle, Timer, Ban, ChevronDown } from 'lucide-react';
import { getVisitorReservations, cancelReservation as apiCancelReservation } from '../utils/api';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import type { Reservation, ReservationStatus } from '../types';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  pending: { label: '等待中', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Timer },
  fulfilled: { label: '已分配', color: 'text-success-700', bg: 'bg-success-50', border: 'border-success-200', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', icon: XCircle },
  expired: { label: '已超时', color: 'text-danger-600', bg: 'bg-danger-50', border: 'border-danger-200', icon: Ban },
};

function formatTimeSlot(timeSlot: string): string {
  const date = new Date(timeSlot);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const endMinutes = minutes + 30 >= 60 ? 0 : minutes + 30;
  const endHours = minutes + 30 >= 60 ? hours + 1 : hours;
  return `${month}月${day}日 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}-${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

function formatCreatedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyReservations() {
  const [visitorName, setVisitorName] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTried, setHasTried] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'all'>('all');

  const fetchReservations = useCallback(async () => {
    if (!visitorName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getVisitorReservations(visitorName.trim());
      setReservations(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setHasTried(true);
    }
  }, [visitorName]);

  useEffect(() => {
    if (nameSubmitted && visitorName.trim()) {
      fetchReservations();
    }
  }, [nameSubmitted, visitorName, fetchReservations]);

  const handleCancel = async (reservationId: string) => {
    setCancellingId(reservationId);
    try {
      await apiCancelReservation(reservationId);
      await fetchReservations();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCancellingId(null);
    }
  };

  const pendingCount = reservations.filter((r) => r.status === 'pending').length;
  const fulfilledCount = reservations.filter((r) => r.status === 'fulfilled').length;

  const filteredReservations = filterStatus === 'all'
    ? reservations
    : reservations.filter((r) => r.status === filterStatus);

  const hasData = reservations.length > 0;

  if (!nameSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">我的预约</h1>
                <p className="text-primary-100 mt-1">查看和管理蹲位预约记录</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CalendarCheck className="w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">查询您的预约</h2>
                <p className="text-sm text-gray-500 mt-2">输入您预约时使用的称呼来查看预约记录</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">您的称呼</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="请输入您的称呼"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && visitorName.trim()) {
                      setNameSubmitted(true);
                    }
                  }}
                />
              </div>

              <button
                onClick={() => setNameSubmitted(true)}
                disabled={!visitorName.trim()}
                className="w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                查询预约
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isInitialLoading = loading && !hasTried;
  const isRefreshing = loading && hasTried;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">我的预约</h1>
                <p className="text-primary-100 mt-1">{visitorName} 的预约记录</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setNameSubmitted(false); setVisitorName(''); setReservations([]); setHasTried(false); }}
                className="px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl text-sm font-medium transition-all"
              >
                切换用户
              </button>
              <button
                onClick={fetchReservations}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl transition-all disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">刷新</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CalendarCheck className="w-4 h-4 text-primary-200" />
                <span className="text-sm text-primary-100">总预约</span>
              </div>
              <p className="text-3xl font-bold">{hasData ? reservations.length : '-'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Timer className="w-4 h-4 text-amber-300" />
                <span className="text-sm text-primary-100">等待中</span>
              </div>
              <p className="text-3xl font-bold text-amber-300">{hasData ? pendingCount : '-'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-success-300" />
                <span className="text-sm text-primary-100">已分配</span>
              </div>
              <p className="text-3xl font-bold text-success-300">{hasData ? fulfilledCount : '-'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-300" />
                <span className="text-sm text-primary-100">完成率</span>
              </div>
              <p className="text-3xl font-bold text-blue-300">
                {hasData && reservations.length > 0
                  ? Math.round((fulfilledCount / reservations.length) * 100)
                  : '-'}
                {hasData ? '%' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <ErrorAlert
            message={error}
            onRetry={fetchReservations}
            onDismiss={() => setError(null)}
          />
        )}

        {hasData && (
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-sm text-gray-500">筛选:</span>
            {(['all', 'pending', 'fulfilled', 'cancelled', 'expired'] as const).map((status) => {
              const isAll = status === 'all';
              const config = isAll ? null : STATUS_CONFIG[status];
              const count = isAll ? reservations.length : reservations.filter((r) => r.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === status
                      ? isAll
                        ? 'bg-primary-100 text-primary-700'
                        : `${config!.bg} ${config!.color}`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{isAll ? '全部' : config!.label}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      filterStatus === status ? 'bg-white/60' : 'bg-gray-200'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {isInitialLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
                <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                <div className="h-4 w-32 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : hasData ? (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => {
              const config = STATUS_CONFIG[reservation.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={reservation.id}
                  className={`bg-white rounded-2xl shadow-sm border ${config.border} p-6 transition-all hover:shadow-md`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                        <StatusIcon className={`w-6 h-6 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-bold text-gray-900">
                            {reservation.floorNumber}楼 {reservation.floorName}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimeSlot(reservation.timeSlot)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>排队位置: 第 {reservation.queuePosition} 位</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          预约时间: {formatCreatedAt(reservation.createdAt)}
                        </p>
                      </div>
                    </div>

                    {reservation.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        disabled={cancellingId === reservation.id}
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-danger-600 bg-danger-50 hover:bg-danger-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{cancellingId === reservation.id ? '取消中...' : '取消预约'}</span>
                      </button>
                    )}
                  </div>

                  {reservation.status === 'pending' && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-700">
                          预约档位开始后30分钟内未使用将自动取消。蹲位释放后优先分配给预约用户。
                        </p>
                      </div>
                    </div>
                  )}

                  {reservation.status === 'fulfilled' && reservation.fulfilledAt && (
                    <div className="mt-4 p-3 bg-success-50 rounded-xl border border-success-100">
                      <div className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-success-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-success-700">
                          <p className="font-medium mb-0.5">
                            已在 {formatCreatedAt(reservation.fulfilledAt)} 分配蹲位
                          </p>
                          <p>
                            楼层：{reservation.floorNumber}楼 {reservation.floorName}
                            {reservation.assignedStallNumber && (
                              <> · 隔间：{reservation.assignedStallNumber} 号</>
                            )}
                          </p>
                          <p className="text-xs text-success-600 mt-1">
                            请在30分钟内前往对应楼层点击"我要使用这个隔间"开始使用，超时将自动释放。
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {reservation.status === 'expired' && (
                    <div className="mt-4 p-3 bg-danger-50 rounded-xl border border-danger-100">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-danger-700">
                          预约超时未使用，已自动取消。时段：{formatTimeSlot(reservation.timeSlot)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredReservations.length === 0 && (
              <div className="py-12 text-center">
                <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">该筛选条件下没有预约记录</p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="暂无预约记录"
            description="您还没有任何蹲位预约记录，可以在楼层详情页面进行预约。"
            onRefresh={fetchReservations}
            loading={isRefreshing}
          />
        )}
      </div>
    </div>
  );
}
