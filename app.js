// SimpleWord Web版プロトタイプ - メインアプリケーション

// サンプル問題データ
const quizData = [
    { question: "apple", choices: ["りんご", "みかん", "ばなな", "ぶどう"], correct: 0 },
    { question: "book", choices: ["ノート", "本", "ペン", "紙"], correct: 1 },
    { question: "cat", choices: ["犬", "猫", "鳥", "魚"], correct: 1 },
    { question: "dog", choices: ["犬", "猫", "うさぎ", "ライオン"], correct: 0 },
    { question: "house", choices: ["学校", "病院", "家", "店"], correct: 2 },
    { question: "water", choices: ["水", "お茶", "ジュース", "牛乳"], correct: 0 },
    { question: "friend", choices: ["家族", "友達", "先生", "敵"], correct: 1 },
    { question: "school", choices: ["家", "公園", "学校", "図書館"], correct: 2 },
    { question: "happy", choices: ["悲しい", "嬉しい", "怒る", "眠い"], correct: 1 },
    { question: "beautiful", choices: ["醜い", "汚い", "美しい", "普通"], correct: 2 }
];

// アプリケーション状態
let currentQuestionIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
let questions = [];

// 画面切り替え関数
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showHome() {
    showScreen('home-screen');
}

function showSettings() {
    showScreen('settings-screen');
}

function startQuiz() {
    // クイズデータをシャッフル
    questions = [...quizData].sort(() => Math.random() - 0.5);
    
    // 設定から出題数を取得
    const questionCount = parseInt(document.getElementById('question-count')?.value || 10);
    questions = questions.slice(0, questionCount);
    
    // 状態をリセット
    currentQuestionIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    
    // UIを更新
    document.getElementById('total-questions').textContent = questions.length;
    document.getElementById('correct-count').textContent = '0';
    document.getElementById('incorrect-count').textContent = '0';
    
    showScreen('quiz-screen');
    displayQuestion();
}

function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showResult();
        return;
    }
    
    const question = questions[currentQuestionIndex];
    
    // 問題番号と進捗を更新
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('question-num').textContent = currentQuestionIndex + 1;
    document.getElementById('question-text').textContent = question.question;
    
    // 選択肢を生成
    const choicesContainer = document.getElementById('choices');
    choicesContainer.innerHTML = '';
    
    question.choices.forEach((choice, index) => {
        const choiceElement = document.createElement('div');
        choiceElement.className = 'choice';
        choiceElement.textContent = choice;
        choiceElement.onclick = () => selectChoice(index);
        choicesContainer.appendChild(choiceElement);
    });
    
    // 結果表示を隠す
    document.getElementById('quiz-result').classList.add('hidden');
}

function selectChoice(selectedIndex) {
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;
    
    // 選択肢を無効化
    const choices = document.querySelectorAll('.choice');
    choices.forEach((choice, index) => {
        choice.classList.add('disabled');
        if (index === question.correct) {
            choice.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            choice.classList.add('incorrect');
        }
    });
    
    // 結果を更新
    if (isCorrect) {
        correctCount++;
        document.getElementById('correct-count').textContent = correctCount;
        document.getElementById('result-icon').textContent = '✓';
        document.getElementById('result-text').textContent = '正解！';
        document.getElementById('quiz-result').style.background = '#e8f8eb';
    } else {
        incorrectCount++;
        document.getElementById('incorrect-count').textContent = incorrectCount;
        document.getElementById('result-icon').textContent = '✗';
        document.getElementById('result-text').textContent = `不正解。正解は「${question.choices[question.correct]}」です。`;
        document.getElementById('quiz-result').style.background = '#ffe8e6';
    }
    
    // 結果を表示
    document.getElementById('quiz-result').classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
}

function showResult() {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    
    alert(`クイズ終了！\n\n正解: ${correctCount}問\n不正解: ${incorrectCount}問\n正答率: ${accuracy}%`);
    
    showHome();
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    showHome();
});
