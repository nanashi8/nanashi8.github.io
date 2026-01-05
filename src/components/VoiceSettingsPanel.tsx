/**
 * 音声設定コンポーネント
 *
 * 生徒が音声の品質・速度・性別を選択できるUI
 */

import React, { useState, useEffect } from 'react';
import {
  getJapaneseSpeechSettings,
  saveJapaneseSpeechSettings,
  getJapaneseVoices,
} from '@/features/speech/japaneseSpeech';
import {
  VOICE_SERVICES,
  configureVoiceService,
  loadVoiceServiceConfig,
  synthesizeAndPlay,
  type VoiceService,
} from '@/features/speech/premiumVoiceServices';

export function VoiceSettingsPanel() {
  const [rate, setRate] = useState(1.0);
  const [_gender, setGender] = useState<'male' | 'female'>('female');
  const [currentService, setCurrentService] = useState<VoiceService>('browser');
  const [apiKey, setApiKey] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');

  useEffect(() => {
    // 設定を読み込み
    const settings = getJapaneseSpeechSettings();
    setRate(settings.rate);
    setGender(settings.gender);
    setSelectedVoiceName(settings.selectedVoiceName || '');

    const config = loadVoiceServiceConfig();
    setCurrentService(config.service);
    setApiKey(config.apiKey || '');

    // 利用可能な音声を取得
    const updateVoices = () => {
      const voices = getJapaneseVoices();
      setAvailableVoices(voices);

      // 選択された音声がない場合、デフォルトで最高品質の音声を選択
      if (!settings.selectedVoiceName && voices.length > 0) {
        const googleVoice = voices.find(v => v.name.includes('Google'));
        if (googleVoice) {
          setSelectedVoiceName(googleVoice.name);
        }
      }
    };

    if ('speechSynthesis' in window) {
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    saveJapaneseSpeechSettings({ rate: newRate });
  };

  const _handleGenderChange = (newGender: 'male' | 'female') => {
    setGender(newGender);
    saveJapaneseSpeechSettings({ gender: newGender });
  };

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    saveJapaneseSpeechSettings({ selectedVoiceName: voiceName });
  };

  const handleServiceChange = (service: VoiceService) => {
    setCurrentService(service);
    configureVoiceService({ service });
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    configureVoiceService({ apiKey: key });
  };

  const testVoice = () => {
    synthesizeAndPlay('これはテスト音声です。正解です！');
  };

  return (
    <div className="voice-settings-panel">
      <h3 className="text-lg font-bold mb-4">🔊 音声設定</h3>

      {/* 音声サービス選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          音声サービス
        </label>
        <div className="space-y-2">
          {VOICE_SERVICES.map((service) => (
            <label
              key={service.id}
              className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
            >
              <input
                type="radio"
                name="voiceService"
                value={service.id}
                checked={currentService === service.id}
                onChange={(e) => handleServiceChange(e.target.value as VoiceService)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-gray-600">{service.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  品質: {'⭐'.repeat(service.quality)} | {service.cost}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* APIキー入力（外部サービス使用時） */}
      {currentService !== 'browser' && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            APIキー
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="APIキーを入力"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            <a
              href={VOICE_SERVICES.find(s => s.id === currentService)?.setupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              APIキーの取得方法 →
            </a>
          </p>
        </div>
      )}

      {/* ブラウザ音声の詳細設定 */}
      {currentService === 'browser' && (
        <>
          {/* 音声選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              声の種類
            </label>
            <select
              value={selectedVoiceName}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">自動選択（高品質優先）</option>
              {availableVoices.map((voice, index) => {
                const quality = voice.name.includes('Google') ? '⭐⭐⭐⭐⭐' :
                              voice.name.includes('Neural') || voice.name.includes('Wavenet') ? '⭐⭐⭐⭐' :
                              voice.name.includes('Kyoko') || voice.name.includes('Otoya') ? '⭐⭐⭐⭐' :
                              voice.name.includes('Online') ? '⭐⭐⭐' : '⭐⭐';
                return (
                  <option key={index} value={voice.name}>
                    {voice.name} {quality}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              ⭐⭐⭐⭐⭐ = 最高品質、⭐⭐⭐⭐ = 高品質、⭐⭐⭐ = 標準
            </p>
          </div>

          {/* 速度調整 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              読み上げ速度: {rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>ゆっくり (0.5x)</span>
              <span>標準 (1.0x)</span>
              <span>速い (2.0x)</span>
            </div>
          </div>

          {/* 選択された音声の情報 */}
          {selectedVoiceName && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                現在の音声: {selectedVoiceName}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {selectedVoiceName.includes('Google') && 'Google高品質音声（最高品質）'}
                {(selectedVoiceName.includes('Neural') || selectedVoiceName.includes('Wavenet')) && 'ニューラル音声（高品質）'}
                {selectedVoiceName.includes('Kyoko') && 'macOS標準音声（女性、高品質）'}
                {selectedVoiceName.includes('Otoya') && 'macOS標準音声（男性、高品質）'}
              </p>
            </div>
          )}

          {/* 利用可能な音声一覧（折りたたみ） */}
          {availableVoices.length > 0 && (
            <div className="mb-6">
              <details className="text-sm">
                <summary className="cursor-pointer font-medium mb-2">
                  すべての利用可能な音声 ({availableVoices.length}個)
                </summary>
                <div className="space-y-1 ml-4 max-h-60 overflow-y-auto">
                  {availableVoices.map((voice, index) => {
                    const quality = voice.name.includes('Google') ? '⭐⭐⭐⭐⭐' :
                                  voice.name.includes('Neural') || voice.name.includes('Wavenet') ? '⭐⭐⭐⭐' :
                                  voice.name.includes('Kyoko') || voice.name.includes('Otoya') ? '⭐⭐⭐⭐' :
                                  voice.name.includes('Online') ? '⭐⭐⭐' : '⭐⭐';
                    return (
                      <div key={index} className="text-xs text-gray-600 py-1">
                        {voice.name} ({voice.lang}) {quality}
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          )}
        </>
      )}

      {/* テスト再生ボタン */}
      <button
        onClick={testVoice}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        🔊 音声をテスト
      </button>

      {/* ヒント */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-medium mb-1">💡 おすすめ設定</p>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• <strong>Chrome/Edge:</strong> 「Google 日本語」を選択（最高品質⭐⭐⭐⭐⭐）</li>
          <li>• <strong>Safari/macOS:</strong> 「Kyoko」または「Otoya」を選択（高品質⭐⭐⭐⭐）</li>
          <li>• <strong>自動選択:</strong> 空欄にすると最高品質の音声が自動で選ばれます</li>
          <li>• <strong>より高品質:</strong> Google Cloud TTS（月100万文字無料）</li>
        </ul>
      </div>
    </div>
  );
}
