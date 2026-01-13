# Phase 1: パフォーマンス最適化 - 詳細設計

**対象バージョン**: v0.3.21 → v0.3.22
**期間**: 1月14-17日（6-8日）
**目標**: 20,000ノードで60fps、メモリ30%削減

---

## Task 1-1: LOD（Level of Detail）実装

### 1-1-1. 設計

**概要**:
```
三段階の詳細度レベル

┌─────────────────────────────────────────────┐
│ カメラ距離                                     │
├─────────────────────────────────────────────┤
│ < 50m        → HIGH   (32セグメント)          │
│ 50-150m      → MEDIUM (16セグメント)         │
│ > 150m       → LOW    (8セグメント+点)       │
└─────────────────────────────────────────────┘
```

**データ構造**:
```typescript
interface NodeLOD {
  id: string;
  position: THREE.Vector3;
  currentDetail: 'high' | 'medium' | 'low';
  geometries: {
    high: THREE.BufferGeometry;
    medium: THREE.BufferGeometry;
    low: THREE.BufferGeometry;
  };
  materials: {
    high: THREE.Material;
    medium: THREE.Material;
    low: THREE.Material;
  };
  label?: THREE.Sprite;
}
```

**アルゴリズム**:
```typescript
updateNodeLOD(node: NodeLOD, camera: THREE.Camera) {
  const distance = camera.position.distanceTo(node.position);
  let newDetail: 'high' | 'medium' | 'low';
  
  if (distance < 50) {
    newDetail = 'high';
  } else if (distance < 150) {
    newDetail = 'medium';
  } else {
    newDetail = 'low';
  }
  
  // 詳細度変更時のみ更新（最適化）
  if (newDetail !== node.currentDetail) {
    swapGeometry(node, newDetail);
    if (node.label) {
      node.label.visible = newDetail === 'high';
    }
  }
}
```

### 1-1-2. 実装箇所

**ファイル**: `extensions/servant/src/ui/ConstellationViewPanel.ts`

**Module Script内の追加（行番号: 約1050-1100）**:

```typescript
// === LOD Management ===
const lodManager = {
  // ジオメトリキャッシュ
  geometries: {
    high: new THREE.IcosahedronGeometry(0.8, 5),    // 32セグ
    medium: new THREE.IcosahedronGeometry(0.8, 3),  // 16セグ
    low: new THREE.SphereGeometry(0.5, 8, 8)        // 8セグ
  },
  
  nodeDetailMap: new Map<string, 'high' | 'medium' | 'low'>(),
  
  updateNodeLOD(node: THREE.Mesh, camera: THREE.Camera) {
    const distance = camera.position.distanceTo(node.position);
    let newDetail: 'high' | 'medium' | 'low';
    
    if (distance < 50) newDetail = 'high';
    else if (distance < 150) newDetail = 'medium';
    else newDetail = 'low';
    
    const currentDetail = this.nodeDetailMap.get(node.uuid);
    if (newDetail !== currentDetail) {
      node.geometry = this.geometries[newDetail];
      this.nodeDetailMap.set(node.uuid, newDetail);
      
      // ラベル表示制御
      if (node.userData.label) {
        node.userData.label.visible = newDetail === 'high';
      }
    }
  },
  
  updateAllLOD(scene: THREE.Scene, camera: THREE.Camera) {
    // 最適化: LODマップのみ更新（毎フレーム実行）
    scene.children.forEach(child => {
      if (child.userData.isConstellationNode) {
        this.updateNodeLOD(child as THREE.Mesh, camera);
      }
    });
  }
};

// render ループに統合
function animateWithLOD() {
  requestAnimationFrame(animateWithLOD);
  
  lodManager.updateAllLOD(scene, camera);
  renderer.render(scene, camera);
}
```

### 1-1-3. テスト計画

| テスト項目 | 確認内容 | 期待値 |
|----------|---------|--------|
| **詳細度切り替え** | カメラをズームイン/アウト | スムーズ、ポップイン無し |
| **フレームレート** | 10,000ノード + 移動 | 55-60fps |
| **メモリ削減** | 詳細度共有による削減率 | 20-30% |
| **視覚品質** | 各詳細度での見た目 | 違和感なし |

**テストコード例**:
```typescript
describe('LOD System', () => {
  it('should switch detail level when camera moves', () => {
    const node = createTestNode(0, 0, 0);
    camera.position.z = 40;  // HIGH
    expect(lodManager.nodeDetailMap.get(node.uuid)).toBe('high');
    
    camera.position.z = 100; // MEDIUM
    lodManager.updateNodeLOD(node, camera);
    expect(lodManager.nodeDetailMap.get(node.uuid)).toBe('medium');
  });
  
  it('should maintain 60fps with 10k nodes', () => {
    // フレーム時間測定
    const times: number[] = [];
    for (let i = 0; i < 100; i++) {
      const t0 = performance.now();
      lodManager.updateAllLOD(scene, camera);
      times.push(performance.now() - t0);
    }
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    expect(avgTime).toBeLessThan(16.67); // 60fps = 16.67ms
  });
});
```

### 1-1-4. 工程見積もり

| 工程 | 所要時間 |
|-----|---------|
| 設計 + コード | 2日 |
| テスト + デバッグ | 1日 |
| パフォーマンス計測 | 0.5日 |
| **小計** | **3.5日** |

---

## Task 1-2: 仮想スクロール（Frustum Culling）実装

### 1-2-1. 設計

