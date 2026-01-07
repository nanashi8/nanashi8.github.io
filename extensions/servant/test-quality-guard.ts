/**
 * CodeQualityGuard のテストケース
 *
 * このファイルを保存すると、Servantが以下の問題を検出します:
 * 1. 関数の重複定義
 * 2. HTML内のJavaScript重複
 * 3. 変数スコープ問題
 */

// ❌ テストケース1: 関数の重複定義（意図的なテストケース - 使用しない）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateTotalPrice(items: any[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 中略...

// ❌ 同じ関数名を再定義（これが問題）- 修正済み
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateTotalValue(items: any[]) {
  return items.reduce((sum, item) => sum + item.value, 0);
}

// ❌ テストケース2: const再代入の試み
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const config = {
  apiUrl: 'https://api.example.com',
};

// 後で...
// config = { apiUrl: 'https://api2.example.com' }; // ← これはエラー

// ✅ テストケース3: HTML内のJavaScript重複
export function getHTML(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><title>Test</title></head>
    <body>
      <script>
        function animate() {
          console.log('Animation 1');
        }

        // 中略...

        function animate() {
          console.log('Animation 2'); // ❌ 重複！
        }
      </script>
    </body>
    </html>
  `;
}

// ✅ 正しい例: 関数名を変更
function calculateSubtotal(items: any[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateTotalWithTax(items: any[]) {
  const subtotal = calculateSubtotal(items);
  return subtotal * 1.1;
}
