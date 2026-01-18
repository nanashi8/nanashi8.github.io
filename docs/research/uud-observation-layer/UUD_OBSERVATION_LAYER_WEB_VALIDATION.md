# UUD 観測層: 公開データによる検証

本レポートは公的な公開データセット（UCI 由来など）を使用し、
線形モデル（ロジスティック回帰）で観測層の効果を検証した。
利用可能だったデータセット数: 13

## データセット一覧（出所つき）
| dataset | source | source_url | status | error |
|:--|:--|:--|:--|:--|
| iris | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/iris | loaded |  |
| wine | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/wine | loaded |  |
| breast_cancer_wdbc | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/Breast+Cancer+Wisconsin+(Diagnostic) | loaded |  |
| banknote_authentication | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/banknote+authentication | loaded |  |
| spambase | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/Spambase | loaded |  |
| ionosphere | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/Ionosphere | loaded |  |
| sonar | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/Connectionist+Bench+(Sonar,+Mines+vs.+Rocks) | loaded |  |
| pima_indians_diabetes | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/diabetes | loaded |  |
| letter_recognition | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/letter+recognition | loaded |  |
| pendigits | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/Pen-Based+Recognition+of+Handwritten+Digits | loaded |  |
| optdigits | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/Optical+Recognition+of+Handwritten+Digits | loaded |  |
| seeds | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/seeds | loaded |  |
| blood_transfusion_service_center | UCI Machine Learning Repository | https://archive.ics.uci.edu/ml/datasets/Blood+Transfusion+Service+Center | loaded |  |

## 実験設定
- 5-fold Stratified CV
- ベースライン: 標準化のみ
- 観測層: 標準化 + PCA(95%) + Whitening
- 指標: 汎化ギャップ (train acc − test acc)
- 検定: ペアt検定
- 追加比較: 標準化のみで線形モデルを複数評価し、平均テスト精度が最大のモデルを『最適線形』として比較
- いいとこ取り: 複数線形モデルの平均スコアで簡易アンサンブル
- 観測層の改善探索: PCA保持率とWhitening強度を複数候補から選択
- 教師あり観測層: LDAで射影し、固定ロジスティック or モデル選択で比較

