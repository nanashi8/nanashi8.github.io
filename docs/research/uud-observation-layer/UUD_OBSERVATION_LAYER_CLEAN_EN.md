# UUD Observation Layer (Clean Draft, Minimal Links)

> Note: Values shown are samples and should be replaced with measured results.

## Abstract
We propose a universal observation layer that produces a method-agnostic representation for linear learning. By enforcing distance preservation, bounded information loss, and isotropy, the observation layer unifies major linear methods under a shared input space, improving evaluation consistency and generalization stability.

## Method
The observation layer is fixed from training data only.

$$ z = A x + c $$

1. Standardize
$$ x'=(x-\mu)\oslash\sigma $$

2. Decompose
$$ C=\frac{1}{n}X'^\top X'=U\Lambda U^\top $$

3. Dimension selection
$$ \frac{\sum_{i=1}^k\lambda_i}{\sum_{i=1}^d\lambda_i}\ge\tau $$

4. Fix mapping
$$ A=\Lambda_k^{-1/2}U_k^\top D_\sigma^{-1},\quad c=-A\mu $$

## Figure 1: Observation layer concept and guarantees

```mermaid
%% UUD Observation Layer Concept
flowchart LR
  X["Input data x"] --> Z["Observation layer z = A x + c"]
  Z --> M1["Linear Regression"]
  Z --> M2["Logistic Regression"]
  Z --> M3["Ridge / Lasso / Elastic Net"]
  Z --> M4["LDA"]
  Z --> M5["Linear SVM"]
  M1 --> Y["Output y"]
  M2 --> Y
  M3 --> Y
  M4 --> Y
  M5 --> Y

  subgraph Obs["UUD Observation Layer"]
    Z
  end

  subgraph Guarantees["Guarantees"]
    G1["Distance preservation"]
    G2["Information loss bound"]
    G3["Isotropy (whitening)"]
  end

  Z -.-> G1
  Z -.-> G2
  Z -.-> G3
```

## Figure 2: Ablation on generalization gap

```mermaid
xychart-beta
    title "Ablation: Generalization Gap (Lower is Better)"
    x-axis [Standardize, PCA, PCA+Whitening, RandomProj]
    y-axis "Gap Δ" 0 --> 0.25
    bar [0.21, 0.15, 0.08, 0.12]
```

## Figure 3: Method rank stability

```mermaid
xychart-beta
    title "Method Rank Variance (Lower is Better)"
    x-axis [NoObs, ObsFixed]
    y-axis "Rank Variance" 0 --> 1.0
    bar [0.88, 0.30]
```

## Results (Sample Values)
### Ablation (Generalization Gap $\Delta$)
- Standardize: $\Delta=0.21$
- PCA: $\Delta=0.15$
- PCA+Whitening: $\Delta=0.08$
- Random Projection: $\Delta=0.12$

### Method Rank Variance
- No observation layer: $0.88$
- Observation fixed: $0.30$

## Discussion
Fixing the observation layer reduces generalization gap and stabilizes model ranking. In the sample setting, whitening yields the most consistent improvements.

## Limitations
- Linear observation fails on intrinsically nonlinear separability.
- If information is not concentrated in a low-rank linear subspace, performance degrades.

## Next Steps
- Nonlinear $f(x)$ via self-supervised embeddings.
- Joint optimization of observation and inference layers.
