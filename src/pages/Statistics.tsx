import { useEffect, useState, useCallback } from 'react';
import { BarChart3, Calendar, TrendingUp } from 'lucide-react';
import Heatmap from '../components/Heatmap';
import TrendChart from '../components/TrendChart';
import PeakPeriods from '../components/PeakPeriods';
import ErrorAlert from '../components/ErrorAlert';
import { getHeatmapData, getTrendData, getPeakPeriods } from '../utils/api';
import type { HeatmapPoint, TrendPoint, PeakPeriod } from '../types';

export default function Statistics() {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [peakPeriods, setPeakPeriods] = useState<PeakPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [heatmap, trend, peaks] = await Promise.all([
        getHeatmapData(30),
        getTrendData(30),
        getPeakPeriods(),
      ]);
      setHeatmapData(heatmap);
      setTrendData(trend);
      setPeakPeriods(peaks);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalUsage = trendData.reduce((sum, d) => sum + d.count, 0);
  const avgDaily = trendData.length > 0 ? Math.round(totalUsage / trendData.length) : 0;
  const maxDay = trendData.reduce((max, d) => (d.count > max.count ? d : max), { date: '', count: 0 });
  const hasData = trendData.length > 0 || heatmapData.length > 0 || peakPeriods.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">统计分析</h1>
              <p className="text-primary-100 mt-1">近30天使用数据统计</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-primary-200" />
                <span className="text-sm text-primary-100">总使用次数</span>
              </div>
              <p className="text-3xl font-bold">{totalUsage}</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary-200" />
                <span className="text-sm text-primary-100">日均使用</span>
              </div>
              <p className="text-3xl font-bold">{avgDaily}</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-primary-200" />
                <span className="text-sm text-primary-100">最高日使用</span>
              </div>
              <p className="text-3xl font-bold">{maxDay.count}</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-primary-200" />
                <span className="text-sm text-primary-100">统计周期</span>
              </div>
              <p className="text-3xl font-bold">30 天</p>
            </div>
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

        {loading ? (
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