## 結果サマリ
| dataset                          |   gap_base_mean |   gap_base_std |   gap_obs_mean |   gap_obs_std |    gap_delta |     t_stat |   p_value | best_linear_model   |   best_linear_test_mean |   best_linear_test_std |   obs_test_mean |   obs_test_std |   obs_vs_best_linear |   ensemble_test_mean |   ensemble_test_std |   ensemble_vs_best_linear | best_obs_config   |   best_obs_test_mean |   best_obs_test_std |   best_obs_vs_best_linear | best_obs_model_selected_cfg   | best_obs_model_selected_model   |   best_obs_model_selected_mean |   best_obs_model_selected_std |   best_obs_model_selected_vs_best_linear | best_linear_on_obs_model   |   best_linear_on_obs_test_mean |   best_linear_on_obs_test_std |   obs_vs_best_linear_same_obs |   lda_obs_test_mean |   lda_obs_test_std |   lda_obs_vs_best_linear | best_lda_model   |   best_lda_test_mean |   best_lda_test_std |   best_lda_vs_best_linear | overall_best_method   |   overall_best_test_mean |   overall_best_vs_best_linear |
|:---------------------------------|----------------:|---------------:|---------------:|--------------:|-------------:|-----------:|----------:|:--------------------|------------------------:|-----------------------:|----------------:|---------------:|---------------------:|---------------------:|--------------------:|--------------------------:|:------------------|---------------------:|--------------------:|--------------------------:|:------------------------------|:--------------------------------|-------------------------------:|------------------------------:|-----------------------------------------:|:---------------------------|-------------------------------:|------------------------------:|------------------------------:|--------------------:|-------------------:|-------------------------:|:-----------------|---------------------:|--------------------:|--------------------------:|:----------------------|-------------------------:|------------------------------:|
| iris                             |     0.0166667   |     0.0745356  |    0           |    0.104748   | -0.0166667   | 0.349215   |  0.744537 | lda                 |                0.973333 |            0.0434613   |        0.846667 |     0.083666   |         -0.126667    |             0.933333 |          0.0471405  |              -0.04        | pca99_eps1e-5     |             0.873333 |          0.0722649  |              -0.1         | pca99_eps1e-5                 | lda                             |                       0.966667 |                    0.0471405  |                             -0.00666667  | lda                        |                       0.926667 |                    0.0494413  |                  -0.08        |            0.913333 |         0.060553   |              -0.06       | lda              |             0.973333 |         0.0434613   |               0           | best_linear           |                 0.973333 |                    0          |
| wine                             |     0.0152681   |     0.0173071  |    0.0152681   |    0.0173071  |  0           | 0          |  1        | ridge_alpha10       |                0.988889 |            0.0152145   |        0.983333 |     0.0152145  |         -0.00555556  |             0.977619 |          0.0125161  |              -0.0112698   | pca95_eps1e-5     |             0.983333 |          0.0152145  |              -0.00555556  | pca95_eps1e-5                 | logreg_C0.1                     |                       0.983333 |                    0.0152145  |                             -0.00555556  | logreg_C0.1                |                       0.983333 |                    0.0152145  |                   0           |            0.983175 |         0.0153628  |              -0.00571429 | linear_svm_C1    |             0.983333 |         0.0248452   |              -0.00555556  | best_linear           |                 0.988889 |                    0          |
| breast_cancer_wdbc               |     0.0127136   |     0.0161971  |    0.00877503  |    0.0111583  | -0.00393859  | 0.880819   |  0.428159 | logreg_C0.1         |                0.978932 |            0.0132854   |        0.975408 |     0.00958103 |         -0.0035243   |             0.973669 |          0.0163901  |              -0.00526316  | pca95_no_whiten   |             0.977177 |          0.00781114 |              -0.00175439  | pca95_no_whiten               | linear_svm_C0.1                 |                       0.978932 |                    0.00781549 |                              0           | linear_svm_C0.1            |                       0.978916 |                    0.0132932  |                  -0.00350877  |            0.968406 |         0.0236818  |              -0.0105263  | logreg_C1        |             0.968406 |         0.0236818   |              -0.0105263   | best_linear           |                 0.978932 |                    0          |
| banknote_authentication          |     0.000362862 |     0.00908269 |    0.000345307 |    0.019409   | -1.75551e-05 | 0.00205489 |  0.998459 | logreg_C10          |                0.990527 |            0.00608642  |        0.916202 |     0.0146421  |         -0.0743251   |             0.983236 |          0.00840273 |              -0.00729131  | pca99_eps1e-5     |             0.981778 |          0.00682794 |              -0.00874851  | pca99_eps1e-5                 | linear_svm_C1                   |                       0.990527 |                    0.00608642 |                              0           | logreg_C10                 |                       0.916932 |                    0.0149484  |                  -0.000729927 |            0.98469  |         0.00871954 |              -0.00583676 | logreg_C10       |             0.988337 |         0.00599539  |              -0.00218978  | best_linear           |                 0.990527 |                    0          |
| spambase                         |     0.00564894  |     0.00957296 |    0.00537838  |    0.0059056  | -0.000270559 | 0.12934    |  0.903332 | logreg_C10          |                0.926758 |            0.00727563  |        0.923279 |     0.00469059 |         -0.00347921  |             0.918063 |          0.00543034 |              -0.00869471  | pca99_eps1e-5     |             0.925453 |          0.00669606 |              -0.00130482  | pca99_eps1e-5                 | logreg_C10                      |                       0.928713 |                    0.00651436 |                              0.00195558  | logreg_C10                 |                       0.924366 |                    0.00435289 |                  -0.00108719  |            0.906759 |         0.0069377  |              -0.0199986  | logreg_C1        |             0.906759 |         0.0069377   |              -0.0199986   | obs_best_config_model |                 0.928713 |                    0.00195558 |
| ionosphere                       |     0.047844    |     0.0597808  |    0.0449594   |    0.0455703  | -0.00288467  | 0.213329   |  0.841502 | linear_svm_C1       |                0.894406 |            0.059579    |        0.883099 |     0.0372372  |         -0.0113078   |             0.885875 |          0.0582278  |              -0.00853119  | pca95_no_whiten   |             0.883139 |          0.0327673  |              -0.0112676   | pca99_eps1e-5                 | linear_svm_C1                   |                       0.888853 |                    0.0539111  |                             -0.00555332  | linear_svm_C1              |                       0.886036 |                    0.0303131  |                  -0.00293763  |            0.857384 |         0.0444248  |              -0.0370221  | logreg_C0.1      |             0.865956 |         0.0376479   |              -0.0284507   | best_linear           |                 0.894406 |                    0          |
| sonar                            |     0.14908     |     0.0244522  |    0.114838    |    0.0730967  | -0.0342418   | 1.12526    |  0.323428 | logreg_C0.1         |                0.803252 |            0.056305    |        0.769803 |     0.068862   |         -0.0334495   |             0.802904 |          0.0430627  |              -0.000348432 | pca90_eps1e-5     |             0.803717 |          0.0905132  |               0.000464576 | pca95_no_whiten               | logreg_C0.1                     |                       0.80813  |                    0.0574026  |                              0.00487805  | linear_svm_C1              |                       0.784321 |                    0.0737407  |                  -0.014518    |            0.730894 |         0.0383618  |              -0.0723577  | linear_svm_C0.1  |             0.735656 |         0.0332241   |              -0.0675958   | obs_best_config_model |                 0.80813  |                    0.00487805 |
| pima_indians_diabetes            |     0.00591312  |     0.0206807  |    0.00393802  |    0.0163954  | -0.0019751   | 0.481474   |  0.655335 | linear_svm_C0.1     |                0.773398 |            0.0148872   |        0.773406 |     0.0146993  |          8.48824e-06 |             0.774705 |          0.014185   |               0.00130719  | pca95_eps1e-5     |             0.773406 |          0.0146993  |               8.48824e-06 | pca95_eps1e-5                 | logreg_C0.1                     |                       0.773406 |                    0.0146993  |                              8.48824e-06 | logreg_C0.1                |                       0.773406 |                    0.0146993  |                   0           |            0.769493 |         0.0176015  |              -0.00390459 | logreg_C0.1      |             0.772091 |         0.0185327   |              -0.00130719  | ensemble              |                 0.774705 |                    0.00130719 |
| letter_recognition               |     0.005325    |     0.00638608 |    0.0022125   |    0.00553515 | -0.0031125   | 1.16036    |  0.31044  | logreg_C10          |                0.72305  |            0.00395838  |        0.66415  |     0.00281514 |         -0.0589      |             0.7274   |          0.00488493 |               0.00435     | pca99_eps1e-5     |             0.71075  |          0.00520517 |              -0.0123      | pca99_eps1e-5                 | logreg_C10                      |                       0.71275  |                    0.00473682 |                             -0.0103      | lda                        |                       0.6655   |                    0.00542851 |                  -0.00135     |            0.72135  |         0.00395127 |              -0.0017     | logreg_C10       |             0.72305  |         0.00375999  |              -1.11022e-16 | ensemble              |                 0.7274   |                    0.00435    |
| pendigits                        |     0.00247891  |     0.00309281 |    0.000750517 |    0.00182518 | -0.0017284   | 0.964426   |  0.389446 | logreg_C10          |                0.934316 |            0.00118874  |        0.885553 |     0.0013461  |         -0.0487627   |             0.922216 |          0.00211835 |              -0.0120993   | pca99_eps1e-5     |             0.914848 |          0.00405165 |              -0.0194683   | pca99_eps1e-5                 | logreg_C10                      |                       0.919214 |                    0.00315331 |                             -0.0151016   | logreg_C10                 |                       0.889829 |                    0.00180021 |                  -0.00427583  |            0.907751 |         0.00446663 |              -0.0265645  | logreg_C10       |             0.910936 |         0.00453283  |              -0.0233802   | best_linear           |                 0.934316 |                    0          |
| optdigits                        |     0.0104537   |     0.00213917 |    0.0088968   |    0.00400047 | -0.00155694  | 0.870254   |  0.433271 | logreg_C10          |                0.966548 |            0.00292379  |        0.957473 |     0.00341108 |         -0.00907473  |             0.967438 |          0.00194919 |               0.00088968  | pca99_eps1e-5     |             0.964413 |          0.00281341 |              -0.00213523  | pca99_eps1e-5                 | linear_svm_C1                   |                       0.965302 |                    0.00431288 |                             -0.00124555  | linear_svm_C10             |                       0.959609 |                    0.00481579 |                  -0.00213523  |            0.953737 |         0.00350267 |              -0.0128114  | linear_svm_C10   |             0.954982 |         0.00359193  |              -0.0115658   | ensemble              |                 0.967438 |                    0.00088968 |
| seeds                            |     0.0130952   |     0.0524688  |    0.00119048  |    0.0735547  | -0.0119048   | 0.685994   |  0.530412 | ridge_alpha0.1      |                0.97619  |            1.24127e-16 |        0.904762 |     0.0583212  |         -0.0714286   |             0.952381 |          0.0238095  |              -0.0238095   | pca99_eps1e-5     |             0.957143 |          0.0353152  |              -0.0190476   | pca99_eps1e-5                 | lda                             |                       0.961905 |                    0.0212959  |                             -0.0142857   | lda                        |                       0.919048 |                    0.0643298  |                  -0.0142857   |            0.971429 |         0.0106479  |              -0.0047619  | logreg_C10       |             0.97619  |         1.24127e-16 |               0           | best_linear           |                 0.97619  |                    0          |
| blood_transfusion_service_center |    -0.00131705  |     0.0264897  |   -0.00131761  |    0.0267544  | -5.58344e-07 | 0.00105673 |  0.999207 | ridge_alpha0.1      |                0.772725 |            0.0170961   |        0.772707 |     0.0214083  |         -1.78971e-05 |             0.768698 |          0.0195664  |              -0.00402685  | pca95_eps1e-5     |             0.772707 |          0.0214083  |              -1.78971e-05 | pca90_eps1e-5                 | linear_svm_C0.1                 |                       0.774058 |                    0.0120889  |                              0.00133333  | ridge_alpha0.1             |                       0.772725 |                    0.0170961  |                  -1.78971e-05 |            0.774049 |         0.0193451  |               0.00132438 | linear_svm_C0.1  |             0.774058 |         0.0180393   |               0.00133333  | obs_best_config_model |                 0.774058 |                    0.00133333 |

