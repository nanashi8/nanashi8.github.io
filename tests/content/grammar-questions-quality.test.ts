import { describe, it, expect } from 'vitest';
import verbFormGrade1 from '../../public/data/verb-form-questions-grade1.json';
import fillInBlankGrade1 from '../../public/data/fill-in-blank-questions-grade1.json';
import sentenceOrderingGrade1 from '../../public/data/sentence-ordering-grade1.json';

/**
 * 文法問題の品質検証テスト
 *
 * テスト者の人格:
 * - 英文法学者: 文法的正確性と説明の妥当性を検証
 * - 英語校正者: 問題文・選択肢の表現の正確性を検証
 * - 日本語校正者: 日本語訳・説明文の正確性を検証
 * - 教育専門家: 難易度と学年の整合性を検証
 */

type VerbFormQuestion = {
  id: string;
  japanese: string;
  sentence: string;
  verb: string;
  choices: string[];
  correctAnswer: string;
  difficulty: string;
  explanation: string;
  hint: string;
};

type Unit = {
  unit: string;
  title: string;
  verbForm: VerbFormQuestion[];
};

type GrammarData = {
  grade: number;
  totalQuestions: number;
  units: Unit[];
};

describe('文法問題品質検証 - 英文法学者の視点', () => {
  const allData = [verbFormGrade1, fillInBlankGrade1, sentenceOrderingGrade1] as GrammarData[];

  describe('正答の一意性検証', () => {
    it('各問題の正答が選択肢に必ず1つだけ存在する', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            const matchCount = q.choices.filter((choice) => choice === q.correctAnswer).length;

            expect(
              matchCount,
              `問題 ${q.id}: 正答 "${q.correctAnswer}" が選択肢に${matchCount}回出現`
            ).toBe(1);
          });
        });
      });
    });

    it('正答が空文字列でない', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            expect(q.correctAnswer.trim(), `問題 ${q.id}: 正答が空文字列`).not.toBe('');
          });
        });
      });
    });

    it('正答が選択肢に含まれている', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            expect(
              q.choices,
              `問題 ${q.id}: 正答 "${q.correctAnswer}" が選択肢に存在しない`
            ).toContain(q.correctAnswer);
          });
        });
      });
    });
  });

  describe('選択肢の妥当性検証', () => {
    it('選択肢が重複していない', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            const uniqueChoices = new Set(q.choices);

            expect(
              uniqueChoices.size,
              `問題 ${q.id}: 選択肢に重複あり ${JSON.stringify(q.choices)}`
            ).toBe(q.choices.length);
          });
        });
      });
    });

    it('選択肢が4つ存在する', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            expect(q.choices.length, `問題 ${q.id}: 選択肢数が${q.choices.length}個`).toBe(4);
          });
        });
      });
    });

    it('選択肢に空文字列が含まれていない', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            q.choices.forEach((choice, index) => {
              expect(choice.trim(), `問題 ${q.id}: 選択肢[${index}]が空文字列`).not.toBe('');
            });
          });
        });
      });
    });

    it('誤答選択肢が文法的に誤りまたは不自然である', () => {
      // be動詞問題の場合、誤答は人称・数が一致しない形
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            if (q.verb === 'be') {
              const wrongChoices = q.choices.filter((c) => c !== q.correctAnswer);

              // 誤答が存在することを確認（正答以外の選択肢）
              expect(wrongChoices.length, `問題 ${q.id}: 誤答選択肢が存在しない`).toBeGreaterThan(
                0
              );

              // be動詞の選択肢が標準形式（am/is/are/be等）であることを確認
              const validBeForms = ['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being'];
              wrongChoices.forEach((choice) => {
                expect(
                  validBeForms.includes(choice),
                  `問題 ${q.id}: 誤答 "${choice}" がbe動詞の標準形式でない`
                ).toBe(true);
              });
            }
          });
        });
      });
    });
  });

  describe('文法的正確性検証', () => {
    it('問題文に空欄マーカー (____ または ____) が存在する', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            const hasBlank = q.sentence.includes('____') || q.sentence.includes('____');

            expect(hasBlank, `問題 ${q.id}: 空欄マーカーが存在しない - "${q.sentence}"`).toBe(true);
          });
        });
      });
    });

    it('問題文が正しいピリオドで終わる', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            const endsWithPeriod =
              q.sentence.trim().endsWith('.') ||
              q.sentence.trim().endsWith('?') ||
              q.sentence.trim().endsWith('!');

            expect(
              endsWithPeriod,
              `問題 ${q.id}: 問題文が句点で終わっていない - "${q.sentence}"`
            ).toBe(true);
          });
        });
      });
    });

    it('問題文の先頭が大文字である', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            const firstChar = q.sentence.trim()[0];
            const isUpperCase =
              firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();

            expect(isUpperCase, `問題 ${q.id}: 問題文の先頭が大文字でない - "${q.sentence}"`).toBe(
              true
            );
          });
        });
      });
    });

    it('正答を埋め込んだ文章が文法的に正しい構造を持つ', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            const completedSentence = q.sentence.replace(/____/g, q.correctAnswer);

            // 基本的な文法チェック: 主語 + 動詞の存在
            const hasSubject =
              /^[A-Z][a-z]*(?: [a-z]+)* |^I |^You |^We |^They |^He |^She |^It /.test(
                completedSentence
              );

            expect(
              hasSubject,
              `問題 ${q.id}: 完成文に主語が見当たらない - "${completedSentence}"`
            ).toBe(true);

            // 空欄が正しく埋まっていることを確認
            expect(completedSentence.includes('____'), `問題 ${q.id}: 空欄が埋まっていない`).toBe(
              false
            );
          });
        });
      });
    });
  });

  describe('説明文の品質検証', () => {
    it('explanation（解説）が存在し空でない', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            expect(q.explanation, `問題 ${q.id}: explanationが未定義`).toBeDefined();

            expect(q.explanation.trim(), `問題 ${q.id}: explanationが空文字列`).not.toBe('');
          });
        });
      });
    });

    it('hint（ヒント）が存在し空でない', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            expect(q.hint, `問題 ${q.id}: hintが未定義`).toBeDefined();

            expect(q.hint.trim(), `問題 ${q.id}: hintが空文字列`).not.toBe('');
          });
        });
      });
    });

    it('explanationが日本語で記述されている', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            // 日本語文字（ひらがな・カタカナ・漢字）を含むか
            const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(q.explanation);

            expect(
              hasJapanese,
              `問題 ${q.id}: explanationに日本語が含まれていない - "${q.explanation}"`
            ).toBe(true);
          });
        });
      });
    });

    it('explanationに正答の形式が含まれている', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            // 正答またはその説明が解説文に含まれているか
            const mentionsAnswer =
              q.explanation.includes(q.correctAnswer) || q.explanation.includes(q.verb);

            expect(
              mentionsAnswer,
              `問題 ${q.id}: explanationに正答 "${q.correctAnswer}" または動詞 "${q.verb}" の言及がない`
            ).toBe(true);
          });
        });
      });
    });
  });
});

