// ========================================
// 学習型英語フレーズアプリ - メインスクリプト
// ========================================

// IndexedDB ストア設定
const CORRECTION_STORE = 'corrections';
const HISTORY_STORE = 'history_entries';

// localForage の初期化
const correctionsDB = localforage.createInstance({
    name: 'studyApp',
    storeName: CORRECTION_STORE
});

const historyDB = localforage.createInstance({
    name: 'studyApp',
    storeName: HISTORY_STORE
});

// グローバル変数
let phrases = [];
let currentPlayIndex = -1;
let isPlaying = false;
let speechRate = 1.0;

// DOM要素
const inputText = document.getElementById('inputText');
const splitBtn = document.getElementById('splitBtn');
const clearBtn = document.getElementById('clearBtn');
const phrasesList = document.getElementById('phrasesList');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const autoPlayNext = document.getElementById('autoPlayNext');
const playAllBtn = document.getElementById('playAllBtn');

// 履歴関連
const showHistoryBtn = document.getElementById('showHistoryBtn');
const exportHistoryBtn = document.getElementById('exportHistoryBtn');
const importHistoryBtn = document.getElementById('importHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const importFile = document.getElementById('importFile');
const historyList = document.getElementById('historyList');

// 修正訳関連
const showCorrectionsBtn = document.getElementById('showCorrectionsBtn');
const exportCorrectionsBtn = document.getElementById('exportCorrectionsBtn');
const clearCorrectionsBtn = document.getElementById('clearCorrectionsBtn');
const correctionsList = document.getElementById('correctionsList');

// ========================================
// イベントリスナー
// ========================================

splitBtn.addEventListener('click', handleSplit);
clearBtn.addEventListener('click', handleClear);
speedSlider.addEventListener('input', handleSpeedChange);
playAllBtn.addEventListener('click', handlePlayAll);

showHistoryBtn.addEventListener('click', displayHistory);
exportHistoryBtn.addEventListener('click', exportHistory);
importHistoryBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', importHistory);
clearHistoryBtn.addEventListener('click', clearHistory);

showCorrectionsBtn.addEventListener('click', displayCorrections);
exportCorrectionsBtn.addEventListener('click', exportCorrections);
clearCorrectionsBtn.addEventListener('click', clearCorrections);

// ========================================
// 文節分割処理
// ========================================

function handleSplit() {
    const text = inputText.value.trim();
    if (!text) {
        alert('英語テキストを入力してください。');
        return;
    }

    // 文に分割（句点で区切り）
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    phrases = [];
    sentences.forEach(sentence => {
        // 各文をさらに細かく分割（カンマ、セミコロン、接続詞など）
        const subPhrases = sentence
            .split(/(?:,|;|\s+and\s+|\s+but\s+|\s+or\s+|\s+because\s+|\s+when\s+|\s+if\s+|\s+while\s+|\s+although\s+)/i)
            .map(p => p.trim())
            .filter(p => p.length > 0);
        
        phrases.push(...subPhrases);
    });

    displayPhrases();
    playAllBtn.style.display = phrases.length > 0 ? 'inline-block' : 'none';
}

function handleClear() {
    inputText.value = '';
    phrases = [];
    phrasesList.innerHTML = '';
    playAllBtn.style.display = 'none';
}

function displayPhrases() {
    phrasesList.innerHTML = '';
    
    phrases.forEach((phrase, index) => {
        const card = createPhraseCard(phrase, index);
        phrasesList.appendChild(card);
    });
}

function createPhraseCard(phrase, index) {
    const card = document.createElement('div');
    card.className = 'phrase-card';
    card.dataset.index = index;

    card.innerHTML = `
        <div class="phrase-header">
            <span class="phrase-number">#${index + 1}</span>
            <div class="phrase-text">${escapeHtml(phrase)}</div>
        </div>
        <div class="phrase-actions">
            <button class="btn-secondary btn-small play-en-btn">🔊 英語再生</button>
            <button class="btn-secondary btn-small translate-btn">🌐 訳を取得</button>
            <button class="btn-secondary btn-small play-ja-btn" style="display: none;">🔊 日本語再生</button>
        </div>
        <div class="translation-area" style="display: none;">
            <div class="translation-text"></div>
            <div class="button-group">
                <button class="btn-secondary btn-small edit-btn">✏️ 訳を編集</button>
            </div>
            <div class="translation-edit">
                <textarea class="edit-textarea"></textarea>
                <button class="btn-primary btn-small save-btn">保存</button>
                <button class="btn-secondary btn-small cancel-btn">キャンセル</button>
            </div>
        </div>
    `;

    // イベントリスナー設定
    const playEnBtn = card.querySelector('.play-en-btn');
    const translateBtn = card.querySelector('.translate-btn');
    const playJaBtn = card.querySelector('.play-ja-btn');
    const editBtn = card.querySelector('.edit-btn');
    const saveBtn = card.querySelector('.save-btn');
    const cancelBtn = card.querySelector('.cancel-btn');

    playEnBtn.addEventListener('click', () => playEnglish(phrase, index));
    translateBtn.addEventListener('click', () => getTranslation(phrase, index));
    playJaBtn.addEventListener('click', () => playJapanese(index));
    editBtn.addEventListener('click', () => enableEdit(index));
    saveBtn.addEventListener('click', () => saveCorrection(phrase, index));
    cancelBtn.addEventListener('click', () => cancelEdit(index));

    return card;
}

// ========================================
// 音声再生（英語）
// ========================================

function playEnglish(phrase, index) {
    if (isPlaying) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = 'en-US';
    utterance.rate = speechRate;

    utterance.onstart = () => {
        isPlaying = true;
        currentPlayIndex = index;
        saveHistory(phrase, 'play_en');
    };

    utterance.onend = () => {
        isPlaying = false;
        if (autoPlayNext.checked && currentPlayIndex < phrases.length - 1) {
            currentPlayIndex++;
            const nextPhrase = phrases[currentPlayIndex];
            setTimeout(() => playEnglish(nextPhrase, currentPlayIndex), 500);
        }
    };

    utterance.onerror = () => {
        isPlaying = false;
        alert('音声再生に失敗しました。ブラウザがWeb Speech APIをサポートしていない可能性があります。');
    };

    window.speechSynthesis.speak(utterance);
}

// ========================================
// 翻訳取得
// ========================================

async function getTranslation(phrase, index) {
    const card = document.querySelector(`.phrase-card[data-index="${index}"]`);
    const translateBtn = card.querySelector('.translate-btn');
    const translationArea = card.querySelector('.translation-area');
    const translationText = card.querySelector('.translation-text');
    const playJaBtn = card.querySelector('.play-ja-btn');

    translateBtn.disabled = true;
    translateBtn.textContent = '翻訳中...';

    try {
        // まずローカル修正を確認
        let translation = await findBestCorrection(phrase);

        // 見つからなければLibreTranslateで翻訳
        if (!translation) {
            translation = await translateWithLibreTranslate(phrase);
        }

        translationText.textContent = translation;
        translationArea.style.display = 'block';
        playJaBtn.style.display = 'inline-block';

        // 履歴保存
        saveHistory(phrase, 'translate', { translation });

    } catch (error) {
        console.error('翻訳エラー:', error);
        translationText.textContent = '翻訳に失敗しました。ネットワーク接続を確認してください。';
        translationArea.style.display = 'block';
    } finally {
        translateBtn.disabled = false;
        translateBtn.textContent = '🌐 訳を取得';
    }
}

async function translateWithLibreTranslate(text) {
    const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: text,
            source: 'en',
            target: 'ja',
            format: 'text'
        })
    });

    if (!response.ok) {
        throw new Error('翻訳APIエラー');
    }

    const data = await response.json();
    return data.translatedText;
}