## 最適線形モデルとの差分（テスト精度）
| dataset | best_linear_model | best_linear_test_mean | obs_test_mean | obs_vs_best_linear |
|:--|:--|--:|--:|--:|
| iris | lda | 0.973333 | 0.846667 | -0.126667 |
| wine | ridge_alpha10 | 0.988889 | 0.983333 | -0.005556 |
| breast_cancer_wdbc | logreg_C0.1 | 0.978932 | 0.975408 | -0.003524 |
| banknote_authentication | logreg_C10 | 0.990527 | 0.916202 | -0.074325 |
| spambase | logreg_C10 | 0.926758 | 0.923279 | -0.003479 |
| ionosphere | linear_svm_C1 | 0.894406 | 0.883099 | -0.011308 |
| sonar | logreg_C0.1 | 0.803252 | 0.769803 | -0.033449 |
| pima_indians_diabetes | linear_svm_C0.1 | 0.773398 | 0.773406 | 0.000008 |
| letter_recognition | logreg_C10 | 0.723050 | 0.664150 | -0.058900 |
| pendigits | logreg_C10 | 0.934316 | 0.885553 | -0.048763 |
| optdigits | logreg_C10 | 0.966548 | 0.957473 | -0.009075 |
| seeds | ridge_alpha0.1 | 0.976190 | 0.904762 | -0.071429 |
| blood_transfusion_service_center | ridge_alpha0.1 | 0.772725 | 0.772707 | -0.000018 |

