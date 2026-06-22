import { useEffect, useState } from 'react';
import { Star, MessageSquare, Building2, Clock, Sparkles } from 'lucide-react';
import { useBathroomStore } from '../store/useBathroomStore';
import StarRating from '../components/StarRating';
import type { FloorReviewSummary } from '../types';

export default function Reviews() {
  const {
    allFloorReviewSummaries,
    reviewSummariesLoading,
    fetchAllFloorReviewSummaries,
    reviews,
    reviewsLoading,
    fetchReviewsByFloor,
  } = useBathroomStore();

  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchAllFloorReviewSummaries(days);
  }, [fetchAllFloorReviewSummaries, days]);

  useEffect(() => {
    if (selectedFloorId) {
      fetchReviewsByFloor(selectedFloorId, 20);
    }
  }, [selectedFloorId, fetchReviewsByFloor]);

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium flex items-center space-x-1">
          <Sparkles className="w-3 h-3" />
          <span>第1名</span>
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
          第2名
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
          第3名
        </span>
      );
    }
    return null;
  };

  const allReviews = selectedFloorId
    ? reviews
    : allFloorReviewSummaries.flatMap((s) => s.recentReviews).sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
            <span>卫生间评分榜</span>
          </h1>
          <p className="text-gray-500 mt-2">
            基于访客真实评价，按楼层展示近 {days} 天的平均评分
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">统计周期：</span>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  days === d
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                近{d}天
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 mb-6">
                <Building2 className="w-5 h-5 text-primary-600" />
                <span>楼层评分排行</span>
              </h2>

              {reviewSummariesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-100 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : allFloorReviewSummaries.length > 0 ? (
                <div className="space-y-3">
                  {allFloorReviewSummaries.map((summary, index) => (
                    <div
                      key={summary.floorId}
                      onClick={() => setSelectedFloorId(selectedFloorId === summary.floorId ? null : summary.floorId)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedFloorId === summary.floorId
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                            index === 0
                              ? 'bg-amber-100 text-amber-700'
                              : index === 1
                              ? 'bg-gray-100 text-gray-700'
                              : index === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-50 text-gray-500'
                          }`}>
                            {summary.floorNumber}F
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">
                                {summary.floorName}
                              </span>
                              {getRankBadge(index)}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <StarRating value={Math.round(summary.avgOverall)} readonly size="sm" />
                              <span className="text-sm text-gray-500">
                                {summary.totalReviews} 条评价
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary-600">
                            {summary.avgOverall}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            综合评分
                          </div>
                        </div>
                      </div>

                      {selectedFloorId === summary.floorId && (
                        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">整洁度</p>
                            <p className="text-xl font-bold text-gray-800">{summary.avgCleanliness}</p>
                            <div className="mt-1">
                              <StarRating value={Math.round(summary.avgCleanliness)} readonly size="sm" />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">气味</p>
                            <p className="text-xl font-bold text-gray-800">{summary.avgOdor}</p>
                            <div className="mt-1">
                              <StarRating value={Math.round(summary.avgOdor)} readonly size="sm" />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-1">设施完好度</p>
                            <p className="text-xl font-bold text-gray-800">{summary.avgFacilities}</p>
                            <div className="mt-1">
                              <StarRating value={Math.round(summary.avgFacilities)} readonly size="sm" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无评分数据</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2 mb-6">
                <MessageSquare className="w-5 h-5 text-primary-600" />
                <span>最新评价</span>
                {selectedFloorId && (
                  <span className="text-xs text-gray-500 font-normal">
                    （已筛选楼层）
                  </span>
                )}
              </h2>

              {reviewsLoading && selectedFloorId ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-100 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : allReviews.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {allReviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-800">
                            {review.visitorName}
                          </span>
                          <span className="text-xs text-gray-400 px-2 py-0.5 bg-white rounded">
                            {review.floorNumber}F
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(review.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 mb-2">
                        <StarRating
                          value={Math.round(
                            (review.cleanliness + review.odor + review.facilities) / 3
                          )}
                          readonly
                          size="sm"
                        />
                        <span className="text-sm font-medium text-amber-600">
                          {((review.cleanliness + review.odor + review.facilities) / 3).toFixed(1)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                        <span>整洁 {review.cleanliness}</span>
                        <span>·</span>
                        <span>气味 {review.odor}</span>
                        <span>·</span>
                        <span>设施 {review.facilities}</span>
                      </div>

                      {review.comment && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无评价</p>
                </div>
              )}

              {selectedFloorId && (
                <button
                  onClick={() => setSelectedFloorId(null)}
                  className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  清除筛选，查看全部评价
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
