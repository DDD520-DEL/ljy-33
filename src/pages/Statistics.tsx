import { useEffect, useState, useCallback } from 'react';
import { BarChart3, Calendar, TrendingUp, RefreshCw, AlertTriangle, Clock, MapPin, Wrench, CheckCircle2, Timer, Zap } from 'lucide-react';
import Heatmap from '../components/Heatmap';
import TrendChart from '../components/TrendChart';
import PeakPeriods from '../components/PeakPeriods';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { getHeatmapData, getTrendData, getPeakPeriods, getAbnormalStats, getWorkOrderStats } from '../utils/api';
import type { HeatmapPoint, TrendPoint, PeakPeriod, AbnormalStats, WorkOrderStats } from '../types';

export default function Statistics() {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [peakPeriods, setPeakPeriods] = useState<PeakPeriod[]>([]);
  const [abnormalStats, setAbnormalStats] = useState<AbnormalStats | null>(null);
  const [workOrderStats, setWorkOrderStats] = useState<WorkOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTried, setHasTried] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [heatmapRes, trendRes, peaksRes, abnormalRes, workOrderRes] = await Promise.all([
        getHeatmapData(30),
        getTrendData(30),
        getPeakPeriods(),
        getAbnormalStats(30),
        getWorkOrderStats(30),
      ]);
      setHeatmapData(heatmapRes.data);
      setTrendData(trendRes.data);
      setPeakPeriods(peaksRes.data);
      setAbnormalStats(abnormalRes.data);
      setWorkOrderStats(workOrderRes.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setHasTried(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalUsage = trendData.reduce((sum, d) => sum + d.count, 0);
  const avgDaily = trendData.length > 0 ? Math.round(totalUsage / trendData.length) : 0;
  const maxDay = trendData.reduce(
    (max, d) => (d.count > max.count ? d : max),
    { date: '', count: 0 }
  );
  const hasData = trendData.length > 0 || heatmapData.length > 0 || peakPeriods.length > 0 || (abnormalStats && abnormalStats.totalAbnormalCount > 0) || (workOrderStats && workOrderStats.totalOrders > 0);

  const isInitialLoading = loading && !hasTried;
  const isRefreshing = loading && hasTried;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">统计分析</h1>
                <p className="text-primary-100 mt-1">近30天使用数据统计</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl transition-all disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">刷新数据</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {isInitialLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
                    <Calendar className="w-4 h-4 text-primary-200" />
                    <span className="text-sm text-primary-100">总使用次数</span>
                  </div>
                  <p className="text-3xl font-bold">{hasData ? totalUsage : '-'}</p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary-200" />
                    <span className="text-sm text-primary-100">日均使用</span>
                  </div>
                  <p className="text-3xl font-bold">{hasData ? avgDaily : '-'}</p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-primary-200" />
                    <span className="text-sm text-primary-100">最高日使用</span>
                  </div>
                  <p className="text-3xl font-bold">{hasData ? maxDay.count : '-'}</p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-danger-300" />
                    <span className="text-sm text-primary-100">异常占用</span>
                  </div>
                  <p className="text-3xl font-bold text-danger-300">
                    {abnormalStats ? abnormalStats.totalAbnormalCount : '-'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wrench className="w-4 h-4 text-warning-200" />
                    <span className="text-sm text-primary-100">总工单</span>
                  </div>
                  <p className="text-3xl font-bold text-warning-200">
                    {workOrderStats ? workOrderStats.totalOrders : '-'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-success-300" />
                    <span className="text-sm text-primary-100">已完成</span>
                  </div>
                  <p className="text-3xl font-bold text-success-300">
                    {workOrderStats ? workOrderStats.completedOrders : '-'}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-300" />
                    <span className="text-sm text-primary-100">平均响应</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-300">
                    {workOrderStats ? `${workOrderStats.avgResponseMinutes}分` : '-'}
                  </p>
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
            onRetry={fetchData}
            onDismiss={() => setError(null)}
          />
        )}

        {isInitialLoading ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
              <div className="h-64 bg-gray-100 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                <div className="h-48 bg-gray-100 rounded-xl" />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                <div className="h-48 bg-gray-100 rounded-xl" />
              </div>
            </div>
          </div>
        ) : hasData ? (
          <div className="space-y-6">
            <div className="animate-fade-in-up" style={{ opacity: 0 }}>
              <Heatmap data={heatmapData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: '0.1s', opacity: 0 }}
              >
                <TrendChart data={trendData} />
              </div>

              <div
                className="animate-fade-in-up"
                style={{ animationDelay: '0.2s', opacity: 0 }}
              >
                <PeakPeriods data={peakPeriods} />
              </div>
            </div>

            <div
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up"
              style={{ animationDelay: '0.3s', opacity: 0 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">数据分析</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-primary-50 rounded-xl">
                  <p className="text-sm text-primary-600 mb-1">最繁忙时段</p>
                  <p className="text-xl font-bold text-primary-900">
                    {peakPeriods.length > 0
                      ? peakPeriods.reduce((max, p) =>
                          p.avgCount > max.avgCount ? p : max
                        ).period
                      : '-'}
                  </p>
                </div>
                <div className="p-4 bg-success-50 rounded-xl">
                  <p className="text-sm text-success-600 mb-1">最空闲时段</p>
                  <p className="text-xl font-bold text-success-900">
                    {peakPeriods.length > 0
                      ? peakPeriods.reduce((min, p) =>
                          p.avgCount < min.avgCount ? p : min
                        ).period
                      : '-'}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm text-amber-600 mb-1">使用建议</p>
                  <p className="text-lg font-bold text-amber-900">
                    错峰出行，避开高峰
                  </p>
                </div>
              </div>
            </div>

            {abnormalStats && (
              <div
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up"
                style={{ animationDelay: '0.4s', opacity: 0 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-danger-500" />
                  <span>异常占用统计</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-danger-50 rounded-xl border border-danger-100">
                    <p className="text-sm text-danger-600 mb-1">累计异常</p>
                    <p className="text-2xl font-bold text-danger-900">
                      {abnormalStats.totalAbnormalCount} 次
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-sm text-orange-600 mb-1">今日异常</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {abnormalStats.todayAbnormalCount} 次
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-sm text-red-600 mb-1">当前异常</p>
                    <p className="text-2xl font-bold text-red-900">
                      {abnormalStats.currentAbnormalCount} 个
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-600 mb-1">平均时长</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {abnormalStats.avgDurationMinutes} 分钟
                    </p>
                  </div>
                </div>

                {abnormalStats.abnormalRecords.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">最近异常记录</h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {abnormalStats.abnormalRecords.slice(0, 10).map((record, index) => (
                        <div
                          key={record.id}
                          className={`p-4 rounded-xl border transition-all duration-300 ${
                            record.resolved
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-danger-50 border-danger-300 animate-pulse-slow'
                          }`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                record.resolved
                                  ? 'bg-gray-200'
                                  : 'bg-danger-200'
                              }`}>
                                <MapPin className={`w-5 h-5 ${
                                  record.resolved
                                    ? 'text-gray-600'
                                    : 'text-danger-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {record.floorNumber}楼 {record.floorName} · {record.stallNumber}号隔间
                                </p>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                      {new Date(record.startTime).toLocaleString('zh-CN', {
                                        month: 'numeric',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </span>
                                  <span>持续 {record.durationMinutes} 分钟</span>
                                </div>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              record.resolved
                                ? 'bg-gray-200 text-gray-700'
                                : 'bg-danger-500 text-white'
                            }`}>
                              {record.resolved ? '已处理' : '待处理'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {abnormalStats.abnormalRecords.length > 10 && (
                      <p className="text-center text-sm text-gray-500 mt-4">
                        还有 {abnormalStats.abnormalRecords.length - 10} 条历史记录...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {workOrderStats && (
              <div
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up"
                style={{ animationDelay: '0.5s', opacity: 0 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Wrench className="w-5 h-5 text-warning-500" />
                  <span>工单处理效率统计</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <div className="p-4 bg-warning-50 rounded-xl border border-warning-100">
                    <p className="text-sm text-warning-600 mb-1">近30天总工单</p>
                    <p className="text-2xl font-bold text-warning-900">
                      {workOrderStats.totalOrders} 单
                    </p>
                  </div>
                  <div className="p-4 bg-success-50 rounded-xl border border-success-100">
                    <p className="text-sm text-success-600 mb-1">已完成工单</p>
                    <p className="text-2xl font-bold text-success-900">
                      {workOrderStats.completedOrders} 单
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-sm text-amber-600 mb-1">待处理工单</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {workOrderStats.pendingOrders} 单
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-600 mb-1">平均响应时间</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {workOrderStats.avgResponseMinutes} 分钟
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-sm text-purple-600 mb-1">今日新增</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {workOrderStats.todayOrders} 单
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-sm text-emerald-600 mb-1">今日完成</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {workOrderStats.todayCompleted} 单
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">响应效率</p>
                        <p className="text-xs text-blue-500">平均处理时长</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">
                      {workOrderStats.avgResponseMinutes} <span className="text-lg font-medium">分钟</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      {workOrderStats.avgResponseMinutes <= 30
                        ? '响应速度优秀，继续保持！'
                        : workOrderStats.avgResponseMinutes <= 60
                        ? '响应速度良好，可进一步优化'
                        : '响应速度偏慢，建议加强管理'}
                    </p>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-success-50 to-success-100 rounded-xl border border-success-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-success-500 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-success-600">完成率</p>
                        <p className="text-xs text-success-500">工单处理完成情况</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-success-900">
                      {workOrderStats.totalOrders > 0
                        ? Math.round((workOrderStats.completedOrders / workOrderStats.totalOrders) * 100)
                        : 0}
                      <span className="text-lg font-medium">%</span>
                    </p>
                    <p className="text-xs text-success-600 mt-2">
                      {workOrderStats.totalOrders} 单中已完成 {workOrderStats.completedOrders} 单
                    </p>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                        <Timer className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-amber-600">今日进度</p>
                        <p className="text-xs text-amber-500">今日工单处理情况</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-amber-900">
                      {workOrderStats.todayOrders > 0
                        ? Math.round((workOrderStats.todayCompleted / workOrderStats.todayOrders) * 100)
                        : 0}
                      <span className="text-lg font-medium">%</span>
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      今日 {workOrderStats.todayOrders} 单，完成 {workOrderStats.todayCompleted} 单
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title={error ? '数据加载失败' : '暂无统计数据'}
            description={
              error
                ? '加载统计数据时出现问题，您可以尝试刷新。若问题持续存在，请稍后再试。'
                : '当前还没有可用的统计数据，可能是系统刚刚启用或数据还在积累中。请稍后再来查看。'
            }
            onRefresh={fetchData}
            loading={isRefreshing}
          />
        )}
      </div>
    </div>
  );
}