## 改善後の観測層（最良設定）の結果
| dataset | best_obs_config | best_obs_test_mean | best_linear_test_mean | best_obs_vs_best_linear |
|:--|:--|--:|--:|--:|
| iris | pca99_eps1e-5 | 0.873333 | 0.973333 | -0.100000 |
| wine | pca95_eps1e-5 | 0.983333 | 0.988889 | -0.005556 |
| breast_cancer_wdbc | pca95_no_whiten | 0.977177 | 0.978932 | -0.001754 |
| banknote_authentication | pca99_eps1e-5 | 0.981778 | 0.990527 | -0.008749 |
| spambase | pca99_eps1e-5 | 0.925453 | 0.926758 | -0.001305 |
| ionosphere | pca95_no_whiten | 0.883139 | 0.894406 | -0.011268 |
| sonar | pca90_eps1e-5 | 0.803717 | 0.803252 | 0.000465 |
| pima_indians_diabetes | pca95_eps1e-5 | 0.773406 | 0.773398 | 0.000008 |
| letter_recognition | pca99_eps1e-5 | 0.710750 | 0.723050 | -0.012300 |
| pendigits | pca99_eps1e-5 | 0.914848 | 0.934316 | -0.019468 |
| optdigits | pca99_eps1e-5 | 0.964413 | 0.966548 | -0.002135 |
| seeds | pca99_eps1e-5 | 0.957143 | 0.976190 | -0.019048 |
| blood_transfusion_service_center | pca95_eps1e-5 | 0.772707 | 0.772725 | -0.000018 |

