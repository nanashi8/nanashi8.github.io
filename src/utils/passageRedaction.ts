function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripTerminalPunctuation(text: string): string {
  return text.replace(/[\s]*[.,!?;:]+\s*$/g, '').trim();
}

/**
 * パッセージ中に正解がそのまま含まれてしまう「漏れ」を防ぐため、
 * 該当箇所を空欄に置換します。
 */
export function redactAnswerInPassage(passage: string, answer: string): string {
  const originalPassage = passage ?? '';
  const originalAnswer = (answer ?? '').trim();

  if (!originalPassage || !originalAnswer) return originalPassage;

  const candidates = [originalAnswer, stripTerminalPunctuation(originalAnswer)]
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  let result = originalPassage;

  for (const candidate of candidates) {
    const escaped = escapeRegExp(candidate);
    const re = new RegExp(escaped, 'gi');
    if (!re.test(result)) continue;
    result = result.replace(re, '____');
  }

  return result;
}
