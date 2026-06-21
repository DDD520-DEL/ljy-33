import { RefreshCw, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function EmptyState({
  title = '暂无数据',
  description = '当前还没有可用的统计数据，请稍后重试或点击刷新按钮重新加载。',
  onRefresh,
  loading = false,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center animate-fade-in-up">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FileQuestion className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新数据</span>
        </button>
      )}
    </div>
  );
}
