/**
 * 読み込み中インジケータコンポーネント
 * 重いコンポーネント初期化時に表示
 */

interface LoadingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  isVisible, 
  message = '読み込み中...' 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <p className="text-gray-700 dark:text-gray-200 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