## フェア比較（同じ観測層での最適線形 vs 統一モデル）
観測層: pca95_eps1e-5 で固定
| dataset | best_linear_on_obs_model | best_linear_on_obs_test_mean | obs_test_mean | obs_vs_best_linear_same_obs |
|:--|:--|--:|--:|--:|
| iris | lda | 0.926667 | 0.846667 | -0.080000 |
| wine | logreg_C0.1 | 0.983333 | 0.983333 | 0.000000 |
| breast_cancer_wdbc | linear_svm_C0.1 | 0.978916 | 0.975408 | -0.003509 |
| banknote_authentication | logreg_C10 | 0.916932 | 0.916202 | -0.000730 |
| spambase | logreg_C10 | 0.924366 | 0.923279 | -0.001087 |
| ionosphere | linear_svm_C1 | 0.886036 | 0.883099 | -0.002938 |
| sonar | linear_svm_C1 | 0.784321 | 0.769803 | -0.014518 |
| pima_indians_diabetes | logreg_C0.1 | 0.773406 | 0.773406 | 0.000000 |
| letter_recognition | lda | 0.665500 | 0.664150 | -0.001350 |
| pendigits | logreg_C10 | 0.889829 | 0.885553 | -0.004276 |
| optdigits | linear_svm_C10 | 0.959609 | 0.957473 | -0.002135 |
| seeds | lda | 0.919048 | 0.904762 | -0.014286 |
| blood_transfusion_service_center | ridge_alpha0.1 | 0.772725 | 0.772707 | -0.000018 |

## 教師あり観測層（LDA射影）の結果
| dataset | lda_obs_test_mean | best_linear_test_mean | lda_obs_vs_best_linear |
|:--|--:|--:|--:|
| iris | 0.913333 | 0.973333 | -0.060000 |
| wine | 0.983175 | 0.988889 | -0.005714 |
| breast_cancer_wdbc | 0.968406 | 0.978932 | -0.010526 |
| banknote_authentication | 0.984690 | 0.990527 | -0.005837 |
| spambase | 0.906759 | 0.926758 | -0.019999 |
| ionosphere | 0.857384 | 0.894406 | -0.037022 |
| sonar | 0.730894 | 0.803252 | -0.072358 |
| pima_indians_diabetes | 0.769493 | 0.773398 | -0.003905 |
| letter_recognition | 0.721350 | 0.723050 | -0.001700 |
| pendigits | 0.907751 | 0.934316 | -0.026564 |
| optdigits | 0.953737 | 0.966548 | -0.012811 |
| seeds | 0.971429 | 0.976190 | -0.004762 |
| blood_transfusion_service_center | 0.774049 | 0.772725 | 0.001324 |

