import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useBathroomStore } from '../store/useBathroomStore';
import StallCard from '../components/StallCard';
import type { StallStatus } from '../types';

export default function FloorDetail() {
  const { floorId } = useParams<{ floorId: string }>();
  const { currentFloor, loading, fetchFloorStatus, updateStallStatus, startPolling, stopPolling } = useBathroomStore();

  useEffect(() => {
    if (floorId) {
      fetchFloorStatus(floorId);
      startPolling(floorId);
    }
    return () => stopPolling();
  }, [floorId, fetchFloorStatus, startPolling, stopPolling]);

  const handleStatusChange = async (stallId: string, status: StallStatus) => {
    await updateStallStatus(stallId, status);
  };

  if (!currentFloor && loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
            <div className="h-24 w-full bg-gray-200 rounded-2xl mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentFloor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">未找到该楼层信息</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回首页</span>
          </Link>
        </div>
      </div>
    );
  }

  const occupancyRate = Math.round(
    (currentFloor.occupiedStalls / currentFloor.totalStalls) * 100
  );

  const hasAvailable = currentFloor.availableStalls > 0;

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

          <div className="grid grid-cols-3 gap-4 mt-8">
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
          </div>

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
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
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
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentFloor.stalls
            .sort((a, b) => a.stallNumber - b.stallNumber)
            .map((stall, index) => (
              <StallCard
                key={stall.id}
                stall={stall}
                onStatusChange={handleStatusChange}
                index={index}
              />
            ))}
        </div>

        <div className="mt-8 bg-amber-50 rounded-2xl p-6 border border-amber-100">
          <h3 className="font-bold text-amber-900 mb-2">温馨提示</h3>
          <ul className="space-y-1.5 text-sm text-amber-700">
            <li>• 请在进入隔间后及时标记"使用中"</li>
            <li>• 使用完毕后请记得标记"空闲"，方便他人查看</li>
            <li>• 如发现设施故障，请联系物业进行维修</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
