import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { HeatmapPoint, TrendPoint, PeakPeriod } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV(headers: string[], rows: (string | number)[][]): string {
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
  return '\uFEFF' + csvContent;
}

function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface ExportOptions {
  startDate: string;
  endDate: string;
  floorName: string;
  heatmapData: HeatmapPoint[];
  trendData: TrendPoint[];
  peakPeriods: PeakPeriod[];
}

const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function exportToCSV(options: ExportOptions): void {
  const { startDate, endDate, floorName, heatmapData, trendData, peakPeriods } = options;
  const timestamp = new Date().toISOString().slice(0, 10);
  const floorSuffix = floorName ? `_${floorName}` : '';

  const heatmapHeaders = ['星期', '时段', '使用次数'];
  const heatmapRows = heatmapData
    .filter(d => d.count > 0)
    .sort((a, b) => a.weekday - b.weekday || a.hour - b.hour)
    .map(d => [
      weekdayLabels[d.weekday],
      `${d.hour}:00-${d.hour + 1}:00`,
      d.count
    ]);

  const trendHeaders = ['日期', '使用次数'];
  const trendRows = trendData.map(d => [d.date, d.count]);

  const peakHeaders = ['时段', '平均使用次数(次/天)'];
  const peakRows = peakPeriods.map(d => [d.period, d.avgCount]);

  const filterInfo = [
    ['导出时间', new Date().toLocaleString('zh-CN')],
    ['日期范围', `${startDate} 至 ${endDate}`],
    ['楼层筛选', floorName || '全部楼层'],
    [],
  ];

  const heatmapSection = [
    ['=== 使用频率热力图数据 ==='],
    heatmapHeaders,
    ...heatmapRows,
    [],
  ];

  const trendSection = [
    ['=== 使用趋势数据 ==='],
    trendHeaders,
    ...trendRows,
    [],
  ];

  const peakSection = [
    ['=== 高峰时段数据 ==='],
    peakHeaders,
    ...peakRows,
  ];

  const allRows = [
    ...filterInfo,
    ...heatmapSection,
    ...trendSection,
    ...peakSection,
  ];

  const csvContent = allRows.map(row => row.map(escapeCSV).join(',')).join('\n');
  const csvWithBOM = '\uFEFF' + csvContent;

  downloadCSV(csvWithBOM, `蹲位使用数据_${timestamp}${floorSuffix}.csv`);
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days + 1);
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}
