import { Clock, TrendingUp } from 'lucide-react';
import type { PeakPeriod } from '../types';

interface PeakPeriodsProps {
  data: PeakPeriod[];
}

export default function PeakPeriods({ data }: PeakPeriodsProps) {
  const maxAvg = Math.max(...data.map((d) => d.avgCount), 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">高峰时段</h3>
          <p className="text-sm text-gray-500">工作日各时段平均使用次数</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((period, index) => {
          const percentage = (period.avgCount / maxAvg) * 100;
          return (
            <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{period.period}</span>
                </div>
                <span className="text-sm font-bold text-primary-600">
                  {period.avgCount} 次/天
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
