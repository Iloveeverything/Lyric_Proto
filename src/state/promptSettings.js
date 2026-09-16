// Editable AI prompts for slang/idiom generation, persisted to localStorage
// so edits survive a page reload. This is a plain module (not React) so
// wordSources.js can read the current values directly on every call,
// without needing a React context. The settings modal writes here too.
//
// Templates use a literal "{avoid}" token, replaced at call time with a
// "don't repeat these" instruction listing recently-shown words.

const STORAGE_KEY = 'lyriclab-prompt-settings';

export const DEFAULT_PROMPTS = {
  slangSystem:
    'You are a precise assistant that replies with exactly the requested format and nothing else.',
  slangUser:
    'List 10 well-known, mainstream, widely-recognized English slang words or short slang phrases - the kind that would appear in a legitimate slang dictionary, not obscure or one-off internet jokes - established, widely-used slang from the 1990s onward. Examples of the correct format: "lit", "salty", "extra", "mood", "vibe", "bet", "cap", "flex". Do NOT include multi-word phrases like "no cap" or "hits different" - those belong to a different category and must be excluded. Do not overlap with plain descriptive nouns, verbs, or adjectives that arent actually slang. Keep it safe for all audiences: no profanity, no sexual or drug references, nothing offensive. Favor slang that\'s usable in song lyrics. {avoid} Reply with ONLY a JSON array of strings, nothing else.',
  idiomSystem:
    'You are a precise assistant that replies with exactly the requested format and nothing else.',
  idiomUser:
    'List 10 common English idioms or idiomatic phrases with strong poetic qualities - the kind that work well in song lyrics. Keep it safe for all audiences. {avoid} Reply with ONLY a JSON array of strings, nothing else.',
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROMPTS, ...JSON.parse(raw) };
  } catch (e) {
    /* ignore - use defaults */
  }
  return { ...DEFAULT_PROMPTS };
}

let current = load();
const listeners = new Set();

export function getPromptSettings() {
  return current;
}

export function updatePromptSettings(partial) {
  current = { ...current, ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    /* ignore - edits just won't persist across reloads */
  }
  listeners.forEach((fn) => fn(current));
}

export function resetPromptSettings() {
  current = { ...DEFAULT_PROMPTS };
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* ignore */
  }
  listeners.forEach((fn) => fn(current));
}

export function subscribePromptSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
