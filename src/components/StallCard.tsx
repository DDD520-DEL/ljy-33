import { useState } from 'react';
import { CheckCircle, XCircle, Wrench, Clock } from 'lucide-react';
import type { Stall, StallStatus } from '../types';

interface StallCardProps {
  stall: Stall;
  onStatusChange: (stallId: string, status: StallStatus) => void;
  index: number;
}

export default function StallCard({ stall, onStatusChange, index }: StallCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const statusConfig = {
    available: {
      label: '空闲',
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      textColor: 'text-success-700',
      iconColor: 'text-success-500',
      dotColor: 'bg-success-500',
      actionLabel: '标记使用中',
      actionColor: 'bg-danger-500 hover:bg-danger-600',
      Icon: CheckCircle,
    },
    occupied: {
      label: '使用中',
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      textColor: 'text-danger-700',
      iconColor: 'text-danger-500',
      dotColor: 'bg-danger-500',
      actionLabel: '标记空闲',
      actionColor: 'bg-success-500 hover:bg-success-600',
      Icon: XCircle,
    },
    maintenance: {
      label: '维护中',
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      textColor: 'text-warning-700',
      iconColor: 'text-warning-500',
      dotColor: 'bg-warning-500',
      actionLabel: '解除维护',
      actionColor: 'bg-gray-500 hover:bg-gray-600',
      Icon: Wrench,
    },
  };

  const config = statusConfig[stall.status];
  const Icon = config.Icon;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleClick = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    const newStatus: StallStatus = stall.status === 'available' ? 'occupied' : 'available';
    await onStatusChange(stall.id, newStatus);
    setIsUpdating(false);
  };

  return (
    <div
      className={`relative rounded-2xl border-2 ${config.bgColor} ${config.borderColor} p-5 transition-all duration-300 hover:shadow-md animate-fade-in-up ${isUpdating ? 'opacity-70' : ''}`}
      style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center border ${config.borderColor}`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {stall.stallNumber} 号隔间
            </h3>
            <p className={`text-sm font-medium ${config.textColor}`}>
              {config.label}
            </p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${config.dotColor} ${
          stall.status === 'occupied' ? 'animate-pulse' : ''
        }`} />
      </div>

      <div className="flex items-center space-x-1 text-xs text-gray-500 mb-4">
        <Clock className="w-3.5 h-3.5" />
        <span>最后更新: {formatTime(stall.lastUpdated)}</span>
      </div>

      <button
        onClick={handleClick}
        disabled={isUpdating}
        className={`w-full py-2.5 px-4 rounded-xl text-white font-medium text-sm transition-all duration-200 ${config.actionColor} disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
      >
        {isUpdating ? '更新中...' : config.actionLabel}
      </button>

      {stall.status === 'occupied' && (
        <div className="absolute -top-1 -right-1 w-4 h-4">
          <div className="absolute inset-0 rounded-full bg-danger-400 animate-ping opacity-75" />
          <div className="relative rounded-full w-4 h-4 bg-danger-500" />
        </div>
      )}
    </div>
  );
}
