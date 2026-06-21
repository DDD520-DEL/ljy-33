import { useEffect } from 'react';
import { Building2, Users, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useBathroomStore } from '../store/useBathroomStore';
import FloorCard from '../components/FloorCard';
import ErrorAlert from '../components/ErrorAlert';

export default function Home() {
  const { floors, loading, error, currentAlertCount, fetchFloors, startPolling, stopPolling, clearError } = useBathroomStore();

  useEffect(() => {
    fetchFloors();
    startPolling();
    return () => stopPolling();
  }, [fetchFloors, startPolling, stopPolling]);

  const totalStalls = floors.reduce((sum, f) => sum + f.totalStalls, 0);
  const totalOccupied = floors.reduce((sum, f) => sum + f.occupiedStalls, 0);
  const totalAvailable = floors.reduce((sum, f) => sum + f.availableStalls, 0);
  const overallOccupancy = totalStalls > 0 ? Math.round((totalOccupied / totalStalls) * 100) : 0;

  const hasAvailable = totalAvailable > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">写字楼卫生间状态</h1>
              <p className="text-primary-100 mt-1">实时监控 · 数据每5秒自动刷新</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="w-4 h-4 text-primary-200" />
                <span className="text-sm text-primary-100">总楼层</span>
              </div>
              <p className="text-3xl font-bold">{floors.length}</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-primary-200" />
                <span className="text-sm text-primary-100">总隔间</span>
              </div>
              <p className="text-3xl font-bold">{totalStalls}</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-success-300" />
                <span className="text-sm text-primary-100">空闲中</span>
              </div>
              <p className="text-3xl font-bold text-success-300">{totalAvailable}</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                {hasAvailable ? (
                  <CheckCircle className="w-4 h-4 text-success-300" />
                ) : (
                  <Users className="w-4 h-4 text-warning-300" />
                )}
                <span className="text-sm text-primary-100">占用率</span>
              </div>
              <p className={`text-3xl font-bold ${
                overallOccupancy >= 80 ? 'text-warning-300' : 'text-white'
              }`}>
                {overallOccupancy}%
              </p>
            </div>

            <div className={`backdrop-blur rounded-xl p-4 transition-all duration-300 ${
              currentAlertCount > 0
                ? 'bg-danger-500/30 border-2 border-danger-400 animate-pulse'
                : 'bg-white/10'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className={`w-4 h-4 ${
                  currentAlertCount > 0 ? 'text-danger-300' : 'text-primary-200'
                }`} />
                <span className={`text-sm ${
                  currentAlertCount > 0 ? 'text-white' : 'text-primary-100'
                }`}>异常告警</span>
              </div>
              <p className={`text-3xl font-bold ${
                currentAlertCount > 0 ? 'text-white' : 'text-white'
              }`}>
                {currentAlertCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <ErrorAlert
            message={error}
            onRetry={fetchFloors}
            onDismiss={clearError}
          />
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">各楼层状态</h2>
          <button
            onClick={fetchFloors}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>

        {loading && floors.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
              >
                <div className="h-8 w-24 bg-gray-200 rounded mb-4" />
                <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                <div className="h-2 w-full bg-gray-100 rounded mb-4" />
                <div className="h-10 w-full bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {floors.map((floor, index) => (
              <FloorCard key={floor.id} floor={floor} index={index} />
            ))}
          </div>
        )}

        <div className="mt-8 bg-primary-50 rounded-2xl p-6 border border-primary-100">
          <h3 className="font-bold text-primary-900 mb-2">使用说明</h3>
          <ul className="space-y-2 text-sm text-primary-700">
            <li className="flex items-start space-x-2">
              <span className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 text-xs font-bold">1</span>
              </span>
              <span>点击楼层卡片查看该楼层卫生间详细状态</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 text-xs font-bold">2</span>
              </span>
              <span>进入卫生间后，点击对应隔间的"标记使用中"按钮</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 text-xs font-bold">3</span>
              </span>
              <span>使用完毕后，记得点击"标记空闲"释放状态</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
