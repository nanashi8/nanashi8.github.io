# Phase 7: 天体儀 - 高度な可視化機能 実装計画

## 実装日
2026年1月5日

---

## 要件

### 1. エッジの可視化（結線表示）✨
**要望**: 天体間の結合が強ければ結線を太くする
- NeuralEdgeのweightに基づいて線の太さを変える
- 重み 0.8以上: 太線（0.5単位）
- 重み 0.5〜0.8: 中線（0.3単位）
- 重み 0.3〜0.5: 細線（0.15単位）
- 重み 0.3未満: 非表示（ノイズ削減）

### 2. 依存深度フィルター（衛星表示）✨
**要望**: 天体の衛星（何次かまでの依存関係）を切り替えて表示
- 選択したノードから1次、2次、3次の依存関係を計算
- UI: ドロップダウンで「すべて / 1次のみ / 2次まで / 3次まで」選択
- デフォルト: 2次まで表示（バランス良い）
- 依存関係の深さに応じて色の透明度を変える

### 3. 主要エッジのみ表示✨
**要望**: 主要ないくつかまでの結線を表示
- 全エッジを表示すると複雑すぎる（スパゲッティ化）
- 重みの高い上位N本のエッジだけ表示
- UI: スライダーで「エッジ表示数」を調整（10〜100本）
- デフォルト: 50本
- チェックボックスで「エッジを表示」オン・オフ

### 4. ノード選択時のハイライト✨
**要望**: 任意の天体を選択したとき、関連した小惑星や結線をハイライト
- ノードをクリック→選択状態に
- 選択ノード: 黄色の発光エフェクト、サイズ1.5倍
- 関連ノード（接続先）: 緑色のハイライト
- 関連エッジ: 明るい色、太さ1.5倍
- 非関連ノード: 半透明（opacity 0.3）
- ダブルクリックで選択解除

---

## 実装フェーズ

### Phase 7.1: エッジの3D可視化（基本） ⏱ 1.5〜2時間
**目標**: NeuralEdgeを3D線で描画する基本機能

**実装内容**:
1. ConstellationDataGeneratorにエッジ情報追加
   - `generateEdges()`: 上位Nエッジを選択
   - エッジのweight、from、toを含むデータ
2. ConstellationViewPanel HTMLに追加
   - Three.jsのLine/TubeGeometryでエッジ描画
   - カラーマップ（重み→色）
   - 基本的な線（太さ固定）
3. 表示設定パネル
   - 「エッジを表示」チェックボックス

**成功基準**:
- ノード間に白い線が引かれる
- チェックボックスでオン・オフできる

---

### Phase 7.2: 重み別の線の太さ・色 ⏱ 1〜1.5時間
**目標**: エッジの重みに応じて太さと色を変える

**実装内容**:
1. エッジ描画ロジック改善
   - 重み→太さマッピング（0.15〜0.5単位）
   - 重み→色マッピング（青→緑→黄→赤）
   - TubeGeometry使用（円柱状の線）
2. エッジのホバー表示
   - エッジにカーソルを合わせると情報表示
   - 「src/a.ts → src/b.ts (重み: 0.85)」

**成功基準**:
- 重要な接続は太くて赤い
- 弱い接続は細くて青い
- エッジにホバーすると情報表示

---

### Phase 7.3: 主要エッジのみ表示 ⏱ 1〜1.5時間
**目標**: 上位N本のエッジだけ表示してスパゲッティ化を防ぐ

**実装内容**:
1. ConstellationDataGenerator
   - `getTopEdges(n: number)`: 重み順でソート、上位N件取得
   - デフォルト: 50本
2. 表示設定パネル
   - スライダー追加: 「エッジ表示数: 10〜100」
   - スライダー変更→即座に再描画
3. 統計表示
   - 「エッジ: 50 / 1234」（表示数 / 総数）

**成功基準**:
- デフォルトで50本のエッジだけ表示
- スライダーで動的に変更できる
- 複雑さが適度に保たれる

---

### Phase 7.4: 依存深度フィルター ⏱ 1.5〜2時間
**目標**: 選択したノードからN次までの依存関係を表示

