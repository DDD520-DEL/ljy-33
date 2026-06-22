import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Clock, Users, ChevronDown, Check, Building2 } from 'lucide-react';
import type { FloorWithStatus, FloorComparisonData, FloorTrendData, FloorPeakData, FloorDailyUsage } from '../types';

interface FloorComparisonProps {
  floors: FloorWithStatus[];
  data: FloorComparisonData | null;
  loading?: boolean;
}

const FLOOR_COLORS = [
  { main: '#0d9488', light: '#99f6e4', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  { main: '#3b82f6', light: '#bfdbfe', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { main: '#f59e0b', light: '#fde68a', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { main: '#ef4444', light: '#fecaca', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  { main: '#8b5cf6', light: '#ddd6fe', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { main: '#10b981', light: '#a7f3d0', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { main: '#ec4899', light: '#fbcfe8', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  { main: '#06b6d4', light: '#a5f3fc', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
];

export default function FloorComparison({ floors, data, loading = false }: FloorComparisonProps) {
  const [selectedFloorIds, setSelectedFloorIds] = useState<string[]>([]);
  const [showFloorDropdown, setShowFloorDropdown] = useState(false);

  const toggleFloor = (floorId: string) => {
    setSelectedFloorIds((prev) =>
      prev.includes(floorId)
        ? prev.filter((id) => id !== floorId)
        : [...prev, floorId]
    );
  };

  const selectAll = () => {
    setSelectedFloorIds(floors.map((f) => f.id));
  };

  const clearAll = () => {
    setSelectedFloorIds([]);
  };

  const getFloorColor = (index: number) => {
    return FLOOR_COLORS[index % FLOOR_COLORS.length];
  };

  const selectedTrends = useMemo(() => {
    if (!data || selectedFloorIds.length === 0) return [];
    return data.trends.filter((t) => selectedFloorIds.includes(t.floorId));
  }, [data, selectedFloorIds]);

  const selectedPeaks = useMemo(() => {
    if (!data || selectedFloorIds.length === 0) return [];
    return data.peaks.filter((p) => selectedFloorIds.includes(p.floorId));
  }, [data, selectedFloorIds]);

  const selectedDailyUsage = useMemo(() => {
    if (!data || selectedFloorIds.length === 0) return [];
    return data.dailyUsage.filter((d) => selectedFloorIds.includes(d.floorId));
  }, [data, selectedFloorIds]);

  const maxTrendValue = useMemo(() => {
    if (selectedTrends.length === 0) return 1;
    let max = 0;
    selectedTrends.forEach((t) => {
      t.data.forEach((d) => {
        if (d.count > max) max = d.count;
      });
    });
    return Math.max(max, 1);
  }, [selectedTrends]);

  const maxPeakValue = useMemo(() => {
    if (selectedPeaks.length === 0) return 1;
    let max = 0;
    selectedPeaks.forEach((p) => {
      p.data.forEach((d) => {
        if (d.avgCount > max) max = d.avgCount;
      });
    });
    return Math.max(max, 1);
  }, [selectedPeaks]);

  const maxDailyUsage = useMemo(() => {
    if (selectedDailyUsage.length === 0) return 1;
    return Math.max(...selectedDailyUsage.map((d) => d.avgDailyUsage), 1);
  }, [selectedDailyUsage]);

  const chartWidth = 700;
  const chartHeight = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartInnerWidth = chartWidth - padding.left - padding.right;
  const chartInnerHeight = chartHeight - padding.top - padding.bottom;

  const renderTrendChart = () => {
    if (selectedTrends.length === 0) return null;

    const dateCount = selectedTrends[0].data.length;
    const xLabels = selectedTrends[0].data
      .filter((_, i) => i % Math.ceil(dateCount / 7) === 0 || i === dateCount - 1)
      .map((d) => ({
        x: padding.left + (selectedTrends[0].data.indexOf(d) / (dateCount - 1)) * chartInnerWidth,
        label: d.date.slice(5),
      }));

    const yTicks = 5;
    const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
      const value = Math.round((maxTrendValue * i) / yTicks);
      const y = padding.top + chartInnerHeight - (value / maxTrendValue) * chartInnerHeight;
      return { value, y };
    });

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[500px]" preserveAspectRatio="xMidYMid meet">
        {yLabels.map((tick, i) => (
          <g key={i}>
            <line x1={padding.left} y1={tick.y} x2={chartWidth - padding.right} y2={tick.y} stroke="#f0f0f0" strokeWidth="1" />
            <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" fill="#9ca3af" fontSize="10">
              {tick.value}
            </text>
          </g>
        ))}

        {selectedTrends.map((trend, floorIndex) => {
          const color = getFloorColor(floorIndex);
          const points = trend.data.map((d, i) => {
            const x = padding.left + (i / (trend.data.length - 1)) * chartInnerWidth;
            const y = padding.top + chartInnerHeight - (d.count / maxTrendValue) * chartInnerHeight;
            return { x, y, ...d };
          });

          const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

          return (
            <g key={trend.floorId}>
              <path d={pathD} fill="none" stroke={color.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {points.filter((_, i) => i % Math.ceil(points.length / 10) === 0 || i === points.length - 1).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color.main} strokeWidth="2" />
              ))}
            </g>
          );
        })}

        {xLabels.map((label, i) => (
          <text key={i} x={label.x} y={chartHeight - padding.bottom + 20} textAnchor="middle" fill="#9ca3af" fontSize="10">
            {label.label}
          </text>
        ))}
      </svg>
    );
  };

  const renderPeakComparison = () => {
    if (selectedPeaks.length === 0) return null;

    const periods = selectedPeaks[0].data.map((p) => p.period);

    return (
      <div className="space-y-4">
        {periods.map((period, periodIndex) => (
          <div key={periodIndex} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{period}</span>
            </div>
            <div className="space-y-1.5">
              {selectedPeaks.map((peak, floorIndex) => {
                const color = getFloorColor(floorIndex);
                const periodData = peak.data.find((d) => d.period === period);
                const percentage = periodData ? (periodData.avgCount / maxPeakValue) * 100 : 0;
                const floor = floors.find((f) => f.id === peak.floorId);

                return (
                  <div key={peak.floorId} className="flex items-center space-x-3">
                    <div className="w-16 text-xs text-gray-500 text-right flex-shrink-0">
                      {floor?.floorNumber}楼
                    </div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color.main,
                        }}
                      />
                    </div>
                    <div className="w-16 text-sm font-semibold text-gray-700 text-right flex-shrink-0">
                      {periodData?.avgCount || 0} 次
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDailyUsageBarChart = () => {
    if (selectedDailyUsage.length === 0) return null;

    const barWidth = Math.min(60, chartInnerWidth / selectedDailyUsage.length - 20);
    const barGap = (chartInnerWidth - barWidth * selectedDailyUsage.length) / (selectedDailyUsage.length + 1);

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[500px]" preserveAspectRatio="xMidYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartInnerHeight - chartInnerHeight * ratio;
          const value = Math.round(maxDailyUsage * ratio);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f0f0f0" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="10">
                {value}
              </text>
            </g>
          );
        })}

        {selectedDailyUsage.map((item, index) => {
          const color = getFloorColor(index);
          const x = padding.left + barGap + index * (barWidth + barGap);
          const barHeight = (item.avgDailyUsage / maxDailyUsage) * chartInnerHeight;
          const y = padding.top + chartInnerHeight - barHeight;
          const floor = floors.find((f) => f.id === item.floorId);

          return (
            <g key={item.floorId}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill={color.main} rx="4" />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fill="#374151"
                fontSize="11"
                fontWeight="600"
              >
                {item.avgDailyUsage}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight - padding.bottom + 16}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="11"
              >
                {floor?.floorNumber}楼
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderLegend = () => {
    if (selectedTrends.length === 0 && selectedPeaks.length === 0) return null;

    const items = selectedTrends.length > 0 ? selectedTrends : selectedPeaks;

    return (
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
        {items.map((item, index) => {
          const color = getFloorColor(index);
          const floor = floors.find((f) => f.id === item.floorId);
          return (
            <div key={item.floorId} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.main }} />
              <span className="text-sm text-gray-600">
                {floor?.floorNumber}楼 {floor?.floorName}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedFloorNames = selectedFloorIds
    .map((id) => floors.find((f) => f.id === id))
    .filter(Boolean)
    .map((f) => `${f!.floorNumber}楼`)
    .join('、');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">楼层对比分析</h3>
            <p className="text-sm text-gray-500">选择多个楼层进行横向对比</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFloorDropdown(!showFloorDropdown)}
            disabled={loading || floors.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors border border-gray-200 disabled:opacity-50"
          >
            <span>
              {selectedFloorIds.length > 0
                ? `已选 ${selectedFloorIds.length} 个楼层`
                : '选择楼层'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFloorDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showFloorDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFloorDropdown(false)}
              />
              <div className="absolute right-0 top-12 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-56">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">选择楼层</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      全选
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={clearAll}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      清空
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {floors.map((floor) => {
                    const isSelected = selectedFloorIds.includes(floor.id);
                    return (
                      <button
                        key={floor.id}
                        onClick={() => toggleFloor(floor.id)}
                        className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700">
                          {floor.floorNumber}楼 {floor.floorName}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 bg-primary-500 rounded flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        </div>
      ) : selectedFloorIds.length === 0 ? (
        <div className="py-16 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">请选择要对比的楼层</p>
          <p className="text-sm text-gray-400">支持同时选择多个楼层进行横向对比分析</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <h4 className="font-semibold text-gray-800">占用率趋势对比</h4>
            </div>
            <div className="overflow-x-auto">
              {renderTrendChart()}
            </div>
            {renderLegend()}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-amber-500" />
                <h4 className="font-semibold text-gray-800">高峰时段分布对比</h4>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                {renderPeakComparison()}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                <h4 className="font-semibold text-gray-800">日均使用次数对比</h4>
              </div>
              <div className="overflow-x-auto">
                {renderDailyUsageBarChart()}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span>详细数据对比</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 rounded-l-lg">楼层</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">总使用次数</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">日均使用</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">最高日使用</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 rounded-r-lg">平均占用率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedDailyUsage.map((item, index) => {
                    const color = getFloorColor(index);
                    const floor = floors.find((f) => f.id === item.floorId);
                    return (
                      <tr key={item.floorId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.main }} />
                            <span className="font-medium text-gray-800">
                              {floor?.floorNumber}楼 {floor?.floorName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">{item.totalUsage}</td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-900">{item.avgDailyUsage}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{item.maxDailyUsage}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                            {item.avgOccupancyRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