// ========================================
// ローカル修正訳の検索（完全一致 + Levenshtein）
// ========================================

async function findBestCorrection(phrase) {
    // 完全一致を優先
    const exactMatch = await correctionsDB.getItem(phrase);
    if (exactMatch) {
        return exactMatch.translation;
    }

    // 類似度マッチ（Levenshtein距離）
    const allKeys = await correctionsDB.keys();
    let bestMatch = null;
    let bestDistance = Infinity;
    const threshold = Math.floor(phrase.length * 0.2); // 20%以内の差異を許容

    for (const key of allKeys) {
        const distance = levenshteinDistance(phrase.toLowerCase(), key.toLowerCase());
        if (distance < bestDistance && distance <= threshold) {
            bestDistance = distance;
            bestMatch = key;
        }
    }

    if (bestMatch) {
        const correction = await correctionsDB.getItem(bestMatch);
        return correction.translation;
    }

    return null;
}

function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[len1][len2];
}

// ========================================
// 日本語音声再生
// ========================================

function playJapanese(index) {
    const card = document.querySelector(`.phrase-card[data-index="${index}"]`);
    const translationText = card.querySelector('.translation-text').textContent;

    if (!translationText || translationText.includes('失敗')) {
        alert('翻訳テキストがありません。');
        return;
    }

    if (isPlaying) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(translationText);
    utterance.lang = 'ja-JP';
    utterance.rate = speechRate;

    utterance.onstart = () => {
        isPlaying = true;
        saveHistory(phrases[index], 'play_ja', { translation: translationText });
    };

    utterance.onend = () => {
        isPlaying = false;
    };

    utterance.onerror = () => {
        isPlaying = false;
        alert('日本語音声再生に失敗しました。');
    };

    window.speechSynthesis.speak(utterance);
}