**実装内容**:
1. ConstellationDataGenerator
   - `calculateDependencyDepth(nodeId, maxDepth)`: BFS/DFSで深度計算
   - 各ノードに`depth`プロパティ追加（0=選択, 1=1次, 2=2次...）
2. フィルター機能
   - ドロップダウン: 「すべて / 1次のみ / 2次まで / 3次まで」
   - 選択に応じてノード・エッジの表示切り替え
3. 視覚的フィードバック
   - 深度0: 通常の色
   - 深度1: 80%の透明度
   - 深度2: 60%の透明度
   - 深度3以上: 40%の透明度

**成功基準**:
- ノード選択→依存関係ツリーを可視化
- ドロップダウンで深度を変更できる
- 「衛星」のような階層構造が見える

---

### Phase 7.5: ノード選択時のハイライト ⏱ 1.5〜2時間
**目標**: 選択したノードと関連する接続を強調表示

**実装内容**:
1. ノード選択システム
   - クリック→選択状態に（selectedNodeId保持）
   - ダブルクリック→選択解除
   - 選択ノード: 黄色の発光エフェクト（emissiveIntensity=0.8）
   - サイズ1.5倍のアニメーション
2. 関連ノード・エッジの検出
   - `findRelatedNodes(nodeId)`: 直接接続されたノードを取得
   - `findRelatedEdges(nodeId)`: 選択ノードに接続するエッジ
3. ハイライト描画
   - 関連ノード: 緑色（#4caf50）、明るく
   - 関連エッジ: 明るい色、太さ1.5倍
   - 非関連ノード: opacity=0.3（半透明）
   - 非関連エッジ: opacity=0.1（ほぼ透明）
4. 情報パネル（左下）
   - 選択ノード情報を詳細表示
   - 「接続先: 5件」「接続元: 3件」

**成功基準**:
- ノードをクリック→関連が一目でわかる
- ダブルクリックで通常表示に戻る
- 複雑なプロジェクトでも「この部分だけ見る」が可能

---

## 総合実装時間

### 見積もり
- Phase 7.1: 1.5〜2時間
- Phase 7.2: 1〜1.5時間
- Phase 7.3: 1〜1.5時間
- Phase 7.4: 1.5〜2時間
- Phase 7.5: 1.5〜2時間
- **総時間**: 6.5〜9時間

### リスク要因
- Three.jsのパフォーマンス（エッジが多いと重い）→ 上位Nエッジのみ表示で軽減
- 複雑なフィルターロジック→ 段階的に実装
- WebView↔Extensionのメッセージング遅延→ キャッシュで軽減

---

## 技術詳細

### エッジ描画（Three.js）
```typescript
// オプション1: LineSegments（軽い、太さ固定）
const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
const line = new THREE.Line(geometry, material);

// オプション2: TubeGeometry（重い、太さ可変）
const path = new THREE.LineCurve3(start, end);
const geometry = new THREE.TubeGeometry(path, 1, radius, 8);
const material = new THREE.MeshBasicMaterial({ color });
const tube = new THREE.Mesh(geometry, material);
```

**推奨**: Phase 7.1はLineSegments、Phase 7.2でTubeGeometryに移行

### 依存深度計算（BFS）
```typescript
function calculateDependencyDepth(
  graph: NeuralDependencyGraph, 
  startNode: string, 
  maxDepth: number
): Map<string, number> {
  const depths = new Map<string, number>();
  const queue: Array<[string, number]> = [[startNode, 0]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [nodeId, depth] = queue.shift()!;
    
    if (visited.has(nodeId) || depth > maxDepth) continue;
    
    visited.add(nodeId);
    depths.set(nodeId, depth);

    // 接続先を追加
    const edges = graph.getEdges().get(nodeId) || [];
    for (const edge of edges) {
      if (!visited.has(edge.to)) {
        queue.push([edge.to, depth + 1]);
      }
    }
  }

  return depths;
}
```

