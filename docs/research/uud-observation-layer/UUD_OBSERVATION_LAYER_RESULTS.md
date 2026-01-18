# UUD 観測層（サンプル値による結果サマリ）

## 概要
UUDの観測層は、手法非依存の共通表現を生成する層として定義する。
観測写像は線形固定で以下を採用する。

$$ z = A x + c $$

この観測層を固定した上で、10手法（線形回帰/ロジスティック/リッジ/ラッソ/EN/PCA/LDA/線形SVM）に共通入力する。

## 図
- 観測層の概念図: [uud-observation-layer.mmd](uud-observation-layer.mmd)
- アブレーション（汎化ギャップ）: [uud-ablation-xy.mmd](uud-ablation-xy.mmd)
- 手法順位の安定性: [uud-stability-xy.mmd](uud-stability-xy.mmd)

## サンプル値による結果（実測ではない）
本節の数値はデモ用のサンプル値であり、実測値に置き換える前提である。

### アブレーション（汎化ギャップ $\Delta$）
- 標準化のみ: $\Delta=0.21$
- PCA: $\Delta=0.15$
- PCA+Whitening: $\Delta=0.08$
- Random Projection: $\Delta=0.12$

傾向として、**観測層の等方化（Whitening）で汎化ギャップが最小化**される想定。

### 手法順位の安定性（Rank Variance）
- 観測層なし: $0.88$
- 観測層固定: $0.30$

観測層の固定により、手法間の順位変動が小さくなる想定。

## サンプル値の管理
サンプル値は以下に配置している。
- [metrics.sample.json](metrics.sample.json)

必要に応じて [generate-figures.mjs](generate-figures.mjs) で図を再生成する。

## 公的・権威ある公開データ候補（10件以上）
以下は UCI Machine Learning Repository（UC Irvine）由来の公開データで、
検証対象として優先度が高い。

1. Iris: https://archive.ics.uci.edu/ml/datasets/iris
2. Wine: https://archive.ics.uci.edu/ml/datasets/wine
3. Breast Cancer Wisconsin (Diagnostic): https://archive.ics.uci.edu/ml/datasets/Breast+Cancer+Wisconsin+(Diagnostic)
4. Banknote Authentication: https://archive.ics.uci.edu/ml/datasets/banknote+authentication
5. Spambase: https://archive.ics.uci.edu/ml/datasets/Spambase
6. Ionosphere: https://archive.ics.uci.edu/ml/datasets/Ionosphere
7. Sonar (Mines vs Rocks): https://archive.ics.uci.edu/ml/datasets/Connectionist+Bench+(Sonar,+Mines+vs.+Rocks)
8. Pima Indians Diabetes: https://archive.ics.uci.edu/ml/datasets/diabetes
9. Letter Recognition: https://archive.ics.uci.edu/ml/datasets/letter+recognition
10. Pen-Based Recognition of Handwritten Digits: https://archive.ics.uci.edu/ml/datasets/Pen-Based+Recognition+of+Handwritten+Digits
11. Optical Recognition of Handwritten Digits: https://archive.ics.uci.edu/ml/datasets/Optical+Recognition+of+Handwritten+Digits
12. Seeds: https://archive.ics.uci.edu/ml/datasets/seeds
13. Blood Transfusion Service Center: https://archive.ics.uci.edu/ml/datasets/Blood+Transfusion+Service+Center

## 参考資料（確認済み・10件）
1. CS231n Data Preprocessing（PCA/Whitening/標準化）: https://cs231n.github.io/neural-networks-2/
2. Stanford CS229（機械学習の全体像）: http://cs229.stanford.edu/
3. UC Berkeley CS189/289A（線形回帰・ロジスティック回帰・PCA・正則化）: https://people.eecs.berkeley.edu/~jrs/189/
4. UC Berkeley EE127（最適化の基礎）: https://inst.eecs.berkeley.edu/~ee127/
5. ISL公式（回帰・分類・正則化の体系）: https://www.statlearning.com/
6. Tom Mitchell「Machine Learning」公式ページ: https://www.cs.cmu.edu/~tom/mlbook.html
7. Deep Learning Book: Linear Algebra: https://www.deeplearningbook.org/contents/linear_algebra.html
8. Deep Learning Book: Machine Learning Basics: https://www.deeplearningbook.org/contents/ml.html
9. Kevin Murphy「Machine Learning: a Probabilistic Perspective」: https://www.cs.ubc.ca/~murphyk/MLbook/
10. CMU 10-701/15-781 講義ページ: https://www.cs.cmu.edu/~tom/10701_sp11/lectures.shtml