// ========================================
// 訳の編集と保存
// ========================================

function enableEdit(index) {
    const card = document.querySelector(`.phrase-card[data-index="${index}"]`);
    const translationText = card.querySelector('.translation-text');
    const editArea = card.querySelector('.translation-edit');
    const textarea = card.querySelector('.edit-textarea');

    textarea.value = translationText.textContent;
    editArea.classList.add('active');
}

function cancelEdit(index) {
    const card = document.querySelector(`.phrase-card[data-index="${index}"]`);
    const editArea = card.querySelector('.translation-edit');
    editArea.classList.remove('active');
}

async function saveCorrection(phrase, index) {
    const card = document.querySelector(`.phrase-card[data-index="${index}"]`);
    const textarea = card.querySelector('.edit-textarea');
    const translationText = card.querySelector('.translation-text');
    const editArea = card.querySelector('.translation-edit');

    const newTranslation = textarea.value.trim();
    if (!newTranslation) {
        alert('翻訳を入力してください。');
        return;
    }

    // IndexedDB に保存
    await correctionsDB.setItem(phrase, {
        translation: newTranslation,
        savedAt: new Date().toISOString()
    });

    translationText.textContent = newTranslation;
    editArea.classList.remove('active');

    // 履歴保存
    saveHistory(phrase, 'save_correction', { translation: newTranslation });

    alert('修正訳を保存しました！');
}

// ========================================
// 履歴保存
// ========================================

async function saveHistory(phrase, action, meta = {}) {
    const entry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        phrase,
        meta: { action, ...meta }
    };

    await historyDB.setItem(String(entry.id), entry);
}

async function displayHistory() {
    historyList.innerHTML = '<p>読み込み中...</p>';
    
    const keys = await historyDB.keys();
    const entries = [];

    for (const key of keys) {
        const entry = await historyDB.getItem(key);
        entries.push(entry);
    }

    // タイムスタンプでソート（新しい順）
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (entries.length === 0) {
        historyList.innerHTML = '<p>履歴はありません。</p>';
        return;
    }

    historyList.innerHTML = '';
    entries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'history-item';

        const date = new Date(entry.timestamp).toLocaleString('ja-JP');
        const actionLabel = getActionLabel(entry.meta.action);

        item.innerHTML = `
            <div class="history-timestamp">${date}</div>
            <div class="history-phrase">${escapeHtml(entry.phrase)}</div>
            <div class="history-meta">${actionLabel}</div>
        `;

        historyList.appendChild(item);
    });
}

