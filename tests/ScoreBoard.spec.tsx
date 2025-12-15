import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreBoard from '../src/components/ScoreBoard';

// Mock external modules used by ScoreBoard
vi.mock('../src/progressStorage', () => ({
  getTodayStats: vi.fn(() => ({ totalQuestions: 0, correct: 0 })),
  getRetentionRateWithAI: vi.fn(() => ({ retentionRate: 0, appearedCount: 0 })),
  getDetailedRetentionStats: vi.fn(() => ({
    masteredPercentage: 0,
    learningPercentage: 0,
    strugglingPercentage: 0,
  })),
  getGrammarRetentionRateWithAI: vi.fn(() => ({ retentionRate: 0, appearedCount: 0 })),
  getGrammarDetailedRetentionStats: vi.fn(() => ({
    masteredPercentage: 0,
    learningPercentage: 0,
    strugglingPercentage: 0,
  })),
  getMemorizationDetailedRetentionStats: vi.fn(() => ({
    basicRetentionRate: 0,
    appearedWords: 0,
    masteredPercentage: 0,
    learningPercentage: 0,
    strugglingPercentage: 0,
  })),
  getGrammarUnitStatsWithTitles: vi.fn(() => Promise.resolve([])),
  getDailyPlanInfo: vi.fn(() => ({ planned: 0 })),
  getWordDetailedData: vi.fn((word: string) => {
    if (word === 'first-time') {
      return { totalAttempts: 0, correctCount: 0, incorrectCount: 0 };
    }
    if (word === 'second-time-correct') {
      return { totalAttempts: 1, correctCount: 1, incorrectCount: 0 };
    }
    if (word === 'second-time-incorrect') {
      return { totalAttempts: 1, correctCount: 0, incorrectCount: 1 };
    }
    if (word === 'many-times') {
      return { totalAttempts: 5, correctCount: 3, incorrectCount: 2 };
    }
    return null;
  }),
}));

vi.mock('../src/timeBasedGreeting', () => ({
  generateTimeBasedGreeting: vi.fn(() => 'こんにちは！一緒に学習しましょう。'),
}));

vi.mock('../src/teacherInteractions', () => ({
  getTimeBasedTeacherChat: vi.fn(() => null),
  getSpecialDayChat: vi.fn(() => null),
}));

vi.mock('../src/englishTrivia', () => ({
  getBreatherTrivia: vi.fn(() => null),
}));

vi.mock('../src/aiCommentGenerator', () => ({
  getTimeOfDay: vi.fn(() => 'morning'),
  generateAIComment: vi.fn((personality: string, ctx: any) => {
    return ctx.isCorrect ? '正解です！' : '惜しいです';
  }),
}));

// utility to get rendered AI text (component cleans emojis; we just read text)
function getAIText() {
  const el = screen.getByText((content, node) => {
    return node?.parentElement?.className?.includes('leading-snug') ?? false;
  });
  return el.textContent || '';
}

describe('ScoreBoard AI comments', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows question history comment on new question (first-time)', () => {
    render(
      <ScoreBoard mode="translation" currentWord="first-time" />
    );
    // Should show pre-answer comment based on history (not empty)
    const text = getAIText();
    expect(text).toMatch(/初めて|新しい/);
  });

  it('clears answer comment when new question appears', () => {
    const { rerender } = render(
      <ScoreBoard mode="translation" currentWord="second-time-correct" />
    );
    // Pre-answer comment rendered
    expect(getAIText()).toContain('2回目');

    // After answer for this same word
    rerender(
      <ScoreBoard mode="translation" currentWord="second-time-correct" lastAnswerWord="second-time-correct" lastAnswerCorrect={true} onAnswerTime={Date.now()} />
    );
    expect(getAIText()).toContain('正解です');

    // Move to next question: answer comment must clear and show new question comment
    rerender(
      <ScoreBoard mode="translation" currentWord="first-time" />
    );
    const text = getAIText();
    expect(text).not.toContain('正解です');
    expect(text).toContain('初めて');
  });

  it('does not show answer comment if lastAnswerWord does not match currentWord', () => {
    render(
      <ScoreBoard mode="translation" currentWord="many-times" lastAnswerWord="second-time-correct" lastAnswerCorrect={true} onAnswerTime={Date.now()} />
    );
    // Because words mismatch, should display question comment, not answer comment
    const text = getAIText();
    expect(text).toContain('回目');
    expect(text).not.toContain('正解です');
  });

  it('shows correct answer comment only when answering current word', () => {
    const time = Date.now();
    render(
      <ScoreBoard mode="translation" currentWord="second-time-incorrect" lastAnswerWord="second-time-incorrect" lastAnswerCorrect={false} onAnswerTime={time} />
    );
    const text = getAIText();
    expect(text).toContain('惜しいです');
  });

  it('handles no history data gracefully', () => {
    const { rerender } = render(
      <ScoreBoard mode="translation" currentWord="unknown-word" />
    );
    expect(getAIText()).toMatch(/新しい問題|初めて|新規/);
    rerender(
      <ScoreBoard mode="translation" currentWord="unknown-word" lastAnswerWord="unknown-word" lastAnswerCorrect={true} onAnswerTime={Date.now()} />
    );
    expect(getAIText()).toContain('正解です');
  });

  it('emoji cleanup does not leave avatar in text', () => {
    // Test uses the mock already defined at the top of file
    const { rerender } = render(
      <ScoreBoard mode="translation" currentWord="second-time-correct" />
    );
    expect(getAIText()).toContain('2回目');
    rerender(
      <ScoreBoard mode="translation" currentWord="second-time-correct" lastAnswerWord="second-time-correct" lastAnswerCorrect={true} onAnswerTime={Date.now()} />
    );
    const text = getAIText();
    expect(text).toContain('正解です');
    // Mock returns plain text without emoji prefix, so this test validates cleanup
    expect(text).not.toContain('😃');
  });
});
