import { useEffect, useState, useCallback, useMemo } from 'react';
import { BarChart3, Calendar, TrendingUp, RefreshCw, AlertTriangle, Clock, MapPin, Wrench, CheckCircle2, Timer, Zap, Trophy, ChevronDown, Filter, Building2, Download, CalendarRange } from 'lucide-react';
import Heatmap from '../components/Heatmap';
import TrendChart from '../components/TrendChart';
import PeakPeriods from '../components/PeakPeriods';
import FloorComparison from '../components/FloorComparison';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { getHeatmapData, getTrendData, getPeakPeriods, getAbnormalStats, getWorkOrderStats, getStallDurationRanking, getFloorComparisonData } from '../utils/api';
import { getAllFloors } from '../utils/api';
import { exportToCSV, formatDate, getDateRange } from '../lib/utils';
import type { HeatmapPoint, TrendPoint, PeakPeriod, AbnormalStats, WorkOrderStats, StallDurationRank, FloorWithStatus, FloorComparisonData } from '../types';

type ViewMode = 'overview' | 'comparison';
type DateRangeOption = 7 | 14 | 30 | 90;

export default function Statistics() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [peakPeriods, setPeakPeriods] = useState<PeakPeriod[]>([]);
  const [abnormalStats, setAbnormalStats] = useState<AbnormalStats | null>(null);
  const [workOrderStats, setWorkOrderStats] = useState<WorkOrderStats | null>(null);
  const [stallDurationRanking, setStallDurationRanking] = useState<StallDurationRank[]>([]);
  const [floors, setFloors] = useState<FloorWithStatus[]>([]);
  const [floorComparisonData, setFloorComparisonData] = useState<FloorComparisonData | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTried, setHasTried] = useState(false);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeOption>(30);
  const [exporting, setExporting] = useState(false);

  const dateRangeOptions: { value: DateRangeOption; label: string }[] = [
    { value: 7, label: '近7天' },
    { value: 14, label: '近14天' },
    { value: 30, label: '近30天' },
    { value: 90, label: '近90天' },
  ];

  const { startDate, endDate } = useMemo(() => getDateRange(dateRange), [dateRange]);

  const selectedFloorName = useMemo(() => {
    if (!selectedFloorId) return '';
    const floor = floors.find(f => f.id === selectedFloorId);
    return floor ? `${floor.floorNumber}楼${floor.floorName}` : '';
  }, [selectedFloorId, floors]);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const floorId = selectedFloorId || undefined;
      const [heatmapRes, trendRes, peaksRes, abnormalRes, workOrderRes, floorsRes, rankingRes] = await Promise.all([
        getHeatmapData(dateRange, floorId),
        getTrendData(dateRange, floorId),
        getPeakPeriods(dateRange, floorId),
        getAbnormalStats(dateRange),
        getWorkOrderStats(dateRange),
        getAllFloors(),
        getStallDurationRanking(dateRange, floorId),
      ]);
      setHeatmapData(heatmapRes.data);
      setTrendData(trendRes.data);
      setPeakPeriods(peaksRes.data);
      setAbnormalStats(abnormalRes.data);
      setWorkOrderStats(workOrderRes.data);
      setFloors(floorsRes.data);
      setStallDurationRanking(rankingRes.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setHasTried(true);
    }
  }, [dateRange, selectedFloorId]);

  const fetchComparisonData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [floorsRes, comparisonRes] = await Promise.all([
        getAllFloors(),
        getFloorComparisonData(30),
      ]);
      setFloors(floorsRes.data);
      setFloorComparisonData(comparisonRes.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setHasTried(true);
    }
  }, []);

  const fetchData = useCallback(() => {
    if (viewMode === 'overview') {
      fetchOverviewData();
    } else {
      fetchComparisonData();
    }
  }, [viewMode, fetchOverviewData, fetchComparisonData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      exportToCSV({
        startDate,
        endDate,
        floorName: selectedFloorName,
        heatmapData,
        trendData,
        peakPeriods,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate, selectedFloorName, heatmapData, trendData, peakPeriods]);

  const totalUsage = trendData.reduce((sum, d) => sum + d.count, 0);
  const avgDaily = trendData.length > 0 ? Math.round(totalUsage / trendData.length) : 0;
  const maxDay = trendData.reduce(
    (max, d) => (d.count > max.count ? d : max),
    { date: '', count: 0 }
  );
  const hasData = trendData.length > 0 || heatmapData.length > 0 || peakPeriods.length > 0 || (abnormalStats && abnormalStats.totalAbnormalCount > 0) || (workOrderStats && workOrderStats.totalOrders > 0) || stallDurationRanking.length > 0;

  const isInitialLoading = loading && !hasTried;
  const isRefreshing = loading && hasTried;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">统计分析</h1>
                <p className="text-primary-100 mt-1">{startDate} 至 {endDate} 使用数据统计</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl transition-all active:scale-95"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">筛选条件</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showFilterDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFilterDropdown(false)}
                    />
                    <div className="absolute right-0 top-12 z-20 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-72">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <CalendarRange className="w-4 h-4 inline mr-1" />
                          日期范围
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {dateRangeOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setDateRange(option.value);
                                setShowFilterDropdown(false);
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                dateRange === option.value
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Building2 className="w-4 h-4 inline mr-1" />
                          楼层筛选
                        </label>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          <button
                            onClick={() => {
                              setSelectedFloorId('');
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                              !selectedFloorId
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            全部楼层
                          </button>
                          {floors.map((floor) => (
                            <button
                              key={floor.id}
                              onClick={() => {
                                setSelectedFloorId(floor.id);
                                setShowFilterDropdown(false);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                                selectedFloorId === floor.id
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {floor.floorNumber}楼 {floor.floorName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleExport}
                disabled={loading || exporting || !hasData}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white text-primary-700 hover:bg-gray-100 backdrop-blur rounded-xl transition-all disabled:opacity-50 active:scale-95 font-medium"
              >
                <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                <span className="text-sm font-medium">{exporting ? '导出中...' : '导出数据'}</span>
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl transition-all disabled:opacity-50 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">刷新数据</span>
              </button>
            </div>
          </div>

          <div className="flex space-x-2 bg-white/10 backdrop-blur p-1 rounded-xl w-fit">
            <button
              onClick={() => setViewMode('overview')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'overview'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>综合统计</span>
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'comparison'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>楼层对比</span>
            </button>
          </div>

          {viewMode === 'overview' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
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
          )}
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

        {viewMode === 'overview' ? (
          <>
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

                <div
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up"
                  style={{ animationDelay: '0.6s', opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span>蹲位使用时长排行榜</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-sm rounded-full">
                        近{dateRange}天
                      </span>
                    </h3>
                    <div className="relative">
                      <button
                        onClick={() => setShowFloorDropdown(!showFloorDropdown)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors border border-gray-200"
                      >
                        <Filter className="w-4 h-4" />
                        <span>{selectedFloorId ? floors.find(f => f.id === selectedFloorId)?.floorName + ' ' + floors.find(f => f.id === selectedFloorId)?.floorNumber + '楼' : '全部楼层'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFloorDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showFloorDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowFloorDropdown(false)}
                          />
                          <div className="absolute right-0 top-12 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48">
                            <button
                              onClick={() => {
                                setSelectedFloorId('');
                                setShowFloorDropdown(false);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                                !selectedFloorId ? 'text-primary-600 bg-primary-50 font-medium' : 'text-gray-700'
                              }`}
                            >
                              全部楼层
                            </button>
                            {floors.map((floor) => (
                              <button
                                key={floor.id}
                                onClick={() => {
                                  setSelectedFloorId(floor.id);
                                  setShowFloorDropdown(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                                  selectedFloorId === floor.id ? 'text-primary-600 bg-primary-50 font-medium' : 'text-gray-700'
                                }`}
                              >
                                {floor.floorNumber}楼 {floor.floorName}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {stallDurationRanking.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {stallDurationRanking.map((stall, index) => (
                        <div
                          key={stall.stallId}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                            index === 0
                              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
                              : index === 1
                              ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
                              : index === 2
                              ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                              : 'bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                              index === 0
                                ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/30'
                                : index === 1
                                ? 'bg-gray-400 text-white shadow-lg shadow-gray-400/30'
                                : index === 2
                                ? 'bg-orange-400 text-white shadow-lg shadow-orange-400/30'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {stall.floorNumber}楼 {stall.floorName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {stall.stallNumber} 号隔间
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">
                              {stall.avgDurationMinutes} <span className="text-sm font-medium text-gray-500">分钟</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              平均使用时长 · 共使用 {stall.totalUsageCount} 次
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无排行数据</p>
                    </div>
                  )}
                </div>
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
          </>
        ) : (
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <FloorComparison
              floors={floors}
              data={floorComparisonData}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
