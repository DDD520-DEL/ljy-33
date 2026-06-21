import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorAlert({ message, onRetry, onDismiss }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-danger-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-danger-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-danger-900 mb-1">加载失败</h4>
          <p className="text-sm text-danger-700 break-words">{message}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger-600 hover:bg-danger-700 text-white text-sm font-medium rounded-lg transition-colors active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>重试</span>
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 text-danger-400 hover:text-danger-600 hover:bg-danger-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
