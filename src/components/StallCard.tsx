import { useState } from 'react';
import { CheckCircle, XCircle, Wrench, Clock, AlertTriangle, Timer, MoreVertical, BarChart3, CalendarCheck, Lock } from 'lucide-react';
import { TIMEOUT_THRESHOLD_MINUTES } from '../types';
import type { Stall, StallStatus } from '../types';

interface StallCardProps {
  stall: Stall;
  onStatusChange: (stallId: string, status: StallStatus) => void;
  index: number;
  avgDurationMinutes?: number;
}

export default function StallCard({ stall, onStatusChange, index, avgDurationMinutes }: StallCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = {
    available: {
      label: '空闲',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      textColor: 'text-success-700',
      iconColor: 'text-success-500',
      dotColor: 'bg-success-500',
      Icon: CheckCircle,
    },
    occupied: {
      label: '使用中',
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      textColor: 'text-danger-700',
      iconColor: 'text-danger-500',
      dotColor: 'bg-danger-500',
      Icon: XCircle,
    },
    maintenance: {
      label: '维护中',
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      textColor: 'text-warning-700',
      iconColor: 'text-warning-500',
      dotColor: 'bg-warning-500',
      Icon: Wrench,
    },
    reserved: {
      label: '已预约',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-300',
      textColor: 'text-primary-700',
      iconColor: 'text-primary-600',
      dotColor: 'bg-primary-500',
      Icon: CalendarCheck,
    },
  };

  const config = statusConfig[stall.status];
  const Icon = config.Icon;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const getOccupiedDuration = () => {
    if (!stall.occupiedStartTime || stall.status !== 'occupied') return null;
    const durationMs = Date.now() - stall.occupiedStartTime;
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${minutes}分钟`;
  };

  const getReservedRemainingMinutes = () => {
    if (stall.status !== 'reserved' || !stall.reservedUntil) return null;
    const remaining = stall.reservedUntil - Date.now();
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / 60000);
  };

  const occupiedDuration = getOccupiedDuration();
  const reservedRemaining = getReservedRemainingMinutes();

  const handleQuickToggle = async () => {
    if (isUpdating) return;
    if (stall.status === 'reserved') return;
    setIsUpdating(true);
    const newStatus: StallStatus = stall.status === 'available' ? 'occupied' : 'available';
    await onStatusChange(stall.id, newStatus);
    setIsUpdating(false);
    setShowMenu(false);
  };

  const handleStatusChange = async (newStatus: StallStatus) => {
    if (isUpdating) return;
    if (stall.status === 'reserved' && newStatus !== 'occupied' && newStatus !== 'available') return;
    setIsUpdating(true);
    await onStatusChange(stall.id, newStatus);
    setIsUpdating(false);
    setShowMenu(false);
  };

  const handleUseReserved = async () => {
    if (isUpdating || stall.status !== 'reserved') return;
    setIsUpdating(true);
    await onStatusChange(stall.id, 'occupied');
    setIsUpdating(false);
    setShowMenu(false);
  };

  const handleReleaseReserved = async () => {
    if (isUpdating || stall.status !== 'reserved') return;
    setIsUpdating(true);
    await onStatusChange(stall.id, 'available');
    setIsUpdating(false);
    setShowMenu(false);
  };

  const isAbnormal = stall.isAbnormal;

  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-md animate-fade-in-up ${isUpdating ? 'opacity-70' : ''} ${
        isAbnormal
          ? 'bg-danger-100 border-danger-500 shadow-lg shadow-danger-500/30 ring-4 ring-danger-500/20'
          : stall.status === 'reserved'
          ? 'bg-primary-50 border-primary-300 shadow-md shadow-primary-200/40'
          : `${config.bgColor} ${config.borderColor}`
      }`}
      style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}
    >
      {stall.status === 'reserved' && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
            <Lock className="w-3.5 h-3.5" />
            <span>已预约锁定</span>
          </div>
        </div>
      )}

      {isAbnormal && (
        <div className="absolute -top-3 -right-3 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-danger-500 rounded-full animate-ping opacity-50" />
            <div className="relative bg-gradient-to-r from-danger-500 to-danger-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>超时异常</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            isAbnormal
              ? 'bg-danger-200 border-danger-400'
              : stall.status === 'reserved'
              ? 'bg-primary-100 border-primary-300'
              : `${config.bgColor} ${config.borderColor}`
          }`}>
            {isAbnormal ? (
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            ) : stall.status === 'reserved' ? (
              <CalendarCheck className="w-5 h-5 text-primary-600" />
            ) : (
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            )}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              isAbnormal ? 'text-danger-900' : 'text-gray-900'
            }`}>
              {stall.stallNumber} 号隔间
            </h3>
            <p className={`text-sm font-medium ${
              isAbnormal ? 'text-danger-700' : config.textColor
            }`}>
              {isAbnormal ? '超时占用' : config.label}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isAbnormal ? 'bg-danger-600 animate-bounce' : config.dotColor
          } ${
            stall.status === 'occupied' || stall.status === 'reserved' ? 'animate-pulse' : ''
          }`} />
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
              disabled={isUpdating}
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-8 z-30 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-36">
                  {stall.status === 'reserved' && (
                    <>
                      <button
                        onClick={handleUseReserved}
                        disabled={isUpdating}
                        className="w-full px-4 py-2 text-left text-sm text-primary-700 hover:bg-primary-50 transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>我要使用</span>
                      </button>
                      <button
                        onClick={handleReleaseReserved}
                        disabled={isUpdating}
                        className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>释放预约</span>
                      </button>
                    </>
                  )}
                  {stall.status !== 'reserved' && stall.status !== 'available' && (
                    <button
                      onClick={() => handleStatusChange('available')}
                      disabled={isUpdating}
                      className="w-full px-4 py-2 text-left text-sm text-success-700 hover:bg-success-50 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>标记空闲</span>
                    </button>
                  )}
                  {stall.status !== 'reserved' && stall.status !== 'occupied' && (
                    <button
                      onClick={() => handleStatusChange('occupied')}
                      disabled={isUpdating}
                      className="w-full px-4 py-2 text-left text-sm text-danger-700 hover:bg-danger-50 transition-colors flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>标记使用中</span>
                    </button>
                  )}
                  {stall.status !== 'reserved' && stall.status !== 'maintenance' && (
                    <button
                      onClick={() => handleStatusChange('maintenance')}
                      disabled={isUpdating}
                      className="w-full px-4 py-2 text-left text-sm text-warning-700 hover:bg-warning-50 transition-colors flex items-center space-x-2"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>标记维护中</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>最后更新: {formatTime(stall.lastUpdated)}</span>
        </div>
        {avgDurationMinutes !== undefined && (
          <div className="flex items-center space-x-1 text-xs text-blue-600">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>近7天平均: {avgDurationMinutes} 分钟</span>
          </div>
        )}
        {occupiedDuration && (
          <div className={`flex items-center space-x-1 text-xs ${
            isAbnormal ? 'text-danger-600 font-semibold' : 'text-amber-600'
          }`}>
            <Timer className="w-3.5 h-3.5" />
            <span>已使用: {occupiedDuration}</span>
            {isAbnormal && (
              <span className="ml-1 text-danger-600">
                (超过 {TIMEOUT_THRESHOLD_MINUTES} 分钟)
              </span>
            )}
          </div>
        )}
        {stall.status === 'reserved' && reservedRemaining !== null && (
          <div className="flex items-center space-x-1 text-xs text-primary-600 font-medium">
            <Timer className="w-3.5 h-3.5" />
            <span>
              {reservedRemaining > 0
                ? `预约剩余: ${reservedRemaining} 分钟`
                : '预约即将超时'}
            </span>
          </div>
        )}
      </div>

      {stall.status === 'reserved' ? (
        <div className="space-y-2">
          <button
            onClick={handleUseReserved}
            disabled={isUpdating}
            className="w-full py-2.5 px-4 rounded-xl text-white font-medium text-sm transition-all duration-200 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center space-x-2"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{isUpdating ? '更新中...' : '我要使用这个隔间'}</span>
          </button>
          <p className="text-xs text-center text-primary-600/70">
            此隔间已被预约锁定，预约用户可点击上方按钮开始使用
          </p>
        </div>
      ) : (
        <button
          onClick={handleQuickToggle}
          disabled={isUpdating}
          className={`w-full py-2.5 px-4 rounded-xl text-white font-medium text-sm transition-all duration-200 ${
            isAbnormal
              ? 'bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-danger-700 shadow-lg shadow-danger-500/30'
              : stall.status === 'available'
              ? 'bg-danger-500 hover:bg-danger-600'
              : stall.status === 'maintenance'
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-success-500 hover:bg-success-600'
          } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
        >
          {isUpdating
            ? '更新中...'
            : isAbnormal
            ? '解除异常'
            : stall.status === 'available'
            ? '标记使用中'
            : stall.status === 'maintenance'
            ? '解除维护'
            : '标记空闲'}
        </button>
      )}

      {stall.status === 'occupied' && !isAbnormal && (
        <div className="absolute -top-1 -right-1 w-4 h-4">
          <div className="absolute inset-0 rounded-full bg-danger-400 animate-ping opacity-75" />
          <div className="relative rounded-full w-4 h-4 bg-danger-500" />
        </div>
      )}
    </div>
  );
}
