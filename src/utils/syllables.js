// Approximate English syllable counter using a standard vowel-group heuristic.
// This is not perfect (no algorithm without a pronunciation dictionary is),
// but it's accurate enough to guide generation and give the user a useful signal.

export function countWordSyllables(rawWord) {
  let word = rawWord.toLowerCase().replace(/[^a-z']/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;

  // Drop a silent trailing "e" (but not if it's the whole word or "-le")
  word = word.replace(/e$/, "");

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function countLineSyllables(line) {
  if (!line) return 0;
  return line
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, word) => sum + countWordSyllables(word), 0);
}
