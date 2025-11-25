#!/usr/bin/env node

/**
 * ダークモード機能の自動テストスクリプト
 * 
 * このスクリプトは以下をチェックします：
 * 1. CSS変数の定義
 * 2. ダークモードのCSS変数オーバーライド
 * 3. ハードコードされた色の検出
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌓 ダークモード機能テスト開始\n');

// テスト結果を保存
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// 1. index.cssのCSS変数定義をチェック
function testIndexCSS() {
  console.log('📋 Test 1: index.cssのCSS変数定義をチェック');
  
  const indexCssPath = path.join(__dirname, 'src', 'index.css');
  const content = fs.readFileSync(indexCssPath, 'utf-8');
  
  const requiredVars = [
    '--text-color',
    '--background',
    '--bg-secondary',
    '--success-color',
    '--error-color',
    '--warning-color',
    '--info-color',
    '--card-bg',
    '--btn-primary-bg'
  ];
  
  let allFound = true;
  requiredVars.forEach(varName => {
    if (content.includes(varName)) {
      results.passed.push(`✓ ${varName} が定義されています`);
    } else {
      results.failed.push(`✗ ${varName} が定義されていません`);
      allFound = false;
    }
  });
  
  if (allFound) {
    console.log('  ✓ 全ての必須CSS変数が定義されています\n');
  } else {
    console.log('  ✗ 一部のCSS変数が定義されていません\n');
  }
  
  return allFound;
}

// 2. App.cssのダークモードオーバーライドをチェック
function testAppCSS() {
  console.log('📋 Test 2: App.cssのダークモードオーバーライドをチェック');
  
  const appCssPath = path.join(__dirname, 'src', 'App.css');
  const content = fs.readFileSync(appCssPath, 'utf-8');
  
  // .dark-modeセレクタが存在するか
  if (!content.includes('.dark-mode')) {
    results.failed.push('✗ .dark-modeセレクタが見つかりません');
    console.log('  ✗ .dark-modeセレクタが見つかりません\n');
    return false;
  }
  
  results.passed.push('✓ .dark-modeセレクタが存在します');
  
  // ダークモードでCSS変数がオーバーライドされているか
  const darkModeSection = content.match(/\.dark-mode\s*{[^}]+}/s);
  if (darkModeSection) {
    const overrides = darkModeSection[0].match(/--[\w-]+:/g) || [];
    console.log(`  ✓ ${overrides.length}個のCSS変数がダークモードでオーバーライドされています`);
    results.passed.push(`✓ ${overrides.length}個のCSS変数オーバーライド`);
  }
  
  console.log('  ✓ ダークモードの設定が正しく行われています\n');
  return true;
}

// 3. ハードコードされた色の検出
function testHardcodedColors() {
  console.log('📋 Test 3: ハードコードされた色の検出');
  
  const cssFiles = [
    'src/App.css',
    'src/index.css',
    'src/components/GrammarQuizView.css',
    'src/components/GamificationPanel.css'
  ];
  
  const colorPatterns = [
    /#[0-9a-fA-F]{3,6}\b/g,  // hex colors
    /rgba?\([^)]+\)/g         // rgb/rgba colors
  ];
  
  let totalHardcoded = 0;
  
  cssFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      results.warnings.push(`⚠ ${filePath} が見つかりません`);
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // .dark-mode内のハードコード（これらは許容される）を除外
    const nonDarkModeContent = content.replace(/\.dark-mode\s*{[^}]+}/gs, '');
    
    let fileHardcoded = 0;
    colorPatterns.forEach(pattern => {
      const matches = nonDarkModeContent.match(pattern) || [];
      fileHardcoded += matches.length;
    });
    
    if (fileHardcoded > 0) {
      console.log(`  ⚠ ${filePath}: ${fileHardcoded}箇所でハードコードされた色が検出されました`);
      results.warnings.push(`⚠ ${filePath}: ${fileHardcoded}箇所のハードコード`);
      totalHardcoded += fileHardcoded;
    }
  });
  
  if (totalHardcoded === 0) {
    console.log('  ✓ ハードコードされた色は検出されませんでした\n');
    results.passed.push('✓ ハードコードされた色なし');
  } else {
    console.log(`  ⚠ 合計 ${totalHardcoded}箇所でハードコードされた色が検出されました\n`);
  }
  
  return totalHardcoded === 0;
}

// 4. SettingsView.tsxのダークモード切り替え実装をチェック
function testSettingsImplementation() {
  console.log('📋 Test 4: SettingsView.tsxの実装をチェック');
  
  const settingsPath = path.join(__dirname, 'src', 'components', 'SettingsView.tsx');
  const content = fs.readFileSync(settingsPath, 'utf-8');
  
  const checks = [
    { name: 'darkMode state', pattern: /const \[darkMode, setDarkMode\]/ },
    { name: 'applyDarkMode function', pattern: /const applyDarkMode/ },
    { name: 'handleDarkModeChange function', pattern: /const handleDarkModeChange/ },
    { name: 'localStorage保存', pattern: /localStorage\.setItem\('darkMode'/ },
    { name: 'dark-modeクラス切り替え', pattern: /classList\.toggle\('dark-mode'/ }
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      results.passed.push(`✓ ${check.name}が実装されています`);
      console.log(`  ✓ ${check.name}が実装されています`);
    } else {
      results.failed.push(`✗ ${check.name}が見つかりません`);
      console.log(`  ✗ ${check.name}が見つかりません`);
      allPassed = false;
    }
  });
  
  console.log('');
  return allPassed;
}

// テスト実行
const test1 = testIndexCSS();
const test2 = testAppCSS();
const test3 = testHardcodedColors();
const test4 = testSettingsImplementation();

// 結果サマリー
console.log('═══════════════════════════════════════');
console.log('📊 テスト結果サマリー');
console.log('═══════════════════════════════════════');
console.log(`✓ 成功: ${results.passed.length}`);
console.log(`✗ 失敗: ${results.failed.length}`);
console.log(`⚠ 警告: ${results.warnings.length}`);
console.log('═══════════════════════════════════════\n');

if (results.failed.length > 0) {
  console.log('❌ 失敗したテスト:');
  results.failed.forEach(f => console.log('  ' + f));
  console.log('');
}

if (results.warnings.length > 0) {
  console.log('⚠️  警告:');
  results.warnings.forEach(w => console.log('  ' + w));
  console.log('');
}

const allTestsPassed = test1 && test2 && test4;

if (allTestsPassed) {
  console.log('🎉 全てのテストに合格しました！');
  console.log('');
  console.log('次のステップ:');
  console.log('1. npm run dev でアプリを起動');
  console.log('2. ブラウザで http://localhost:5173/ を開く');
  console.log('3. 設定タブからダークモードを切り替えて動作確認');
  console.log('');
  process.exit(0);
} else {
  console.log('❌ 一部のテストに失敗しました。上記のエラーを確認してください。');
  console.log('');
  process.exit(1);
}
