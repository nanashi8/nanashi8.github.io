// ユーティリティ関数（テスト可能な純関数をここに集約）
// main.js のロジックと互換性を保つように実装しています。

function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[len1][len2];
}

function splitIntoPhrases(text) {
    if (!text || typeof text !== 'string') return [];

    // 文に分割（句点で区切り）
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    const phrases = [];
    sentences.forEach(sentence => {
        const subPhrases = sentence
            .split(/(?:,|;|\s+and\s+|\s+but\s+|\s+or\s+|\s+because\s+|\s+when\s+|\s+if\s+|\s+while\s+|\s+although\s+)/i)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        phrases.push(...subPhrases);
    });

    return phrases;
}

module.exports = { levenshteinDistance, splitIntoPhrases };
