import { useState } from 'react';
import type { HeatmapPoint } from '../types';

interface HeatmapProps {
  data: HeatmapPoint[];
}

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function Heatmap({ data }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapPoint | null>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    return Math.min(Math.max(ratio, 0.1), 1);
  };

  const getCellColor = (count: number) => {
    const intensity = getIntensity(count);
    if (count === 0) {
      return 'bg-gray-100';
    }
    const r = Math.round(13 + (197 - 13) * (1 - intensity));
    const g = Math.round(148 + (94 - 148) * (1 - intensity));
    const b = Math.round(136 + (77 - 136) * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekdays = [0, 1, 2, 3, 4, 5, 6];

  const getData = (weekday: number, hour: number) => {
    return data.find((d) => d.weekday === weekday && d.hour === hour) || { weekday, hour, count: 0 };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">使用频率热力图</h3>
      <p className="text-sm text-gray-500 mb-6">近30天各时段使用频次分布</p>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="flex mb-2">
            <div className="w-16 flex-shrink-0" />
            <div className="flex-1 flex">
              {hours.filter((h) => h % 3 === 0).map((hour) => (
                <div key={hour} className="flex-1 text-center text-xs text-gray-500">
                  {hour}:00
                </div>
              ))}
            </div>
          </div>

          {weekdays.map((weekday) => (
            <div key={weekday} className="flex items-center mb-1">
              <div className="w-16 flex-shrink-0 text-xs text-gray-600 font-medium">
                {weekdayLabels[weekday]}
              </div>
              <div className="flex-1 flex gap-0.5">
                {hours.map((hour) => {
                  const point = getData(weekday, hour);
                  const isHovered =
                    hoveredCell?.weekday === weekday && hoveredCell?.hour === hour;
                  return (
                    <div
                      key={`${weekday}-${hour}`}
                      className="flex-1 aspect-square rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 relative"
                      style={{ backgroundColor: getCellColor(point.count) }}
                      onMouseEnter={() => setHoveredCell(point)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 shadow-lg">
                          {weekdayLabels[point.weekday]} {point.hour}:00 - {point.hour + 1}:00
                          <br />
                          <span className="text-primary-300">{point.count} 次使用</span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end mt-4 space-x-3">
        <span className="text-xs text-gray-500">低</span>
        <div className="flex gap-0.5">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((intensity, i) => {
            const r = Math.round(13 + (197 - 13) * (1 - intensity));
            const g = Math.round(148 + (94 - 148) * (1 - intensity));
            const b = Math.round(136 + (77 - 136) * (1 - intensity));
            return (
              <div
                key={i}
                className="w-5 h-3 rounded-sm"
                style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
              />
            );
          })}
        </div>
        <span className="text-xs text-gray-500">高</span>
      </div>
    </div>
  );
}
