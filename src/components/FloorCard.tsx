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
  const isAllOccupied = floor.availableStalls === 0 && floor.occupiedStalls > 0;

  const getStatusColor = () => {
    if (isAllOccupied) return 'danger';
    if (occupancyRate >= 80) return 'danger';
    if (occupancyRate >= 50) return 'warning';
    return 'success';
  };

  const statusColor = getStatusColor();

  return (
    <Link
      to={`/floor/${floor.id}`}
      className={`group block rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border animate-fade-in-up relative ${
        isAllOccupied
          ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300 hover:border-red-400'
          : 'bg-white border-gray-100 hover:border-primary-200'
      }`}
      style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
    >
      {isAllOccupied && (
        <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 text-xs font-bold rounded-bl-xl z-10 animate-pulse">
          已满
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-3xl font-bold ${isAllOccupied ? 'text-red-900' : 'text-gray-900'}`}>{floor.floorNumber}</span>
              <span className={`text-sm ${isAllOccupied ? 'text-red-700' : 'text-gray-500'}`}>楼</span>
            </div>
            <p className={`text-sm mt-1 ${isAllOccupied ? 'text-red-700' : 'text-gray-500'}`}>{floor.floorName}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            isAllOccupied ? 'bg-red-600 animate-pulse' :
            statusColor === 'success' ? 'bg-success-500' :
            statusColor === 'warning' ? 'bg-warning-500' : 'bg-danger-500'
          } ${isAllOccupied ? '' : 'animate-pulse-slow'}`} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <CheckCircle className={`w-4 h-4 ${isAllOccupied ? 'text-red-400' : 'text-success-500'}`} />
              <span className={`text-sm font-medium ${isAllOccupied ? 'text-red-600 line-through' : 'text-success-600'}`}>{floor.availableStalls} 空闲</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users className={`w-4 h-4 ${isAllOccupied ? 'text-red-600' : 'text-danger-500'}`} />
              <span className={`text-sm font-medium ${isAllOccupied ? 'text-red-700 font-semibold' : 'text-danger-600'}`}>{floor.occupiedStalls} 使用中</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className={`flex justify-between text-xs mb-1.5 ${isAllOccupied ? 'text-red-700' : 'text-gray-500'}`}>
            <span>占用率</span>
            <span className="font-medium">{occupancyRate}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isAllOccupied ? 'bg-red-200' : 'bg-gray-100'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAllOccupied ? 'bg-red-500' :
                statusColor === 'success' ? 'bg-success-500' :
                statusColor === 'warning' ? 'bg-warning-500' : 'bg-danger-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-1 text-xs ${isAllOccupied ? 'text-red-600' : 'text-gray-400'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>共 {floor.totalStalls} 个隔间</span>
          </div>
          <div className={`flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform duration-200 ${isAllOccupied ? 'text-red-600' : 'text-primary-600'}`}>
            <span>查看详情</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className={`h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
        isAllOccupied
          ? 'bg-gradient-to-r from-red-400 to-red-600'
          : 'bg-gradient-to-r from-primary-400 to-primary-600'
      }`} />
    </Link>
  );
}
