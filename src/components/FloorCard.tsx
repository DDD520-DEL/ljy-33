import { Link } from 'react-router-dom';
import { Users, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import type { FloorWithStatus } from '../types';

interface FloorCardProps {
  floor: FloorWithStatus;
  index: number;
}

export default function FloorCard({ floor, index }: FloorCardProps) {
  const occupancyRate = Math.round((floor.occupiedStalls / floor.totalStalls) * 100);
  const hasAvailable = floor.availableStalls > 0;

  const getStatusColor = () => {
    if (occupancyRate >= 80) return 'danger';
    if (occupancyRate >= 50) return 'warning';
    return 'success';
  };

  const statusColor = getStatusColor();

  return (
    <Link
      to={`/floor/${floor.id}`}
      className="group block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-200 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-gray-900">{floor.floorNumber}</span>
              <span className="text-sm text-gray-500">楼</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{floor.floorName}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            statusColor === 'success' ? 'bg-success-500' :
            statusColor === 'warning' ? 'bg-warning-500' : 'bg-danger-500'
          } animate-pulse-slow`} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-success-500" />
              <span className="text-sm font-medium text-success-600">{floor.availableStalls} 空闲</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-danger-500" />
              <span className="text-sm font-medium text-danger-600">{floor.occupiedStalls} 使用中</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>占用率</span>
            <span className="font-medium">{occupancyRate}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                statusColor === 'success' ? 'bg-success-500' :
                statusColor === 'warning' ? 'bg-warning-500' : 'bg-danger-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>共 {floor.totalStalls} 个隔间</span>
          </div>
          <div className="flex items-center text-primary-600 text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
            <span>查看详情</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-primary-400 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </Link>
  );
}