### 重み→色マッピング
```typescript
function getEdgeColor(weight: number): number {
  if (weight >= 0.8) return 0xff4444; // 赤（超重要）
  if (weight >= 0.6) return 0xffaa44; // オレンジ（重要）
  if (weight >= 0.4) return 0xffff44; // 黄色（中）
  if (weight >= 0.3) return 0x44ff44; // 緑（弱）
  return 0x4444ff; // 青（超弱）
}

function getEdgeRadius(weight: number): number {
  return 0.15 + (weight * 0.35); // 0.15〜0.5
}
```

---

## パフォーマンス最適化

### エッジ数の制限
- 全エッジ表示: 1000エッジで20fps（重い）
- 上位50エッジ: 1000エッジでも60fps（軽い）
- **推奨**: デフォルト50本、最大100本

### 描画の最適化
1. **インスタンシング**: 同じ形状を複数描画
   ```typescript
   const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
   ```
2. **LOD (Level of Detail)**: 遠くのエッジは簡略化
3. **カリング**: 画面外のエッジは描画しない

### メモリ使用量
- エッジ1本あたり: 約2KB（TubeGeometry）
- 50本: 100KB
- 100本: 200KB
- **影響**: 軽微（WebView全体で100MB以下）

---

## UI設計

### 表示設定パネル（右上）- 拡張版
```
🌟 表示設定
━━━━━━━━━━━━━━━━
☑ 3軸を表示
☑ グリッドを表示
☑ 軌道線を表示
☑ ラベルを表示

━━ エッジ設定 ━━
☑ エッジを表示
エッジ数: [====●=====] 50

━━ フィルター ━━
依存深度: [すべて ▼]
- すべて
- 1次のみ
- 2次まで
- 3次まで

━━━━━━━━━━━━━━━━
[🔄 データ更新]
[📷 視点リセット]
[🎯 選択解除]
```

### 情報パネル（左下）- 拡張版
```
ノード: 123 | エッジ: 50 / 1234

━━ 選択中 ━━
📄 src/index.ts
優先度: 0.85
接続先: 5件 →
接続元: 3件 ←

[ファイルを開く]
```

---

## 成功基準

### 定量的指標
- [ ] エッジ50本で60fps維持
- [ ] ノード選択→ハイライト < 100ms
- [ ] フィルター切り替え < 200ms
- [ ] 依存深度計算 < 500ms（100ノード）

### 定性的指標
- [ ] プロジェクトの「つながり」が一目でわかる
- [ ] 「このファイルを変更すると何に影響するか」が視覚的にわかる
- [ ] 複雑なプロジェクトでも「衛星」で階層構造を理解できる
- [ ] ノード選択で「関連するコード」に焦点を当てられる

---

## 段階的ロールアウト

### ステップ1: 基本エッジ表示（Phase 7.1 + 7.3）
- まず線を引く（重み固定、上位50本）
- ユーザーフィードバック収集

### ステップ2: 視覚的改善（Phase 7.2）
- 太さ・色を重みに応じて変える
- エッジホバー情報

### ステップ3: 高度なフィルター（Phase 7.4 + 7.5）
- 依存深度フィルター
- ノード選択ハイライト

---

## 今後の拡張（Phase 8以降）

### Phase 8: アニメーション
- [ ] ファイル変更時のパルス効果
- [ ] エッジに沿った「データフロー」アニメーション
- [ ] ノード選択時のズームイン

### Phase 9: 高度な分析
- [ ] クラスター検出（密に接続された領域をハイライト）
- [ ] クリティカルパス表示（最も重要な依存チェーン）
- [ ] 循環依存の検出・警告

### Phase 10: VR対応
- [ ] WebXR基本対応
- [ ] VRコントローラーでノード選択
- [ ] 3D空間での直感的な操作

---

## 参考資料

- [Three.js Line Documentation](https://threejs.org/docs/#api/en/objects/Line)
- [Three.js TubeGeometry](https://threejs.org/docs/#api/en/geometries/TubeGeometry)
- [WebGL Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Graph Visualization Techniques](https://en.wikipedia.org/wiki/Graph_drawing)

---

**計画策定者**: GitHub Copilot  
**レビュー者**: （ユーザー承認待ち）  
**ステータス**: ✅ 計画完了、実装準備完了
