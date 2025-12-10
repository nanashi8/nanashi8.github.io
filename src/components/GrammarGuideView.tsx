import React, { useState } from 'react';

/**
 * 文法・表現ガイドビュー（プロトタイプ）
 */
export const GrammarGuideView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prepositions' | 'punctuation' | 'tips'>('prepositions');

  return (
    <div className="grammar-guide-view p-6 max-w-app mx-auto">
      {/* タブ切り替え */}
      <div className="flex gap-2 mb-6 border-b border-border-color">
        <button
          onClick={() => setActiveTab('prepositions')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'prepositions'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-color'
          }`}
        >
          📍 前置詞のニュアンス
        </button>
        <button
          onClick={() => setActiveTab('punctuation')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'punctuation'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-color'
          }`}
        >
          ✏️ 英文記号の意味
        </button>
        <button
          onClick={() => setActiveTab('tips')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'tips'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text-color'
          }`}
        >
          💡 長文読解のコツ
        </button>
      </div>

      {/* コンテンツ */}
      <div className="content-area">
        {activeTab === 'prepositions' && <PrepositionGuide />}
        {activeTab === 'punctuation' && <PunctuationGuide />}
        {activeTab === 'tips' && <ReadingTipsGuide />}
      </div>
    </div>
  );
};

/**
 * 前置詞ガイド（ビジュアル重視）
 */
const PrepositionGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-color mb-4">
        前置詞のニュアンスと使い分け
      </h2>
      
      <p className="text-text-secondary mb-6">
        英語で最も頻繁に使う前置詞を重要度順に紹介します。それぞれのコアイメージを理解することで、自然な英語表現が身につきます。
      </p>

      {/* 最重要3つの前置詞 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">🌟 最重要：時間・場所の基本3つ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* IN */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border-2 border-blue-500">
            <div className="text-center mb-4">
              <span className="text-5xl">📦</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">IN</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">「囲まれた空間の中」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <span>⏰</span> 時間のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-blue-600 dark:text-blue-300">📅 <strong>in 2024</strong> → 年という長い期間の中</div>
                  <div className="text-blue-600 dark:text-blue-300">🗓️ <strong>in May</strong> → 月という期間の中</div>
                  <div className="text-blue-600 dark:text-blue-300">🌅 <strong>in the morning</strong> → 午前という時間帯の中</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <span>🗺️</span> 場所のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-blue-600 dark:text-blue-300">🌏 <strong>in Japan</strong> → 国という広い空間の中</div>
                  <div className="text-blue-600 dark:text-blue-300">🏠 <strong>in the room</strong> → 部屋という囲まれた空間の中</div>
                </div>
              </div>
            </div>
          </div>

          {/* ON */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border-2 border-green-500">
            <div className="text-center mb-4">
              <span className="text-5xl">📄</span>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">ON</div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-1">「接触・くっついている」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <span>⏰</span> 時間のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-green-600 dark:text-green-300">📆 <strong>on Monday</strong> → 曜日という特定の日に接触</div>
                  <div className="text-green-600 dark:text-green-300">📅 <strong>on May 1st</strong> → 日付という特定の日に接触</div>
                  <div className="text-green-600 dark:text-green-300">🎄 <strong>on Christmas</strong> → その日に接触</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <span>🗺️</span> 場所のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-green-600 dark:text-green-300">🪑 <strong>on the table</strong> → テーブル表面に接触</div>
                  <div className="text-green-600 dark:text-green-300">🖼️ <strong>on the wall</strong> → 壁面に接触</div>
                </div>
              </div>
            </div>
          </div>

          {/* AT */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 border-2 border-orange-500">
            <div className="text-center mb-4">
              <span className="text-5xl">📍</span>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">AT</div>
              <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">「ピンポイント・地点」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                  <span>⏰</span> 時間のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-orange-600 dark:text-orange-300">🕖 <strong>at 7:00</strong> → 7時という時刻の点</div>
                  <div className="text-orange-600 dark:text-orange-300">☀️ <strong>at noon</strong> → 正午という瞬間の点</div>
                  <div className="text-orange-600 dark:text-orange-300">🌙 <strong>at night</strong> → 夜という時点</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                  <span>🗺️</span> 場所のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-orange-600 dark:text-orange-300">🏫 <strong>at school</strong> → 学校という地点</div>
                  <div className="text-orange-600 dark:text-orange-300">🚪 <strong>at the door</strong> → ドアという地点</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* その他重要な前置詞 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">⭐ その他の重要な前置詞</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* IN */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border-2 border-blue-500">
            <div className="text-center mb-4">
              <span className="text-5xl">📦</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">IN</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">「囲まれた空間の中」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <span>⏰</span> 時間のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-blue-600 dark:text-blue-300">📅 <strong>in 2024</strong> → 年という長い期間の中</div>
                  <div className="text-blue-600 dark:text-blue-300">🗓️ <strong>in May</strong> → 月という期間の中</div>
                  <div className="text-blue-600 dark:text-blue-300">🌅 <strong>in the morning</strong> → 午前という時間帯の中</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <span>🗺️</span> 場所のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-blue-600 dark:text-blue-300">🌏 <strong>in Japan</strong> → 国という広い空間の中</div>
                  <div className="text-blue-600 dark:text-blue-300">🏠 <strong>in the room</strong> → 部屋という囲まれた空間の中</div>
                </div>
              </div>
            </div>
          </div>

          {/* ON */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border-2 border-green-500">
            <div className="text-center mb-4">
              <span className="text-5xl">📄</span>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">ON</div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-1">「接触・くっついている」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <span>⏰</span> 時間のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-green-600 dark:text-green-300">📆 <strong>on Monday</strong> → 曜日という特定の日に接触</div>
                  <div className="text-green-600 dark:text-green-300">📅 <strong>on May 1st</strong> → 日付という特定の日に接触</div>
                  <div className="text-green-600 dark:text-green-300">🎄 <strong>on Christmas</strong> → その日に接触</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <span>🗺️</span> 場所のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-green-600 dark:text-green-300">🪑 <strong>on the table</strong> → テーブル表面に接触</div>
                  <div className="text-green-600 dark:text-green-300">🖼️ <strong>on the wall</strong> → 壁面に接触</div>
                </div>
              </div>
            </div>
          </div>

          {/* AT */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 border-2 border-orange-500">
            <div className="text-center mb-4">
              <span className="text-5xl">📍</span>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">AT</div>
              <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">「ピンポイント・地点」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                  <span>⏰</span> 時間のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-orange-600 dark:text-orange-300">🕖 <strong>at 7:00</strong> → 7時という時刻の点</div>
                  <div className="text-orange-600 dark:text-orange-300">☀️ <strong>at noon</strong> → 正午という瞬間の点</div>
                  <div className="text-orange-600 dark:text-orange-300">🌙 <strong>at night</strong> → 夜という時点</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                  <span>🗺️</span> 場所のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-orange-600 dark:text-orange-300">🏫 <strong>at school</strong> → 学校という地点</div>
                  <div className="text-orange-600 dark:text-orange-300">🚪 <strong>at the door</strong> → ドアという地点</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* その他重要な前置詞 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">⭐ その他の重要な前置詞</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TO */}
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-5 border-2 border-pink-500">
            <div className="text-center mb-4">
              <span className="text-5xl">➡️</span>
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-2">TO</div>
              <div className="text-sm text-pink-700 dark:text-pink-300 mt-1">「方向・到達点」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-pink-800 dark:text-pink-200 mb-2 flex items-center gap-2">
                  <span>🧭</span> 方向のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-pink-600 dark:text-pink-300">🏫 <strong>to school</strong> → 学校へ（方向）</div>
                  <div className="text-pink-600 dark:text-pink-300">🗼 <strong>to Tokyo</strong> → 東京へ（目的地）</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-pink-800 dark:text-pink-200 mb-2 flex items-center gap-2">
                  <span>🔄</span> 範囲のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-pink-600 dark:text-pink-300">📊 <strong>from A to B</strong> → AからBまで（範囲）</div>
                  <div className="text-pink-600 dark:text-pink-300">🕐 <strong>from 9 to 5</strong> → 9時から5時まで</div>
                </div>
              </div>
            </div>
          </div>

          {/* FOR */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border-2 border-purple-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🎯</span>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">FOR</div>
              <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">「目的・対象・期間」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                  <span>💝</span> 目的・対象のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-purple-600 dark:text-purple-300">👤 <strong>for you</strong> → あなたのために（対象）</div>
                  <div className="text-purple-600 dark:text-purple-300">🍳 <strong>for breakfast</strong> → 朝食として（目的）</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                  <span>⏱️</span> 期間のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-purple-600 dark:text-purple-300">⏰ <strong>for 3 hours</strong> → 3時間（継続期間）</div>
                  <div className="text-purple-600 dark:text-purple-300">📅 <strong>for a week</strong> → 1週間（継続期間）</div>
                </div>
              </div>
            </div>
          </div>

          {/* FROM */}
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-5 border-2 border-teal-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🎬</span>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">FROM</div>
              <div className="text-sm text-teal-700 dark:text-teal-300 mt-1">「起点・出発点」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-teal-800 dark:text-teal-200 mb-2 flex items-center gap-2">
                  <span>📍</span> 起点のイメージ：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-teal-600 dark:text-teal-300">🏠 <strong>from home</strong> → 家から（出発点）</div>
                  <div className="text-teal-600 dark:text-teal-300">🇯🇵 <strong>from Japan</strong> → 日本から（出身）</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-teal-800 dark:text-teal-200 mb-2 flex items-center gap-2">
                  <span>🕐</span> 時間の起点：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-teal-600 dark:text-teal-300">⏰ <strong>from 9 am</strong> → 9時から（開始時刻）</div>
                  <div className="text-teal-600 dark:text-teal-300">📅 <strong>from Monday</strong> → 月曜日から</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第3グループ */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">📌 よく使う前置詞</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* WITH */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-5 border-2 border-indigo-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🤝</span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">WITH</div>
              <div className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">「一緒に・使って」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-2">
                  <span>👥</span> 伴う相手：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-indigo-600 dark:text-indigo-300">👨‍👩‍👧 <strong>with my family</strong> → 家族と一緒に</div>
                  <div className="text-indigo-600 dark:text-indigo-300">🧑‍🤝‍🧑 <strong>with friends</strong> → 友達と</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-2">
                  <span>🛠️</span> 使う道具：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-indigo-600 dark:text-indigo-300">✏️ <strong>with a pen</strong> → ペンで（道具）</div>
                  <div className="text-indigo-600 dark:text-indigo-300">🍴 <strong>with chopsticks</strong> → 箸で</div>
                </div>
              </div>
            </div>
          </div>

          {/* BY */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-5 border-2 border-amber-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🚗</span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">BY</div>
              <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">「〜のそばに・手段」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                  <span>🚌</span> 手段・方法：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-amber-600 dark:text-amber-300">🚆 <strong>by train</strong> → 電車で（交通手段）</div>
                  <div className="text-amber-600 dark:text-amber-300">✉️ <strong>by email</strong> → メールで（通信手段）</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                  <span>📍</span> そばに：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-amber-600 dark:text-amber-300">🌊 <strong>by the sea</strong> → 海のそばに</div>
                  <div className="text-amber-600 dark:text-amber-300">🪟 <strong>by the window</strong> → 窓のそばに</div>
                </div>
              </div>
            </div>
          </div>

          {/* OF */}
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-5 border-2 border-rose-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🔗</span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">OF</div>
              <div className="text-sm text-rose-700 dark:text-rose-300 mt-1">「〜の（所属・部分）」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-rose-800 dark:text-rose-200 mb-2 flex items-center gap-2">
                  <span>👑</span> 所属・所有：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-rose-600 dark:text-rose-300">📚 <strong>the book of mine</strong> → 私の本</div>
                  <div className="text-rose-600 dark:text-rose-300">🏛️ <strong>the capital of Japan</strong> → 日本の首都</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-rose-800 dark:text-rose-200 mb-2 flex items-center gap-2">
                  <span>🧩</span> 部分：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-rose-600 dark:text-rose-300">🍰 <strong>a piece of cake</strong> → ケーキ一切れ</div>
                  <div className="text-rose-600 dark:text-rose-300">💧 <strong>a glass of water</strong> → コップ一杯の水</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第4グループ：中頻度の前置詞 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">💫 中頻度の前置詞</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ABOUT */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-5 border-2 border-cyan-500">
            <div className="text-center mb-4">
              <span className="text-5xl">💭</span>
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">ABOUT</div>
              <div className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">「〜について」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-cyan-800 dark:text-cyan-200 mb-2 flex items-center gap-2">
                  <span>📖</span> 話題・内容：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-cyan-600 dark:text-cyan-300">📚 <strong>a book about history</strong> → 歴史についての本</div>
                  <div className="text-cyan-600 dark:text-cyan-300">💬 <strong>talk about sports</strong> → スポーツについて話す</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-cyan-800 dark:text-cyan-200 mb-2 flex items-center gap-2">
                  <span>🔢</span> おおよその数：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-cyan-600 dark:text-cyan-300">⏰ <strong>about 10 minutes</strong> → 約10分</div>
                  <div className="text-cyan-600 dark:text-cyan-300">👥 <strong>about 50 people</strong> → 約50人</div>
                </div>
              </div>
            </div>
          </div>

          {/* AFTER */}
          <div className="bg-lime-50 dark:bg-lime-900/20 rounded-lg p-5 border-2 border-lime-500">
            <div className="text-center mb-4">
              <span className="text-5xl">⏭️</span>
              <div className="text-2xl font-bold text-lime-600 dark:text-lime-400 mt-2">AFTER</div>
              <div className="text-sm text-lime-700 dark:text-lime-300 mt-1">「〜の後に」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-lime-800 dark:text-lime-200 mb-2 flex items-center gap-2">
                  <span>⏰</span> 時間の後：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-lime-600 dark:text-lime-300">🍽️ <strong>after dinner</strong> → 夕食の後</div>
                  <div className="text-lime-600 dark:text-lime-300">🏫 <strong>after school</strong> → 放課後</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-lime-800 dark:text-lime-200 mb-2 flex items-center gap-2">
                  <span>📍</span> 順序：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-lime-600 dark:text-lime-300">🔤 <strong>after you</strong> → お先にどうぞ</div>
                  <div className="text-lime-600 dark:text-lime-300">📝 <strong>one after another</strong> → 次々に</div>
                </div>
              </div>
            </div>
          </div>

          {/* BEFORE */}
          <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-5 border-2 border-sky-500">
            <div className="text-center mb-4">
              <span className="text-5xl">⏮️</span>
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-2">BEFORE</div>
              <div className="text-sm text-sky-700 dark:text-sky-300 mt-1">「〜の前に」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-sky-800 dark:text-sky-200 mb-2 flex items-center gap-2">
                  <span>⏰</span> 時間の前：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-sky-600 dark:text-sky-300">🍽️ <strong>before breakfast</strong> → 朝食前</div>
                  <div className="text-sky-600 dark:text-sky-300">🎄 <strong>before Christmas</strong> → クリスマスの前</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-sky-800 dark:text-sky-200 mb-2 flex items-center gap-2">
                  <span>📍</span> 順序・位置：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-sky-600 dark:text-sky-300">🚪 <strong>before the door</strong> → ドアの前</div>
                  <div className="text-sky-600 dark:text-sky-300">👥 <strong>before everyone</strong> → みんなの前で</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第5グループ：中頻度の前置詞（続き） */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* OVER */}
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-5 border-2 border-violet-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🌉</span>
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-2">OVER</div>
              <div className="text-sm text-violet-700 dark:text-violet-300 mt-1">「〜の上を越えて」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-violet-800 dark:text-violet-200 mb-2 flex items-center gap-2">
                  <span>🦅</span> 上方・越える：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-violet-600 dark:text-violet-300">🌉 <strong>over the bridge</strong> → 橋を越えて</div>
                  <div className="text-violet-600 dark:text-violet-300">🏔️ <strong>over the mountain</strong> → 山を越えて</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-violet-800 dark:text-violet-200 mb-2 flex items-center gap-2">
                  <span>🔢</span> 以上・超過：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-violet-600 dark:text-violet-300">👥 <strong>over 100 people</strong> → 100人以上</div>
                  <div className="text-violet-600 dark:text-violet-300">💰 <strong>over $50</strong> → 50ドル以上</div>
                </div>
              </div>
            </div>
          </div>

          {/* UNDER */}
          <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-5 border-2 border-slate-500">
            <div className="text-center mb-4">
              <span className="text-5xl">⬇️</span>
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-2">UNDER</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 mt-1">「〜の下に」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span>⬇️</span> 下方・下側：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-slate-600 dark:text-slate-300">🌳 <strong>under the tree</strong> → 木の下に</div>
                  <div className="text-slate-600 dark:text-slate-300">🌉 <strong>under the bridge</strong> → 橋の下に</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span>🔢</span> 未満：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-slate-600 dark:text-slate-300">👶 <strong>under 18</strong> → 18歳未満</div>
                  <div className="text-slate-600 dark:text-slate-300">💰 <strong>under $10</strong> → 10ドル未満</div>
                </div>
              </div>
            </div>
          </div>

          {/* THROUGH */}
          <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-lg p-5 border-2 border-fuchsia-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🚇</span>
              <div className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400 mt-2">THROUGH</div>
              <div className="text-sm text-fuchsia-700 dark:text-fuchsia-300 mt-1">「〜を通って」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-fuchsia-800 dark:text-fuchsia-200 mb-2 flex items-center gap-2">
                  <span>🚪</span> 通過・貫通：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-fuchsia-600 dark:text-fuchsia-300">🪟 <strong>through the window</strong> → 窓を通って</div>
                  <div className="text-fuchsia-600 dark:text-fuchsia-300">🌲 <strong>through the forest</strong> → 森を抜けて</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-fuchsia-800 dark:text-fuchsia-200 mb-2 flex items-center gap-2">
                  <span>⏰</span> 期間全体：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-fuchsia-600 dark:text-fuchsia-300">🌙 <strong>through the night</strong> → 一晩中</div>
                  <div className="text-fuchsia-600 dark:text-fuchsia-300">🌧️ <strong>through the winter</strong> → 冬の間ずっと</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第6グループ：低頻度だが重要な前置詞 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">✨ 知っておくと便利な前置詞</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BETWEEN */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-5 border-2 border-emerald-500">
            <div className="text-center mb-4">
              <span className="text-5xl">↔️</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">BETWEEN</div>
              <div className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">「〜の間に（2つ）」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2 flex items-center gap-2">
                  <span>📍</span> 2つの間：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-emerald-600 dark:text-emerald-300">🏫🏥 <strong>between the school and hospital</strong> → 学校と病院の間</div>
                  <div className="text-emerald-600 dark:text-emerald-300">👥 <strong>between you and me</strong> → あなたと私の間で</div>
                </div>
              </div>
            </div>
          </div>

          {/* AMONG */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 border-2 border-orange-500">
            <div className="text-center mb-4">
              <span className="text-5xl">👥</span>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">AMONG</div>
              <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">「〜の間に（3つ以上）」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                  <span>👨‍👩‍👧‍👦</span> 複数の中：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-orange-600 dark:text-orange-300">🌸 <strong>among the flowers</strong> → 花々の中に</div>
                  <div className="text-orange-600 dark:text-orange-300">👥 <strong>among friends</strong> → 友人たちの間で</div>
                </div>
              </div>
            </div>
          </div>

          {/* WITHOUT */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-5 border-2 border-red-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🚫</span>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">WITHOUT</div>
              <div className="text-sm text-red-700 dark:text-red-300 mt-1">「〜なしで」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                  <span>❌</span> 欠如・不在：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-red-600 dark:text-red-300">💧 <strong>without water</strong> → 水なしで</div>
                  <div className="text-red-600 dark:text-red-300">👤 <strong>without you</strong> → あなたなしで</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第7グループ：低頻度の前置詞（続き） */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* DURING */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-5 border-2 border-yellow-500">
            <div className="text-center mb-4">
              <span className="text-5xl">⏳</span>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">DURING</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">「〜の間に」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                  <span>📅</span> 期間中：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-yellow-600 dark:text-yellow-300">🌴 <strong>during summer vacation</strong> → 夏休みの間</div>
                  <div className="text-yellow-600 dark:text-yellow-300">🎥 <strong>during the movie</strong> → 映画の間</div>
                </div>
              </div>
            </div>
          </div>

          {/* UNTIL / TILL */}
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-5 border-2 border-teal-500">
            <div className="text-center mb-4">
              <span className="text-5xl">⏰</span>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">UNTIL/TILL</div>
              <div className="text-sm text-teal-700 dark:text-teal-300 mt-1">「〜まで」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-teal-800 dark:text-teal-200 mb-2 flex items-center gap-2">
                  <span>🕐</span> 継続の終点：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-teal-600 dark:text-teal-300">🌙 <strong>until midnight</strong> → 真夜中まで</div>
                  <div className="text-teal-600 dark:text-teal-300">📅 <strong>until next week</strong> → 来週まで</div>
                </div>
              </div>
            </div>
          </div>

          {/* SINCE */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border-2 border-blue-500">
            <div className="text-center mb-4">
              <span className="text-5xl">📆</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">SINCE</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">「〜以来」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <span>📅</span> 起点から継続：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-blue-600 dark:text-blue-300">🎂 <strong>since last year</strong> → 去年から（ずっと）</div>
                  <div className="text-blue-600 dark:text-blue-300">👶 <strong>since childhood</strong> → 子供の頃から</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第8グループ：場所を表す前置詞 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">🏠 場所を表す前置詞</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* INSIDE */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 border-2 border-purple-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🏢</span>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">INSIDE</div>
              <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">「〜の内側に」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                  <span>📦</span> 内側・内部：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-purple-600 dark:text-purple-300">🏠 <strong>inside the house</strong> → 家の中に</div>
                  <div className="text-purple-600 dark:text-purple-300">📦 <strong>inside the box</strong> → 箱の中に</div>
                </div>
              </div>
            </div>
          </div>

          {/* OUTSIDE */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border-2 border-green-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🌳</span>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">OUTSIDE</div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-1">「〜の外側に」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                  <span>🌲</span> 外側・外部：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-green-600 dark:text-green-300">🏡 <strong>outside the house</strong> → 家の外に</div>
                  <div className="text-green-600 dark:text-green-300">🏫 <strong>outside the school</strong> → 学校の外に</div>
                </div>
              </div>
            </div>
          </div>

          {/* NEAR */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-5 border-2 border-cyan-500">
            <div className="text-center mb-4">
              <span className="text-5xl">📍</span>
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">NEAR</div>
              <div className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">「〜の近くに」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-cyan-800 dark:text-cyan-200 mb-2 flex items-center gap-2">
                  <span>🎯</span> 近接：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-cyan-600 dark:text-cyan-300">🚉 <strong>near the station</strong> → 駅の近くに</div>
                  <div className="text-cyan-600 dark:text-cyan-300">🌊 <strong>near the sea</strong> → 海の近くに</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第9グループ：方向・位置を表す前置詞 */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BEHIND */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-5 border-2 border-indigo-500">
            <div className="text-center mb-4">
              <span className="text-5xl">👤</span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">BEHIND</div>
              <div className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">「〜の後ろに」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2 flex items-center gap-2">
                  <span>⬅️</span> 後方：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-indigo-600 dark:text-indigo-300">🚪 <strong>behind the door</strong> → ドアの後ろに</div>
                  <div className="text-indigo-600 dark:text-indigo-300">🏠 <strong>behind the house</strong> → 家の裏に</div>
                </div>
              </div>
            </div>
          </div>

          {/* ACROSS */}
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-5 border-2 border-pink-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🌉</span>
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-2">ACROSS</div>
              <div className="text-sm text-pink-700 dark:text-pink-300 mt-1">「〜を横切って」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-pink-800 dark:text-pink-200 mb-2 flex items-center gap-2">
                  <span>↔️</span> 横断：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-pink-600 dark:text-pink-300">🛣️ <strong>across the street</strong> → 通りを横切って</div>
                  <div className="text-pink-600 dark:text-pink-300">🌊 <strong>across the river</strong> → 川を渡って</div>
                </div>
              </div>
            </div>
          </div>

          {/* ALONG */}
          <div className="bg-lime-50 dark:bg-lime-900/20 rounded-lg p-5 border-2 border-lime-500">
            <div className="text-center mb-4">
              <span className="text-5xl">🛤️</span>
              <div className="text-2xl font-bold text-lime-600 dark:text-lime-400 mt-2">ALONG</div>
              <div className="text-sm text-lime-700 dark:text-lime-300 mt-1">「〜に沿って」</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-lime-800 dark:text-lime-200 mb-2 flex items-center gap-2">
                  <span>➡️</span> 沿って進む：
                </div>
                <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm space-y-1">
                  <div className="text-lime-600 dark:text-lime-300">🛣️ <strong>along the street</strong> → 通りに沿って</div>
                  <div className="text-lime-600 dark:text-lime-300">🌊 <strong>along the river</strong> → 川沿いに</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 記号ガイド
 */
const PunctuationGuide: React.FC = () => {
  const punctuations = [
    {
      symbol: '.',
      name: 'Period (ピリオド)',
      usage: '文の終わり',
      example: 'I like cats.',
      explanation: '平叙文・命令文の終わりを示す'
    },
    {
      symbol: ',',
      name: 'Comma (コンマ)',
      usage: '区切り・列挙',
      example: 'I bought apples, oranges, and bananas.',
      explanation: '単語や句を区切る。接続詞の前にも使用'
    },
    {
      symbol: '!',
      name: 'Exclamation Mark (感嘆符)',
      usage: '感嘆・強調',
      example: 'What a beautiful day!',
      explanation: '驚き・喜び・強い感情を表す'
    },
    {
      symbol: '?',
      name: 'Question Mark (疑問符)',
      usage: '疑問',
      example: 'Do you like music?',
      explanation: '疑問文の終わりを示す'
    },
    {
      symbol: ':',
      name: 'Colon (コロン)',
      usage: '説明・例示の導入',
      example: 'I have three pets: a dog, a cat, and a bird.',
      explanation: '後ろに説明や列挙が続くことを示す'
    },
    {
      symbol: ';',
      name: 'Semicolon (セミコロン)',
      usage: '関連する文の区切り',
      example: 'I love reading; my sister prefers sports.',
      explanation: 'ピリオドより弱く、コンマより強い区切り'
    },
    {
      symbol: '-',
      name: 'Hyphen (ハイフン)',
      usage: '複合語・補足',
      example: 'a well-known writer',
      explanation: '2つ以上の単語を繋げる'
    },
    {
      symbol: '—',
      name: 'Em Dash (ダッシュ)',
      usage: '強い区切り・挿入',
      example: 'My friends—John and Mary—are coming.',
      explanation: '補足情報を挿入する'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-color mb-4">
        英文記号の意味と使い方
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {punctuations.map((punc, idx) => (
          <div
            key={idx}
            className="bg-bg-secondary rounded-lg p-5 hover:shadow-lg transition-shadow border border-border-color"
          >
            <div className="flex items-start gap-4 mb-3">
              <div className="text-5xl font-bold text-primary flex-shrink-0">
                {punc.symbol}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-color">{punc.name}</h3>
                <p className="text-sm text-primary font-semibold">{punc.usage}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 mb-3">
              <div className="font-mono text-sm text-blue-600 dark:text-blue-300">
                {punc.example}
              </div>
            </div>

            <p className="text-sm text-text-secondary">
              {punc.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 長文読解のコツ
 */
const ReadingTipsGuide: React.FC = () => {
  const tips = [
    {
      icon: '📝',
      title: '最初に注釈と設問を確認',
      description: '本文を読む前に、注釈と問題から重要な手がかりを得る',
      details: [
        '注釈は単に難しい単語の意味ではなく、内容理解のカギ',
        '注釈の単語を連想すると長文のあらすじが見えてくる',
        '筆者の主張や大意を問う設問からキーワードを拾う',
        '部分的な選択問題の選択肢にも共通キーワードが隠れている'
      ]
    },
    {
      icon: '🎯',
      title: 'タイトルと第1段落で全体像を掴む',
      description: '英語の文章は「結論先出し」が基本。最初に全体の方向性が示される',
      example: {
        title: 'The Importance of Reading Books',
        para1: 'Reading books is one of the best ways to improve your knowledge and imagination. Many people think that reading is boring, but it actually helps you learn new things and understand the world better.',
        explanation: 'タイトル: 「本を読む重要性」→ テーマ確定\n第1段落: 「本を読むことは知識と想像力を高める最良の方法の1つ」→ 筆者の主張\n→ この時点で「本を読むことの良い点について述べる文章」だと分かる'
      },
      details: [
        'タイトル → 話題（トピック）を示す',
        '第1段落 → 筆者の立場・主張を明確にする',
        '「何について」「どう考えているか」をメモすると整理しやすい',
        '問題提起（疑問）→ 本文で答えを探すパターンも多い'
      ]
    },
    {
      icon: '📍',
      title: '段落の最初と最後に注目',
      description: '英語は「パラグラフ・リーディング」。1段落 = 1つの主張',
      example: {
        structure: '【典型的な段落構造】\n━━━━━━━━━━━━━━━━\n第1文（トピックセンテンス）\n「運動は健康に良い」← 段落の主張\n━━━━━━━━━━━━━━━━\n中間部（サポート）\n理由1: 体が強くなる\n理由2: ストレス解消になる\n具体例: 毎日30分歩くだけで効果\n━━━━━━━━━━━━━━━━\n最終文（まとめ）\n「だから運動を習慣にすべき」← 結論\n━━━━━━━━━━━━━━━━',
        tips: '第1文と最終文だけ読めば、その段落で何を言いたいかが分かる！'
      },
      details: [
        '第1文（トピックセンテンス）: その段落で最も言いたいこと',
        '中間部: 理由・具体例・データ（飛ばし読みOK）',
        '最終文: まとめ・結論・次の段落への橋渡し',
        '急いでいる時は各段落の第1文だけ読むのも有効'
      ]
    },
    {
      icon: '🔗',
      title: 'ディスコースマーカーを見逃さない',
      description: '文章の流れを示すつなぎ言葉が論理展開のカギ',
      details: [
        '逆接: However, But, Yet, On the other hand',
        '因果: Therefore, So, Thus, As a result',
        '例示: For example, For instance, Such as',
        '追加: In addition, Moreover, Furthermore',
        '言い換え: In other words, That is, Namely'
      ]
    },
    {
      icon: '🔍',
      title: '設問の種類別の攻略法',
      description: '問題のタイプに応じた読み方を使い分ける',
      details: [
        '主旨問題: 各段落の第1文と最終段落を重点的に',
        '詳細問題: キーワードで該当箇所を特定して精読',
        '語彙問題: 前後の文脈から意味を推測',
        '指示語問題: 直前の内容を確認',
        'NOT問題: 本文に書かれていない選択肢を探す'
      ]
    },
    {
      icon: '⏱️',
      title: '時間配分と優先順位',
      description: '全問解くための戦略的な時間管理',
      details: [
        '1問あたりの目安時間を決める（例: 3分/問）',
        '易しい問題から解いて得点を確保',
        '難問は後回し、最後に戻る',
        '最低5分は見直し時間を確保'
      ]
    },
    {
      icon: '❓',
      title: '分からない部分の対処法',
      description: '完璧を目指さず、効率的に得点する',
      details: [
        '知らない単語は前後から推測（品詞・肯定否定を判断）',
        '一文が分からなくても段落全体から意味を掴む',
        '細部より全体の流れを優先',
        '消去法で選択肢を絞る（明らかに違うものを除外）'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-color mb-4">
        長文読解のコツ
      </h2>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border-l-4 border-yellow-500 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-200 mb-2">
              基本戦略
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-3">
              長文読解は「完璧に理解する」のではなく「必要な情報を効率的に見つける」作業です。
              注釈と設問から手がかりを得て、全体の流れを掴みながら、解答に必要な部分を探していきましょう。
            </p>
            <div className="bg-yellow-100 dark:bg-yellow-800/30 rounded p-3 text-sm">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                ⚡ 最重要ポイント
              </p>
              <p className="text-yellow-800 dark:text-yellow-200">
                読む順番: ① 注釈 → ② 設問・選択肢 → ③ タイトル・第1段落 → ④ 各段落の第1文 → ⑤ 必要箇所を精読
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className="bg-bg-secondary rounded-lg p-6 hover:shadow-lg transition-shadow border-l-4 border-primary/30"
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="text-4xl">{tip.icon}</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-text-color mb-2">{tip.title}</h3>
                <p className="text-text-secondary">{tip.description}</p>
              </div>
            </div>

            {/* 具体例がある場合 */}
            {tip.example && (
              <div className="ml-14 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="space-y-3">
                  {tip.example.title && (
                    <div>
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">📌 タイトル例</div>
                      <div className="bg-white dark:bg-gray-800 rounded p-2 font-mono text-sm text-blue-700 dark:text-blue-300">
                        {tip.example.title}
                      </div>
                    </div>
                  )}
                  {tip.example.para1 && (
                    <div>
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">📄 第1段落例</div>
                      <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {tip.example.para1}
                      </div>
                    </div>
                  )}
                  {tip.example.structure && (
                    <div>
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">📊 段落の構造</div>
                      <div className="bg-white dark:bg-gray-800 rounded p-3 text-sm font-mono whitespace-pre-line text-gray-700 dark:text-gray-300">
                        {tip.example.structure}
                      </div>
                    </div>
                  )}
                  {tip.example.explanation && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded p-3 border-l-2 border-yellow-500">
                      <div className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">💡 読み取れること</div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-line">
                        {tip.example.explanation}
                      </div>
                    </div>
                  )}
                  {tip.example.tips && (
                    <div className="bg-green-50 dark:bg-green-900/30 rounded p-3 border-l-2 border-green-500">
                      <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                        ✨ {tip.example.tips}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <ul className="space-y-2 ml-14">
              {tip.details.map((detail, detailIdx) => (
                <li
                  key={detailIdx}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-text-color">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 読み方の手順 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mt-8 border-2 border-blue-300 dark:border-blue-700">
        <h3 className="text-xl font-bold text-text-color mb-4 flex items-center gap-2">
          <span>📖</span>
          <span>実践！効率的な読解手順</span>
        </h3>
        <ol className="space-y-3">
          {[
            { step: '注釈を読む', detail: '→ 重要単語から内容を予想' },
            { step: '設問と選択肢を読む', detail: '→ 何を聞かれているか確認、キーワードをチェック' },
            { step: 'タイトルと第1段落を読む', detail: '→ テーマと論点を把握' },
            { step: '各段落の第1文を流し読み', detail: '→ 全体構成を理解' },
            { step: '設問に関連する段落を精読', detail: '→ 答えの根拠を探す' },
            { step: '選択肢を本文と照らし合わせる', detail: '→ 根拠がある選択肢を選ぶ' },
            { step: '見直し', detail: '→ 選んだ答えが本文の内容と矛盾していないか確認' }
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div>
                <span className="text-text-color font-semibold">{item.step}</span>
                <span className="text-text-secondary text-sm ml-2">{item.detail}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* 注釈活用のコツ */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border-l-4 border-green-500">
        <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
          <span>📌</span>
          <span>注釈の効果的な活用法</span>
        </h3>
        <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
          <p>✓ <strong>注釈がある = その単語が内容理解に必須</strong>という出題者のメッセージ</p>
          <p>✓ 注釈の単語を並べると、長文のテーマやストーリーが浮かび上がる</p>
          <p>✓ 例: 「環境」「汚染」「対策」→ 環境問題についての文章だと予測できる</p>
          <p className="pt-2 italic">💡 本文を読む前に注釈だけで内容を予想する練習をすると効果的！</p>
        </div>
      </div>
    </div>
  );
};

export default GrammarGuideView;
