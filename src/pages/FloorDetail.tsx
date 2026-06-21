import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, Clock, RefreshCw, UserPlus, X, Timer, AlertCircle, AlertTriangle } from 'lucide-react';
import { useBathroomStore } from '../store/useBathroomStore';
import StallCard from '../components/StallCard';
import ErrorAlert from '../components/ErrorAlert';
import { getStallDurationRanking } from '../utils/api';
import type { StallStatus, QueueItem, StallDurationRank } from '../types';

export default function FloorDetail() {
  const { floorId } = useParams<{ floorId: string }>();
  const {
    currentFloor,
    currentQueue,
    loading,
    queueLoading,
    error,
    fetchFloorStatus,
    fetchFloorQueue,
    updateStallStatus,
    joinQueue,
    leaveQueue,
    startPolling,
    stopPolling,
    clearError,
  } = useBathroomStore();

  const [visitorName, setVisitorName] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [myQueueItem, setMyQueueItem] = useState<QueueItem | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [stallDurations, setStallDurations] = useState<StallDurationRank[]>([]);
  const [durationsLoading, setDurationsLoading] = useState(false);

  useEffect(() => {
    if (floorId) {
      fetchFloorStatus(floorId);
      fetchFloorQueue(floorId);
      startPolling(floorId);
    }
    return () => stopPolling();
  }, [floorId, fetchFloorStatus, fetchFloorQueue, startPolling, stopPolling]);

  const fetchStallDurations = async (floorId: string) => {
    setDurationsLoading(true);
    try {
      const { data } = await getStallDurationRanking(7, floorId);
      setStallDurations(data);
    } catch (err) {
      console.error('Fetch stall durations error:', err);
    } finally {
      setDurationsLoading(false);
    }
  };

  useEffect(() => {
    if (floorId) {
      fetchStallDurations(floorId);
    }
  }, [floorId]);

  const getAvgDurationForStall = (stallId: string): number | undefined => {
    const stall = stallDurations.find((s) => s.stallId === stallId);
    return stall?.avgDurationMinutes;
  };

  useEffect(() => {
    if (myQueueItem && currentQueue) {
      const found = currentQueue.items.find((item) => item.id === myQueueItem.id);
      if (found) {
        setMyQueueItem(found);
      } else {
        const wasFirst = myQueueItem.position === 1;
        if (wasFirst && currentFloor?.availableStalls && currentFloor.availableStalls > 0) {
          setMyQueueItem(null);
        } else {
          setMyQueueItem(null);
        }
      }
    }
  }, [currentQueue, currentFloor, myQueueItem]);

  const handleStatusChange = async (stallId: string, status: StallStatus) => {
    await updateStallStatus(stallId, status);
  };

  const handleJoinQueue = async () => {
    if (!floorId || !visitorName.trim()) return;

    setIsJoining(true);
    setJoinError(null);
    try {
      const item = await joinQueue(floorId, visitorName.trim());
      setMyQueueItem(item);
      setShowJoinModal(false);
      setVisitorName('');
    } catch (err) {
      setJoinError((err as Error).message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!myQueueItem) return;
    try {
      await leaveQueue(myQueueItem.id);
      setMyQueueItem(null);
    } catch (err) {
      console.error('Leave queue error:', err);
    }
  };

  const occupancyRate = currentFloor
    ? Math.round((currentFloor.occupiedStalls / currentFloor.totalStalls) * 100)
    : 0;

  const hasAvailable = currentFloor ? currentFloor.availableStalls > 0 : true;
  const allOccupied = currentFloor ? currentFloor.availableStalls === 0 && currentFloor.occupiedStalls > 0 : false;
  const abnormalCount = currentFloor
    ? currentFloor.stalls.filter((s) => s.isAbnormal).length
    : 0;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${
        hasAvailable ? 'bg-gradient-to-br from-primary-600 to-primary-800' : 'bg-gradient-to-br from-warning-600 to-warning-800'
      } text-white`}>
        <div className="container mx-auto px-4 py-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回总览</span>
          </Link>

          {currentFloor ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-end space-x-2">
                  <span className="text-5xl font-bold">{currentFloor.floorNumber}</span>
                  <span className="text-2xl text-white/70 pb-2">楼</span>
                </div>
                <p className="text-white/70 mt-1">{currentFloor.floorName} 卫生间</p>
              </div>

              <button
                onClick={() => floorId && fetchFloorStatus(floorId)}
                disabled={loading}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ) : (
            <div className="animate-pulse">
              <div className="h-16 w-48 bg-white/20 rounded-xl mb-2" />
              <div className="h-4 w-40 bg-white/10 rounded" />
            </div>
          )}

          {currentFloor ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white/70">总隔间</span>
                </div>
                <p className="text-2xl font-bold">{currentFloor.totalStalls}</p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-success-300" />
                  <span className="text-sm text-white/70">空闲</span>
                </div>
                <p className="text-2xl font-bold text-success-300">
                  {currentFloor.availableStalls}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-danger-300" />
                  <span className="text-sm text-white/70">使用中</span>
                </div>
                <p className="text-2xl font-bold text-danger-300">
                  {currentFloor.occupiedStalls}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="w-4 h-4 text-amber-300" />
                  <span className="text-sm text-white/70">排队中</span>
                </div>
                <p className="text-2xl font-bold text-amber-300">
                  {queueLoading ? '...' : currentQueue?.count ?? 0}
                </p>
              </div>

              <div className={`backdrop-blur rounded-xl p-4 transition-all duration-300 ${
                abnormalCount > 0
                  ? 'bg-danger-500/40 border-2 border-danger-400 animate-pulse'
                  : 'bg-white/10'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    abnormalCount > 0 ? 'text-white' : 'text-white/60'
                  }`} />
                  <span className={`text-sm ${
                    abnormalCount > 0 ? 'text-white' : 'text-white/70'
                  }`}>异常</span>
                </div>
                <p className={`text-2xl font-bold ${
                  abnormalCount > 0 ? 'text-white' : 'text-white'
                }`}>
                  {abnormalCount}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4 animate-pulse">
                  <div className="h-4 w-16 bg-white/20 rounded mb-2" />
                  <div className="h-8 w-12 bg-white/20 rounded" />
                </div>
              ))}
            </div>
          )}

          {currentFloor && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>占用率</span>
                <span className="font-medium">{occupancyRate}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    hasAvailable ? 'bg-success-400' : 'bg-warning-400'
                  }`}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <ErrorAlert
            message={error}
            onRetry={() => floorId && fetchFloorStatus(floorId)}
            onDismiss={clearError}
          />
        )}

        {myQueueItem && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-white/80">您正在排队</p>
                  <p className="text-2xl font-bold">
                    第 {myQueueItem.position} 位
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/80 mb-1">
                  预计等待约 {Math.max(1, myQueueItem.position * 3)} 分钟
                </p>
                <button
                  onClick={handleLeaveQueue}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                >
                  取消排队
                </button>
              </div>
            </div>
          </div>
        )}

        {allOccupied && !myQueueItem && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900">所有隔间已满</h3>
                  <p className="text-sm text-amber-700 mt-0.5">
                    当前有 {currentQueue?.count ?? 0} 人在排队，加入队列后空位释放时自动通知您
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>加入排队</span>
              </button>
            </div>
          </div>
        )}

        {currentQueue && currentQueue.count > 0 && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center space-x-2">
                <Timer className="w-5 h-5 text-amber-500" />
                <span>等待队列</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-sm rounded-full">
                  {currentQueue.count} 人
                </span>
              </h3>
            </div>
            <div className="space-y-2">
              {currentQueue.items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    myQueueItem?.id === item.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.position === 1
                        ? 'bg-amber-500 text-white'
                        : item.position === 2
                        ? 'bg-gray-400 text-white'
                        : item.position === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {item.position}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        myQueueItem?.id === item.id ? 'text-primary-700' : 'text-gray-800'
                      }`}>
                        {item.visitorName}
                        {myQueueItem?.id === item.id && (
                          <span className="ml-2 text-xs text-primary-500">(我)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        加入时间: {formatTime(item.joinedAt)}
                      </p>
                    </div>
                  </div>
                  {item.position === 1 && (
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                      下一位
                    </span>
                  )}
                </div>
              ))}
              {currentQueue.count > 5 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  还有 {currentQueue.count - 5} 人在排队...
                </p>
              )}
            </div>
          </div>
        )}

        {!currentFloor && loading ? (
          <div className="animate-pulse">
            <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : !currentFloor && !error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-500 mb-4">未找到该楼层信息</p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </Link>
          </div>
        ) : currentFloor ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">隔间状态</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-success-500" />
                  <span className="text-gray-600">空闲</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-danger-500 animate-pulse" />
                  <span className="text-gray-600">使用中</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-warning-500" />
                  <span className="text-gray-600">维护中</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-danger-600 ring-2 ring-danger-400 animate-bounce" />
                  <span className="text-danger-600 font-semibold">超时异常</span>
                </div>
              </div>
            </div>

            {abnormalCount > 0 && (
              <div className="mb-6 bg-danger-50 border-2 border-danger-200 rounded-2xl p-5 animate-pulse-slow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-danger-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-danger-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-danger-900 text-lg">
                      发现 {abnormalCount} 个超时占用的蹲位
                    </h3>
                    <p className="text-sm text-danger-700 mt-1">
                      以下蹲位连续占用时间已超过 20 分钟，请及时确认是否存在异常情况，确保使用安全。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentFloor.stalls
                .sort((a, b) => a.stallNumber - b.stallNumber)
                .map((stall, index) => (
                  <StallCard
                    key={stall.id}
                    stall={stall}
                    onStatusChange={handleStatusChange}
                    index={index}
                    avgDurationMinutes={getAvgDurationForStall(stall.id)}
                  />
                ))}
            </div>

            <div className="mt-8 bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <h3 className="font-bold text-amber-900 mb-2">温馨提示</h3>
              <ul className="space-y-1.5 text-sm text-amber-700">
                <li>• 请在进入隔间后及时标记"使用中"</li>
                <li>• 使用完毕后请记得标记"空闲"，方便他人查看</li>
                <li>• 如发现设施故障，请联系物业进行维修</li>
                <li>• 所有隔间满时可加入等待队列，有空位时自动按顺序通知</li>
              </ul>
            </div>
          </>
        ) : null}
      </div>

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">加入排队</h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setVisitorName('');
                  setJoinError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">楼层</span>
                <span className="font-medium text-gray-900">
                  {currentFloor?.floorNumber}楼 {currentFloor?.floorName}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">当前排队人数</span>
                <span className="font-medium text-amber-600">
                  {currentQueue?.count ?? 0} 人
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                您的称呼
              </label>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="请输入您的称呼"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinQueue();
                  }
                }}
              />
              {joinError && (
                <p className="mt-2 text-sm text-red-600">{joinError}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setVisitorName('');
                  setJoinError(null);
                }}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleJoinQueue}
                disabled={!visitorName.trim() || isJoining}
                className="flex-1 py-3 px-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? '加入中...' : '确认排队'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