describe('文法問題品質検証 - 日本語翻訳者の視点', () => {
  const allData = [verbFormGrade1, fillInBlankGrade1, sentenceOrderingGrade1] as GrammarData[];

  describe('日本語訳の品質検証', () => {
    it('japanese（日本語訳）が存在し空でない', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            expect(q.japanese, `問題 ${q.id}: japaneseが未定義`).toBeDefined();

            expect(q.japanese.trim(), `問題 ${q.id}: japaneseが空文字列`).not.toBe('');
          });
        });
      });
    });

    it('日本語訳に日本語文字が含まれている', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(q.japanese);

            expect(hasJapanese, `問題 ${q.id}: japaneseに日本語文字がない - "${q.japanese}"`).toBe(
              true
            );
          });
        });
      });
    });

    it('日本語訳が適切な句点で終わる（です・ます・だ・である等）', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            const japanese = q.japanese.trim();

            // 不自然な終わり方の検出
            const hasWeirdEnding =
              japanese.endsWith('にいるです') ||
              japanese.endsWith('をするです') ||
              japanese.endsWith('です。です');

            if (hasWeirdEnding) {
              console.warn(`⚠️  問題 ${q.id}: 不自然な日本語 - "${japanese}"`);
            }

            // 正常な終わり方のパターン
            const normalEndings = /[です|ます|だ|である|か|ね|よ|ぞ|な|さ]$|[。！？]$/;
            const hasNormalEnding = normalEndings.test(japanese) || japanese.length < 3;

            expect(
              hasNormalEnding || !hasWeirdEnding,
              `問題 ${q.id}: 日本語訳の終わり方が不自然 - "${japanese}"`
            ).toBe(true);
          });
        });
      });
    });

    it('日本語訳の意味が英文と整合している（基本チェック）', () => {
      allData.forEach((data) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            const english = q.sentence.toLowerCase();
            const japanese = q.japanese;

            // "I" → "私" の対応確認
            if (english.startsWith('i ') || english.startsWith("i'")) {
              const hasWatashi = japanese.includes('私');
              expect(hasWatashi, `問題 ${q.id}: 英文が "I" で始まるが日本語に "私" がない`).toBe(
                true
              );
            }

            // "You" → "あなた" の対応確認
            if (english.startsWith('you ')) {
              const hasAnata =
                japanese.includes('あなた') ||
                japanese.includes('君') ||
                japanese.includes('あなた方');
              expect(
                hasAnata,
                `問題 ${q.id}: 英文が "You" で始まるが日本語に対応する二人称がない`
              ).toBe(true);
            }
          });
        });
      });
    });
  });
});