## 教師あり観測層（LDA射影）＋モデル選択
| dataset | best_lda_model | best_lda_test_mean | best_linear_test_mean | best_lda_vs_best_linear |
|:--|:--|--:|--:|--:|
| iris | lda | 0.973333 | 0.973333 | 0.000000 |
| wine | linear_svm_C1 | 0.983333 | 0.988889 | -0.005556 |
| breast_cancer_wdbc | logreg_C1 | 0.968406 | 0.978932 | -0.010526 |
| banknote_authentication | logreg_C10 | 0.988337 | 0.990527 | -0.002190 |
| spambase | logreg_C1 | 0.906759 | 0.926758 | -0.019999 |
| ionosphere | logreg_C0.1 | 0.865956 | 0.894406 | -0.028451 |
| sonar | linear_svm_C0.1 | 0.735656 | 0.803252 | -0.067596 |
| pima_indians_diabetes | logreg_C0.1 | 0.772091 | 0.773398 | -0.001307 |
| letter_recognition | logreg_C10 | 0.723050 | 0.723050 | -0.000000 |
| pendigits | logreg_C10 | 0.910936 | 0.934316 | -0.023380 |
| optdigits | linear_svm_C10 | 0.954982 | 0.966548 | -0.011566 |
| seeds | logreg_C10 | 0.976190 | 0.976190 | 0.000000 |
| blood_transfusion_service_center | linear_svm_C0.1 | 0.774058 | 0.772725 | 0.001333 |

## 勝てる構成（条件を揃えず最良を選択）
| dataset | overall_best_method | overall_best_test_mean | best_linear_test_mean | overall_best_vs_best_linear |
|:--|:--|--:|--:|--:|
| iris | best_linear | 0.973333 | 0.973333 | 0.000000 |
| wine | best_linear | 0.988889 | 0.988889 | 0.000000 |
| breast_cancer_wdbc | best_linear | 0.978932 | 0.978932 | 0.000000 |
| banknote_authentication | best_linear | 0.990527 | 0.990527 | 0.000000 |
| spambase | obs_best_config_model | 0.928713 | 0.926758 | 0.001956 |
| ionosphere | best_linear | 0.894406 | 0.894406 | 0.000000 |
| sonar | obs_best_config_model | 0.808130 | 0.803252 | 0.004878 |
| pima_indians_diabetes | ensemble | 0.774705 | 0.773398 | 0.001307 |
| letter_recognition | ensemble | 0.727400 | 0.723050 | 0.004350 |
| pendigits | best_linear | 0.934316 | 0.934316 | 0.000000 |
| optdigits | ensemble | 0.967438 | 0.966548 | 0.000890 |
| seeds | best_linear | 0.976190 | 0.976190 | 0.000000 |
| blood_transfusion_service_center | obs_best_config_model | 0.774058 | 0.772725 | 0.001333 |

## いいとこ取り（簡易アンサンブル）の結果
| dataset | ensemble_test_mean | best_linear_test_mean | ensemble_vs_best_linear |
|:--|--:|--:|--:|
| iris | 0.933333 | 0.973333 | -0.040000 |
| wine | 0.977619 | 0.988889 | -0.011270 |
| breast_cancer_wdbc | 0.973669 | 0.978932 | -0.005263 |
| banknote_authentication | 0.983236 | 0.990527 | -0.007291 |
| spambase | 0.918063 | 0.926758 | -0.008695 |
| ionosphere | 0.885875 | 0.894406 | -0.008531 |
| sonar | 0.802904 | 0.803252 | -0.000348 |
| pima_indians_diabetes | 0.774705 | 0.773398 | 0.001307 |
| letter_recognition | 0.727400 | 0.723050 | 0.004350 |
| pendigits | 0.922216 | 0.934316 | -0.012099 |
| optdigits | 0.967438 | 0.966548 | 0.000890 |
| seeds | 0.952381 | 0.976190 | -0.023810 |
| blood_transfusion_service_center | 0.768698 | 0.772725 | -0.004027 |

## 解釈
p値が十分に小さい場合、観測層により汎化ギャップが有意に変化したと解釈できる。
ただし小標本のため、結論には追加検証が必要。
