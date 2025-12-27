/**
 * モバイル自動最適化の具体的実装例
 *
 * このファイルは参考用で、実際のコンポーネントでの修正パターンを示しています。
 */

// ============================================
// 例1: ScoreBoard のタブUI修正
// ============================================

// ❌ 修正前
/*
{!isMobile && (
  <div className="grid grid-cols-4 gap-2">
    <button className="px-4 py-2">📋 プラン</button>
    <button className="px-4 py-2">📈 学習状況</button>
    <button className="px-4 py-2">📜 履歴</button>
    <button className="px-4 py-2">⚙️ 学習設定</button>
  </div>
)}

{isMobile && (
  <div className="grid grid-cols-4 gap-1">
    <button className="px-1 py-1.5 text-xs">
      <span>📋</span>
    </button>
    // ...
  </div>
)}
*/

// ✅ 修正後
/*
<div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
  <button className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 rounded-t-lg border-b-2">
    <span className="hidden sm:inline">📋 プラン</span>
    <span className="sm:hidden">プラン</span>
  </button>
  <button className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 rounded-t-lg border-b-2">
    <span className="hidden sm:inline">📈 学習状況</span>
    <span className="sm:hidden">学習状況</span>
  </button>
  <button className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 rounded-t-lg border-b-2">
    <span className="hidden sm:inline">📜 履歴</span>
    <span className="sm:hidden">履歴</span>
  </button>
  <button className="col-span-2 sm:col-span-1 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 rounded-t-lg border-b-2">
    <span className="hidden sm:inline">⚙️ 学習設定</span>
    <span className="sm:hidden">学習設定</span>
  </button>
</div>
*/

// ============================================
// 例2: FloatingPanel（モーダル）修正
// ============================================

// ❌ 修正前
/*
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
*/

// ✅ 修正後
/*
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
  <div className="bg-white rounded-lg shadow-2xl max-w-2xl sm:max-w-4xl w-full mx-auto max-h-[90vh] flex flex-col">
*/

// ============================================
// 例3: QuestionCard 選択肢ボタン修正
// ============================================

// ❌ 修正前
/*
<button
  className="w-full min-h-[56px] p-4 text-base rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center"
  onClick={() => onAnswer(choice)}
>
  {choice}
</button>
*/

// ✅ 修正後
/*
import { useResponsiveClick } from '../hooks/useResponsiveClick';

const QuestionButton = ({ choice, isCorrect, isSelected, onAnswer }) => {
  const props = useResponsiveClick(() => onAnswer(choice));

  return (
    <button
      {...props}
      className={`
        w-full min-h-11 sm:min-h-14 p-3 sm:p-4
        text-sm sm:text-base
        rounded-xl border-2
        transition-all duration-300
        flex flex-col items-center text-center
        touch-manipulation select-none
        ${!isSelected && !isCorrect ? 'hover:border-blue-600 hover:bg-gray-100 active:bg-gray-200:bg-gray-700' : ''}
        ${isSelected && !isCorrect ? 'border-red-600 bg-red-50' : ''}
        ${isCorrect ? 'border-green-600 bg-green-50' : ''}
      `}
    >
      {choice}
    </button>
  );
};
*/

// ============================================
// 例4: ボタングループの修正
// ============================================

// ❌ 修正前
/*
<div className="flex gap-4">
  <button className="w-64 px-8 py-4">キャンセル</button>
  <button className="w-64 px-8 py-4">OK</button>
</div>
*/

// ✅ 修正後
/*
<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
  <button className="w-full sm:w-32 px-4 sm:px-8 py-2 sm:py-4 text-sm sm:text-base">
    キャンセル
  </button>
  <button className="w-full sm:w-32 px-4 sm:px-8 py-2 sm:py-4 text-sm sm:text-base">
    OK
  </button>
</div>
*/

// ============================================
// 例5: グリッドレイアウト修正
// ============================================

// ❌ 修正前
// <div className="grid grid-cols-4 gap-4">
//   4列固定
//   {items.map(item => <Card key={item.id} data={item} />)}
// </div>

// ✅ 修正後
// <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
//   モバイル: 1列 → タブレット: 2列 → デスクトップ: 4列
//   {items.map(item => <Card key={item.id} data={item} />)}
// </div>

// ============================================
// 例6: テキスト表示/非表示の切り替え
// ============================================

// ❌ 修正前
/*
const Label = ({ text }) => (
  <span className={isMobile ? 'd' : text}>
    {isMobile ? 'D' : text}
  </span>
);
*/

// ✅ 修正後
/*
const Label = ({ text, abbreviation }) => (
  <>
    <span className="hidden sm:inline">{text}</span>
    <span className="sm:hidden">{text}</span>
  </>
);

// 使用例
<Label text="ダウンロード" abbreviation="D" />
// モバイルで: ダウンロード
// デスクトップで: ダウンロード
*/

// ============================================
// 例7: スペーシング（余白）の最適化
// ============================================

// ❌ 修正前
/*
<div className="p-6 mb-6">
  <h1 className="text-2xl font-bold mb-4">タイトル</h1>
  <p className="text-base">説明テキスト</p>
</div>
*/

// ✅ 修正後
/*
<div className="p-3 sm:p-6 mb-3 sm:mb-6">
  <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">タイトル</h1>
  <p className="text-sm sm:text-base">説明テキスト</p>
</div>
*/

// ============================================
// 例8: テーブル/リストのモバイル化
// ============================================

// ❌ 修正前
/*
<table className="w-full border-collapse">
  <tr>
    <td className="p-4 border">見出し1</td>
    <td className="p-4 border">見出し2</td>
  </tr>
</table>
// モバイルで横スクロール必要
*/

// ✅ 修正後
/*
<div className="space-y-2 sm:space-y-0">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0 p-2 sm:p-4 border sm:border-r-0 sm:border-b">
    <div className="font-bold text-xs sm:text-sm">見出し1</div>
    <div className="text-xs sm:text-sm">値1</div>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0 p-2 sm:p-4 border sm:border-r-0">
    <div className="font-bold text-xs sm:text-sm">見出し2</div>
    <div className="text-xs sm:text-sm">値2</div>
  </div>
</div>
*/

export default {};
