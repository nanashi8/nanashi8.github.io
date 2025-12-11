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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 animate-in fade-in duration-300">
        {/* スピナー */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
        </div>
        
        {/* メッセージ */}
        <div className="text-center">
          <p className="text-gray-800 dark:text-gray-100 font-semibold text-lg">{message}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            準備中です...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