function getActionLabel(action) {
    const labels = {
        'play_en': '🔊 英語再生',
        'play_ja': '🔊 日本語再生',
        'translate': '🌐 翻訳取得',
        'save_correction': '✏️ 修正訳保存'
    };
    return labels[action] || action;
}

async function exportHistory() {
    const keys = await historyDB.keys();
    const entries = [];

    for (const key of keys) {
        const entry = await historyDB.getItem(key);
        entries.push(entry);
    }

    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function importHistory(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const entries = JSON.parse(e.target.result);
            
            for (const entry of entries) {
                await historyDB.setItem(String(entry.id), entry);
            }

            alert(`${entries.length}件の履歴をインポートしました。`);
            displayHistory();
        } catch (error) {
            console.error('インポートエラー:', error);
            alert('ファイルの読み込みに失敗しました。');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

async function clearHistory() {
    if (!confirm('すべての履歴を削除しますか？この操作は取り消せません。')) {
        return;
    }

    await historyDB.clear();
    historyList.innerHTML = '<p>履歴を削除しました。</p>';
    alert('履歴を全消去しました。');
}

// ========================================
// 修正訳の管理
// ========================================

async function displayCorrections() {
    correctionsList.innerHTML = '<p>読み込み中...</p>';
    
    const keys = await correctionsDB.keys();
    
    if (keys.length === 0) {
        correctionsList.innerHTML = '<p>修正訳はありません。</p>';
        return;
    }

    correctionsList.innerHTML = '';
    
    for (const key of keys) {
        const correction = await correctionsDB.getItem(key);
        const item = document.createElement('div');
        item.className = 'correction-item';

        const date = new Date(correction.savedAt).toLocaleString('ja-JP');

        item.innerHTML = `
            <div class="correction-content">
                <div class="correction-original"><strong>原文:</strong> ${escapeHtml(key)}</div>
                <div class="correction-translation"><strong>訳:</strong> ${escapeHtml(correction.translation)}</div>
                <div class="correction-date">保存日時: ${date}</div>
            </div>
            <button class="btn-danger btn-small delete-correction-btn" data-key="${escapeHtml(key)}">削除</button>
        `;

        const deleteBtn = item.querySelector('.delete-correction-btn');
        deleteBtn.addEventListener('click', () => deleteCorrection(key));

        correctionsList.appendChild(item);
    }
}

async function deleteCorrection(key) {
    if (!confirm('この修正訳を削除しますか?')) {
        return;
    }

    await correctionsDB.removeItem(key);
    displayCorrections();
}

async function exportCorrections() {
    const keys = await correctionsDB.keys();
    const corrections = {};

    for (const key of keys) {
        corrections[key] = await correctionsDB.getItem(key);
    }

    const blob = new Blob([JSON.stringify(corrections, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrections_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

async function clearCorrections() {
    if (!confirm('すべての修正訳を削除しますか？この操作は取り消せません。')) {
        return;
    }

    await correctionsDB.clear();
    correctionsList.innerHTML = '<p>修正訳を削除しました。</p>';
    alert('修正訳を全消去しました。');
}

// ========================================
// 再生速度調整
// ========================================

function handleSpeedChange(event) {
    speechRate = parseFloat(event.target.value);
    speedValue.textContent = speechRate.toFixed(1);
}

// ========================================
// 全フレーズ連続再生
// ========================================

function handlePlayAll() {
    if (phrases.length === 0) return;
    
    currentPlayIndex = 0;
    autoPlayNext.checked = true;
    playEnglish(phrases[0], 0);
}

// ========================================
// ユーティリティ
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// 初期化
// ========================================

console.log('学習型英語フレーズアプリが起動しました。');