**概要**:
```
カメラの視錐台（Frustum）を計算 → 内部のノードのみ描画

┌────────────────────────────┐
│   視錐台外 → 非描画          │ (GPU/メモリ節約)
│  ┌──────────────────────┐  │
│  │   視錐台内 → 描画      │  │ (フル詳細)
│  │ ┌────────────────┐   │  │
│  │ │    カメラ      │   │  │
│  │ └────────────────┘   │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

**データ構造**:
```typescript
interface FrustumCullingState {
  visibleNodes: Set<string>;     // 描画中のノード
  hiddenNodes: Set<string>;      // 非表示のノード
  meshCache: Map<string, THREE.Mesh>; // 再利用可能メッシュ
}

interface NodePool {
  available: THREE.Mesh[];       // 使用可能なメッシュ
  inUse: THREE.Mesh[];           // 使用中のメッシュ
}
```

### 1-2-2. 実装箇所

**ファイル**: `extensions/servant/src/ui/ConstellationViewPanel.ts`

```typescript
// === Frustum Culling ===
class FrustumCulling {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private frustum: THREE.Frustum;
  private projectionMatrix: THREE.Matrix4;
  
  private visibleNodes: Set<string> = new Set();
  private allNodePositions: Map<string, THREE.Vector3> = new Map();
  
  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.frustum = new THREE.Frustum();
    this.projectionMatrix = new THREE.Matrix4();
  }
  
  // Frustumを更新（毎フレーム）
  updateFrustum() {
    this.projectionMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.projectionMatrix);
  }
  
  // 視錐台内のノードを取得
  getVisibleNodes(allNodes: THREE.Mesh[]): THREE.Mesh[] {
    const visible: THREE.Mesh[] = [];
    
    for (const node of allNodes) {
      if (this.frustum.containsPoint(node.position)) {
        visible.push(node);
        this.visibleNodes.add(node.uuid);
      } else {
        this.visibleNodes.delete(node.uuid);
      }
    }
    
    return visible;
  }
  
  // 非表示ノードの削除
  cullNodes(allNodes: THREE.Mesh[]) {
    for (const node of allNodes) {
      if (!this.visibleNodes.has(node.uuid)) {
        this.scene.remove(node);
      } else {
        if (!node.parent) {
          this.scene.add(node);
        }
      }
    }
  }
}

// Module Script内での使用
let frustumCuller: FrustumCulling | null = null;
let allNodeMeshes: THREE.Mesh[] = [];

function initFrustumCulling() {
  frustumCuller = new FrustumCulling(scene, camera);
}

function animateWithCulling() {
  requestAnimationFrame(animateWithCulling);
  
  if (frustumCuller) {
    frustumCuller.updateFrustum();
    frustumCuller.cullNodes(allNodeMeshes);
  }
  
  renderer.render(scene, camera);
}
```

### 1-2-3. メモリ最適化

**メッシュプーリング**:
```typescript
class MeshPool {
  private pool: THREE.Mesh[] = [];
  private inUse: THREE.Mesh[] = [];
  
  constructor(initialSize: number = 1000) {
    for (let i = 0; i < initialSize; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshStandardMaterial()
      );
      this.pool.push(mesh);
    }
  }
  
  acquire(data: NodeData): THREE.Mesh {
    let mesh = this.pool.pop();
    if (!mesh) {
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshStandardMaterial()
      );
    }
    mesh.position.copy(data.position);
    mesh.userData = data;
    this.inUse.push(mesh);
    return mesh;
  }
  
  release(mesh: THREE.Mesh) {
    this.inUse = this.inUse.filter(m => m !== mesh);
    this.pool.push(mesh);
  }
}
```

### 1-2-4. テスト計画

| テスト項目 | 確認内容 | 期待値 |
|----------|---------|--------|
| **カメラ移動** | 視錐台内のノードのみ表示 | 正確性100% |
| **メモリ削減** | シーンのメモリ使用量 | 50%削減 |
| **GPU負荷** | Draw calls削減 | 60%削減 |
| **フレームレート** | 大規模データで維持 | 55-60fps |

### 1-2-5. 工程見積もり

| 工程 | 所要時間 |
|-----|---------|
| 設計 + コード | 2日 |
| テスト + デバッグ | 1日 |
| 統合テスト（LOD併用） | 1日 |
| **小計** | **4日** |

---

## Phase 1 統合テスト計画

### テスト環境

```
ノード数: 500 → 1,000 → 5,000 → 10,000 → 20,000
各レベルで以下を測定:
- フレームレート（min/avg/max）
- メモリ使用量
- GPU メモリ
- LOD切り替え回数
- Draw calls数
```

### 性能ベンチマーク

```bash
# テスト実行コマンド
npm run test:performance -- --nodes 20000 --duration 60s

# 期待出力
[BENCHMARK] 20,000 nodes
  FPS: min=58, avg=59.2, max=60
  Memory: 180MB (initial: 200MB)
  GPU: 140MB
  LOD switches: 245 (natural)
  Draw calls: 2,847 (vs 20,000 without culling)
```

### 合格基準

- ✅ 20,000ノード で 55fps 以上
- ✅ メモリ 200MB 以下
- ✅ LOD切り替えで視覚的違和感なし
- ✅ パン/ズーム時のラグ < 50ms

---

## Phase 1 完成時のチェックリスト

- [ ] LOD実装 + テスト完了
- [ ] Frustum Culling実装 + テスト完了
- [ ] 20,000ノードで60fps達成
- [ ] メモリ30%削減確認
- [ ] リグレッションテスト合格
- [ ] ドキュメント更新
- [ ] v0.3.22 リリース準備

---

**期待効果**:

| 項目 | v0.3.21 | v0.3.22（Phase 1後） |
|------|---------|-------------------|
| **対応ノード数** | < 5,000 | 20,000 |
| **フレームレート** | 30fps@5K | 60fps@20K |
| **メモリ（ピーク）** | 200MB | 140MB |
| **快適度** | 🟡 中程度 | 🟢 優秀 |

