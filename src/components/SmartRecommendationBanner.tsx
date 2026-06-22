import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Zap,
  Building2,
} from 'lucide-react';
import type { SmartRecommendation, FloorPrediction } from '../types';

interface SmartRecommendationBannerProps {
  recommendation: SmartRecommendation;
  loading?: boolean;
}

export default function SmartRecommendationBanner({
  recommendation,
  loading = false,
}: SmartRecommendationBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl p-6 mb-8 animate-pulse">
        <div className="h-6 w-48 bg-emerald-200 rounded mb-3" />
        <div className="h-4 w-64 bg-emerald-100 rounded" />
      </div>
    );
  }

  const { recommendedFloor, allFloorPredictions, currentTime, isWeekend } = recommendation;

  const getVacancyColor = (rate: number) => {
    if (rate >= 70) return 'text-emerald-600';
    if (rate >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getVacancyBgColor = (rate: number) => {
    if (rate >= 70) return 'bg-emerald-500';
    if (rate >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <Zap className="w-3 h-3 mr-1" />
          高置信度 {confidence}%
        </span>
      );
    }
    if (confidence >= 60) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Zap className="w-3 h-3 mr-1" />
          中置信度 {confidence}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <Zap className="w-3 h-3 mr-1" />
        低置信度 {confidence}%
      </span>
    );
  };

  const FloorRow = ({ floor, rank }: { floor: FloorPrediction; rank: number }) => (
    <Link
      to={`/floor/${floor.floorId}`}
      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/80 transition-colors border border-transparent hover:border-emerald-100 group"
    >
      <div className="flex items-center space-x-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            rank === 0
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
              : rank === 1
              ? 'bg-gradient-to-br from-cyan-300 to-cyan-400 text-white'
              : rank === 2
              ? 'bg-gradient-to-br from-amber-300 to-amber-400 text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {rank + 1}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">{floor.floorNumber}楼</span>
            <span className="text-xs text-gray-500">{floor.floorName.split(' ').slice(1).join(' ')}</span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center">
              <Building2 className="w-3 h-3 mr-1" />
              共{floor.totalStalls}间
            </span>
            <span className="flex items-center">
              <Target className="w-3 h-3 mr-1" />
              当前空闲 {floor.currentAvailableStalls}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-lg font-bold ${getVacancyColor(floor.next30MinAvgVacancyRate)}`}>
          {floor.next30MinAvgVacancyRate}%
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getVacancyBgColor(floor.next30MinAvgVacancyRate)}`}
              style={{ width: `${floor.next30MinAvgVacancyRate}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">空闲率</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="mb-8 overflow-hidden rounded-2xl shadow-lg border border-emerald-100 animate-fade-in-up">
      <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-24 blur-2xl" />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse-slow">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-xl font-bold">智能如厕推荐</h3>
                  {getConfidenceBadge(recommendedFloor.confidence)}
                </div>
                <p className="text-emerald-50 text-sm flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  基于近{recommendation.historicalDays}天数据分析 · 更新于 {currentTime}
                  {isWeekend && (
                    <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">周末模式</span>
                  )}
                </p>
              </div>
            </div>
            <Link
              to={`/floor/${recommendedFloor.floorId}`}
              className="hidden sm:flex items-center space-x-2 bg-white text-emerald-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <MapPin className="w-4 h-4" />
              <span>立即前往</span>
            </Link>
          </div>

          <div className="bg-white/15 backdrop-blur rounded-2xl p-5 border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-emerald-50 text-sm mb-2">当前最佳前往楼层</p>
                <div className="flex items-baseline space-x-3">
                  <span className="text-5xl font-black tracking-tight">
                    {recommendedFloor.floorNumber}
                  </span>
                  <span className="text-2xl font-bold opacity-90">楼</span>
                  <span className="text-lg text-emerald-50 ml-2">
                    {recommendedFloor.floorName.split(' ').slice(1).join(' ')}
                  </span>
                </div>
                <p className="text-emerald-50 mt-2 text-sm max-w-lg">
                  该楼层未来{recommendation.analysisWindowMinutes}分钟内预计空闲率最高
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center text-emerald-100 mb-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-xs">30分钟空闲率</span>
                  </div>
                  <p className="text-3xl font-black">{recommendedFloor.next30MinAvgVacancyRate}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-emerald-100 mb-1">
                    <Target className="w-4 h-4 mr-1" />
                    <span className="text-xs">当前空闲</span>
                  </div>
                  <p className="text-3xl font-black">{recommendedFloor.currentAvailableStalls}</p>
                  <p className="text-xs text-emerald-100">/ {recommendedFloor.totalStalls} 间</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-emerald-100 mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-xs">预计占用率</span>
                  </div>
                  <p className="text-3xl font-black">{recommendedFloor.predictedOccupancyRate}%</p>
                </div>
              </div>
            </div>

            <Link
              to={`/floor/${recommendedFloor.floorId}`}
              className="sm:hidden mt-4 flex items-center justify-center space-x-2 bg-white text-emerald-600 px-5 py-3 rounded-xl font-semibold w-full"
            >
              <MapPin className="w-4 h-4" />
              <span>立即前往{recommendedFloor.floorNumber}楼</span>
            </Link>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex items-center justify-center space-x-1 text-white/80 hover:text-white text-sm w-full py-2 transition-colors"
          >
            <span>{expanded ? '收起全部楼层对比' : '查看全部楼层对比'}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-gradient-to-b from-emerald-50 to-white p-5 border-t border-emerald-100">
          <div className="flex items-center justify-between mb-4 px-3">
            <h4 className="font-semibold text-gray-700">全部楼层预测排名</h4>
            <span className="text-xs text-gray-500">按未来30分钟空闲率排序</span>
          </div>
          <div className="space-y-1">
            {allFloorPredictions.map((floor, index) => (
              <FloorRow key={floor.floorId} floor={floor} rank={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
