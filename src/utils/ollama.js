import { countLineSyllables } from './syllables';
import { callOllama } from './ollamaClient';

const MAX_ATTEMPTS = 3;
const SYLLABLE_TOLERANCE = 0; // accept lines within +/-0 syllable of target

function buildSystemPrompt(sourceWords) {
  const bank = sourceWords.length
    ? sourceWords.join(', ')
    : 'no specific word bank - write freely';
  return (
    "You are a skilled songwriter's creative collaborator, writing one lyric line at a time. " +
    "Treat this word bank as a mind map for the song's story - a connected set of images, " +
    'feelings, and ideas that should thread through the narrative across the lines you write. ' +
    'Use several of the actual words or short phrases from the bank directly in each line where ' +
    'it fits naturally, so the connection to the bank stays clearly recognizable: ' +
    `${bank}. Avoid cliches. Reply with ONLY the lyric line itself - no quotes, no explanation, ` +
    'no numbering, no syllable counts, no alternate versions, nothing in parentheses.'
  );
}

function cleanLine(raw) {
  return raw
    .split('\n')[0]
    .replace(/\s*\(\s*\d+\s*syllables?\s*\)\s*/gi, ' ')
    .replace(/^["'\-\d.\s]+|["'\s]+$/g, '')
    .trim();
}

function getLastWord(line) {
  const words = line
    .replace(/[^\w\s']/g, '')
    .trim()
    .split(/\s+/);
  return words[words.length - 1] || '';
}

function lastWordMatches(line, lastWord) {
  if (!lastWord) return true;
  return getLastWord(line).toLowerCase() === lastWord.trim().toLowerCase();
}

/**
 * Generates one fresh lyric line, retrying with feedback until the syllable
 * count and (optional) last word actually match, or attempts run out.
 * Always returns the closest attempt found, flagged approximate if nothing
 * hit the target exactly.
 */
export async function generateLyricLine({
  sourceWords,
  syllables,
  lastWord,
  avoidLines = [],
}) {
  const targetSyllables = Number(syllables) || 8;
  const systemPrompt = buildSystemPrompt(sourceWords);
  const avoidLinesText = avoidLines.length
    ? ` Do not repeat or closely rephrase any of these previous lines: ${avoidLines
        .slice(-6)
        .map((l) => `"${l}"`)
        .join(', ')}.`
    : '';

  let feedback = '';
  let best = null;
  let bestScore = Infinity;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let userPrompt = `Write one original lyric line with exactly ${targetSyllables} syllables.`;
    if (lastWord)
      userPrompt += ` The line must end with the word "${lastWord}".`;
    userPrompt += avoidLinesText;
    if (feedback) userPrompt += ` ${feedback}`;

    const raw = await callOllama(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 1.0 },
    );
    const line = cleanLine(raw);
    const actualSyllables = countLineSyllables(line);
    const syllableDiff = Math.abs(actualSyllables - targetSyllables);
    const wordOk = lastWordMatches(line, lastWord);
    const score = syllableDiff + (wordOk ? 0 : 10);

    if (score < bestScore) {
      best = {
        line,
        syllables: actualSyllables,
        exact: syllableDiff === 0 && wordOk,
      };
      bestScore = score;
    }

    if (syllableDiff <= SYLLABLE_TOLERANCE && wordOk) {
      return { ...best, approximate: syllableDiff !== 0, attempts: attempt };
    }

    feedback = `Your last attempt was "${line}" (${actualSyllables} syllables). Target is ${targetSyllables} syllables${
      lastWord ? ` ending on "${lastWord}"` : ''
    }. Try a different line that fits better.`;
  }

  return { ...best, approximate: true, attempts: MAX_ATTEMPTS };
}

/**
 * Freely rephrases a line - same rough syllable count and meaning, new
 * wording.
 */
export async function rephraseLine({ line, sourceWords, syllables }) {
  const systemPrompt = buildSystemPrompt(sourceWords);
  const targetSyllables = Number(syllables) || countLineSyllables(line);
  const raw = await callOllama([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Rephrase this lyric line, keeping close to ${targetSyllables} syllables and a similar meaning, but different wording: "${line}". Reply with ONLY the new line.`,
    },
  ]);
  const cleaned = cleanLine(raw);
  return { line: cleaned, syllables: countLineSyllables(cleaned) };
}