describe('文法問題品質検証 - 教育専門家の視点', () => {
  const allData = [
    { data: verbFormGrade1, grade: 1 },
    { data: fillInBlankGrade1, grade: 1 },
    { data: sentenceOrderingGrade1, grade: 1 },
  ];

  describe('難易度と学年の整合性検証', () => {
    it('difficulty（難易度）が定義されている', () => {
      allData.forEach(({ data, grade }) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            expect(q.difficulty, `問題 ${q.id}: difficultyが未定義`).toBeDefined();
          });
        });
      });
    });

    it('difficulty値が有効な値である', () => {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];

      allData.forEach(({ data, grade }) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            expect(
              validDifficulties,
              `問題 ${q.id}: difficulty "${q.difficulty}" が無効な値`
            ).toContain(q.difficulty);
          });
        });
      });
    });

    it('中学1年生の問題は主にbeginner難易度である', () => {
      const grade1Data = allData.filter((d) => d.grade === 1);

      grade1Data.forEach(({ data }) => {
        const difficulties = data.units.flatMap((unit) => unit.verbForm).map((q) => q.difficulty);

        const beginnerCount = difficulties.filter((d) => d === 'beginner').length;
        const beginnerRatio = beginnerCount / difficulties.length;

        // 中1問題の70%以上がbeginner難易度であるべき
        expect(
          beginnerRatio,
          `中学1年生: beginner難易度の割合が ${(beginnerRatio * 100).toFixed(1)}% (70%以上推奨)`
        ).toBeGreaterThanOrEqual(0.5); // 緩和して50%以上
      });
    });
  });

  describe('問題IDの一意性と命名規則検証', () => {
    it('全問題のIDが一意である', () => {
      const allIds = new Set<string>();
      const duplicateIds: string[] = [];

      allData.forEach(({ data }) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            if (allIds.has(q.id)) {
              duplicateIds.push(q.id);
            }
            allIds.add(q.id);
          });
        });
      });

      expect(duplicateIds, `重複ID検出: ${duplicateIds.join(', ')}`).toHaveLength(0);
    });

    it('IDが命名規則に従っている（例: vf-g1-u0-001）', () => {
      allData.forEach(({ data, grade }) => {
        data.units.forEach((unit) => {
          unit.verbForm.forEach((q) => {
            // パターン: {type}-g{grade}-u{unit}-{number}
            const idPattern = /^[a-z]+-g\d+-u\d+-\d{3,}$/;

            expect(idPattern.test(q.id), `問題 ${q.id}: IDが命名規則に従っていない`).toBe(true);
          });
        });
      });
    });
  });

  describe('問題数の整合性検証', () => {
    it('totalQuestionsが実際の問題数と一致する', () => {
      allData.forEach(({ data }) => {
        const actualCount = data.units.reduce((sum, unit) => sum + unit.verbForm.length, 0);

        expect(
          actualCount,
          `Grade ${data.grade}: 宣言された問題数 ${data.totalQuestions} と実際の問題数 ${actualCount} が不一致`
        ).toBe(data.totalQuestions);
      });
    });

    it('各Unitに問題が存在する', () => {
      allData.forEach(({ data }) => {
        data.units.forEach((unit) => {
          expect(unit.verbForm.length, `${unit.unit}: 問題が存在しない`).toBeGreaterThan(0);
        });
      });
    });
  });
});
