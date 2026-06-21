import type { TrendPoint } from '../types';

interface TrendChartProps {
  data: TrendPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 600;

  const chartWidth = width - padding.left - padding.right;
  const chartInnerHeight = chartHeight - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartInnerHeight - (d.count / maxCount) * chartInnerHeight;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartInnerHeight} L ${points[0].x} ${padding.top + chartInnerHeight} Z`;

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = Math.round((maxCount * i) / yTicks);
    const y = padding.top + chartInnerHeight - (value / maxCount) * chartInnerHeight;
    return { value, y };
  });

  const xLabelCount = Math.min(7, data.length);
  const xLabels = data
    .filter((_, i) => i % Math.ceil(data.length / xLabelCount) === 0 || i === data.length - 1)
    .map((d) => {
      const x = padding.left + (data.indexOf(d) / (data.length - 1)) * chartWidth;
      const label = d.date.slice(5);
      return { x, label };
    });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">使用趋势</h3>
      <p className="text-sm text-gray-500 mb-6">近30天每日使用次数</p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full min-w-[500px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {yLabels.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-xs"
                fill="#9ca3af"
                fontSize="10"
              >
                {tick.value}
              </text>
            </g>
          ))}

          <path d={areaD} fill="url(#areaGradient)" />
          <path
            d={pathD}
            fill="none"
            stroke="#0d9488"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="white"
                stroke="#0d9488"
                strokeWidth="2"
              />
              <title>{p.date}: {p.count} 次</title>
            </g>
          ))}

          {xLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={chartHeight - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs"
              fill="#9ca3af"
              fontSize="10"
            >
              {label.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