---

# UDD（統一モデル）経緯・詳細・使い方（ミクロ/マクロ簡易モデル）

## 内容まとめ（導入〜着眼点）
### 導入
UUD（統一観測層）は、線形モデル群に対して**共通の観測写像**を挟み、
評価の一貫性と運用の簡便さを高めるための枠組みとして導入した。
狙いは「**同じ入力空間で比較できる状態**をつくる」ことにある。

### 着眼点
1. **観測層を固定**すれば、手法差の比較がフェアになる
2. **標準化・PCA・Whitening**で入力の幾何を揃え、学習の安定性を上げられる
3. 精度最優先ではなく、**比較・運用の一貫性**を優先する
4. 必要なら **モデル選択やアンサンブル**で“勝てる構成”も拾える

### 要点（短く）
UUDは「全員に同じ観測基準を配る」ための枠組みで、
**比較のしやすさと運用の簡便さ**に価値がある。
ただし、**統計的な優位性は未確定**であり、
精度最優先の用途では追加調整が必要。

## 目的（UDDの位置づけ）
UDDは「**統一観測層 + 線形モデル**」で、
**手法比較・運用の簡便さ**を優先するための簡易モデルである。
精度最優先ではなく、「同じ尺度で観測→比較→改善」することを狙う。

## 統一観測層（基本）
観測写像は線形固定：
$$ z = A x + c $$
現実装では、
**標準化 → PCA →（必要なら）Whitening** を $A$ として使う。

## ミクロ/マクロのUDD把握（簡易モデル）
### ミクロ（個別データセット内の視点）
1. **標準化**で尺度をそろえる
2. **PCA**で次元整理（情報の高密度化）
3. **Whitening**で等方化（必要なら弱める）
4. **線形モデル**で素早く比較・評価

### マクロ（複数データセットの俯瞰）
1. **同じ観測層**を使って一貫比較
2. **勝ち/引き分け/負け**で傾向を見る
3. **モデル選択やアンサンブル**で“勝てる構成”を拾う

## これまでの調整方法（使い方として追加）
### A. 観測層の調整（簡便・低コスト）
- PCA保持率の変更（例: 90/95/99%）
- Whiteningの強さ変更（$\epsilon$ 調整）
- Whiteningを外す（No whitening）

### B. 「いいとこ取り」方式
- 複数線形モデルを評価
- 平均スコアで簡易アンサンブル
- “勝てる構成”を選ぶ（条件を揃えない）

### C. 教師あり観測層（上位オプション）
- LDA射影で分類に有利な方向へ圧縮
- その上で最適線形モデルを選択

## 使い方（最短プロトコル）
1. **統一観測層（標準化＋PCA）**でベースライン計測
2. **観測層調整（PCA/Whitening）**で改善幅を確認
3. **いいとこ取り（アンサンブル/モデル選択）**で勝率を上げる
4. **必要なら教師あり射影**へ拡張

## 解釈ガイド
- **勝ち数**は「可能性の指標」であり、**有意差の証明ではない**
- **統計的有意性**は別途検定が必要
- **運用簡便さを重視**する場合、UDDは有用

## 結論（現状の整理）
- 統一観測層は**運用の統一性・説明性に強い**
- 精度最優先の場面では**最適線形が優勢**
- ただし**勝てる構成は一部で拾える**ため、
	**教育・比較・実験用途の簡易モデル**として価値は高い
