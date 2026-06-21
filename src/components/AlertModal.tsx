import { AlertTriangle, X, Clock, MapPin } from 'lucide-react';
import { useBathroomStore } from '../store/useBathroomStore';
import { Link } from 'react-router-dom';
import type { AlertRecord } from '../types';

interface AlertModalProps {
  alert: AlertRecord;
  onDismiss: () => void;
}

export default function AlertModal({ alert, onDismiss }: AlertModalProps) {
  const { currentAlertCount } = useBathroomStore();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} 分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} 小时 ${mins} 分钟`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-r from-danger-500 to-danger-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">超时占用告警</h2>
                <p className="text-white/80 mt-1">蹲位使用时间异常</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {currentAlertCount > 1 && (
            <div className="relative mt-4 inline-flex items-center space-x-2 px-3 py-1.5 bg-white/20 backdrop-blur rounded-full text-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>还有 {currentAlertCount - 1} 条告警待处理</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-danger-50 border-2 border-danger-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-danger-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {alert.floorNumber}楼 {alert.floorName}
                  </p>
                  <p className="text-danger-600 font-medium">
                    {alert.stallNumber} 号隔间
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-danger-600">
                  {formatDuration(alert.durationMinutes)}
                </p>
                <p className="text-sm text-gray-500">已占用</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-danger-200">
              <div>
                <p className="text-xs text-gray-500 mb-1">开始时间</p>
                <p className="font-semibold text-gray-800">
                  {formatTime(alert.startTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">告警时间</p>
                <p className="font-semibold text-gray-800">
                  {formatTime(alert.alertedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">温馨提示</p>
                <p className="text-sm text-amber-700 mt-1">
                  该蹲位已连续占用超过 20 分钟，请及时确认是否存在异常情况（如人员晕厥、设备故障等），确保使用安全。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 flex space-x-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            稍后处理
          </button>
          <Link
            to={`/floor/${alert.floorId}`}
            onClick={onDismiss}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-danger-500 to-danger-600 text-white font-semibold rounded-xl hover:from-danger-600 hover:to-danger-700 transition-all shadow-lg shadow-danger-500/30 text-center"
          >
            前往查看
          </Link>
        </div>
      </div>
    </div>
  );
}
