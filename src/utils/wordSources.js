// Every filter here hits a real, live source - either an API or the local
// Phi model via Ollama. There is no hardcoded word content anywhere in
// this file. If a source is genuinely unreachable (offline, rate-limited,
// key missing, Ollama not running), the function returns an empty array
// and the caller shows an honest "couldn't reach that source" message
// rather than silently serving fake data.

import { callOllama } from "./ollamaClient";
import { getPromptSettings } from "../state/promptSettings";

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Datamuse and similar sources return the SAME ranked results for the same
// query every time, so hitting the same filter repeatedly can otherwise
// show the same words again and again. This tracks what's already been
// shown per filter type and filters it out, resetting once a pool is
// exhausted so the filter never goes permanently empty. It's also fed back
// into Phi's prompts (see below) as an explicit "don't repeat these" list.
const seenWords = {};

function dedupeAgainstSeen(key, words) {
  if (!seenWords[key]) seenWords[key] = new Set();
  const seen = seenWords[key];
  let fresh = words.filter((w) => !seen.has(w.toLowerCase()));
  if (fresh.length === 0 && words.length > 0) {
    seen.clear();
    fresh = words;
  }
  fresh.forEach((w) => seen.add(w.toLowerCase()));
  return fresh;
}

function alreadySeen(key) {
  return seenWords[key] ? Array.from(seenWords[key]) : [];
}

// Random, no-theme part-of-speech pulls. We sample from two random starting
// letters each call (rather than one) to widen the pool - Datamuse ranks
// results by frequency within a letter, so a single letter alone tends to
// surface the same handful of top words repeatedly.
//
// md=fp also requests frequency data (occurrences per million words of real
// text). Without filtering on this, a plain spelling-pattern search returns
// plenty of obscure/technical/dictionary-only words alongside common ones -
// not usable for songwriting. We keep only words frequent and short enough
// to be everyday, recognizable vocabulary.
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const POS_TAGS = { noun: "n", verb: "v", adjective: "adj", adverb: "adv" };
const MIN_FREQUENCY = 5; // occurrences per million words - filters out rare/technical words
const MAX_WORD_LENGTH = 9;

function getFrequency(tags) {
  const tag = tags?.find((t) => t.startsWith("f:"));
  return tag ? parseFloat(tag.slice(2)) : 0;
}

async function wordsStartingWith(letter, tag) {
  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${letter}*&md=fp&max=200`);
    const data = await res.json();
    return data
      .filter(
        (d) =>
          d.tags?.includes(tag) &&
          getFrequency(d.tags) >= MIN_FREQUENCY &&
          d.word.length <= MAX_WORD_LENGTH &&
          /^[a-z]+$/i.test(d.word)
      )
      .map((d) => d.word);
  } catch (e) {
    return [];
  }
}

export async function fetchPartOfSpeech(type) {
  const tag = POS_TAGS[type];
  const [letterA, letterB] = shuffle(ALPHABET);
  const [wordsA, wordsB] = await Promise.all([wordsStartingWith(letterA, tag), wordsStartingWith(letterB, tag)]);
  const pool = shuffle(Array.from(new Set([...wordsA, ...wordsB])));
  return dedupeAgainstSeen(type, pool).slice(0, 8);
}

// Parses Phi's reply into a plain array of strings. Small local models
// don't always follow "reply with ONLY a JSON array" perfectly, so this
// tries a real JSON parse first, then falls back to splitting on lines or
// commas and stripping bullets/numbering/quotes.
function parseWordListResponse(raw) {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const arr = JSON.parse(jsonMatch[0]);
      if (Array.isArray(arr)) {
        return arr.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch (e) {
      /* fall through to line-splitting below */
    }
  }
  return raw
    .split(/\n|,/)
    .map((s) => s.replace(/^[\s\-\d.\)\]"'*]+|["'\s]+$/g, "").trim())
    .filter(Boolean);
}

// Generates a fresh word/phrase list via the local Phi model, using the
// user-editable prompts from promptSettings.js. Used for slang (no
// trustworthy live dictionary API exists - see design notes) and as
// idioms' fallback when no Wordnik key is configured. Fails honestly
// (empty array) if Ollama isn't running, same as every other source here.
//
// temperature is turned up from Ollama's default for these calls
// specifically - word-bank variety matters more here than for lyric
// generation, and a low-temperature small model tends to repeat its most
// "obvious" answers even when told not to.
async function generateWordListViaPhi(kind, seenKey) {
  const settings = getPromptSettings();
  const systemPrompt = kind === "slang" ? settings.slangSystem : settings.idiomSystem;
  const userTemplate = kind === "slang" ? settings.slangUser : settings.idiomUser;

  const avoid = alreadySeen(seenKey);
  const avoidText = avoid.length ? `Do not repeat any of these: ${avoid.slice(0, 40).join(", ")}.` : "";
  const userPrompt = userTemplate.replace("{avoid}", avoidText);

  try {
    const raw = await callOllama(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 1.1 }
    );
    return parseWordListResponse(raw);
  } catch (e) {
    return [];
  }
}

// Slang has no trustworthy live dictionary API - Urban Dictionary's own
// data (and everything scraped from it) carries real risk of offensive
// content no matter how it's filtered, since there's no actual
// verification system behind a crowdsourced site. Phi generates from its
// own training knowledge of common usage instead - safer and still live
// (not a fixed list), though it does mean this filter needs Ollama running.
//
// Slang must be single words by definition here (multi-word entries belong
// under Phrase). Small local models don't reliably hold a "single words
// only" instruction across every response - especially once the prompt
// grows with an "avoid these" list after repeated clicks - so this is
// enforced in code rather than trusted to the prompt alone: anything with
// whitespace is dropped before it ever reaches the canvas.
export async function fetchSlang() {
  const raw = await generateWordListViaPhi("slang", "slang");
  const singleWordsOnly = raw.filter((w) => !/\s/.test(w.trim()));
  return dedupeAgainstSeen("slang", shuffle(singleWordsOnly)).slice(0, 8);
}

// Idioms via Wordnik's randomWords endpoint, which treats "idiom" as a
// genuine part-of-speech value you can filter for directly. Needs a free
// Wordnik API key (VITE_WORDNIK_API_KEY). If it's not set yet (or the call
// fails), falls back to Phi-generated idioms rather than a fixed list.
export async function fetchIdioms() {
  const apiKey = import.meta.env.VITE_WORDNIK_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.wordnik.com/v4/words.json/randomWords?includePartOfSpeech=idiom&hasDictionaryDef=true&limit=10&api_key=${apiKey}`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        const words = data.map((d) => d.word).filter(Boolean);
        return dedupeAgainstSeen("phrase", words).slice(0, 8);
      }
    } catch (e) {
      /* fall through to Phi below */
    }
  }
  const words = await generateWordListViaPhi("idiom", "phrase");
  return dedupeAgainstSeen("phrase", shuffle(words)).slice(0, 8);
}

const NEWS_CATEGORIES = ["general", "entertainment", "sports", "science", "technology", "business"];

export async function fetchNews() {
  const apiKey = import.meta.env.VITE_GNEWS_API_KEY;

  if (apiKey) {
    try {
      const category = NEWS_CATEGORIES[Math.floor(Math.random() * NEWS_CATEGORIES.length)];
      const res = await fetch(
        `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&max=10&apikey=${apiKey}`
      );
      const data = await res.json();
      if (data.articles?.length) {
        const words = new Set();
        data.articles.forEach((article) => {
          `${article.title} ${article.description || ""}`
            .replace(/[^a-zA-Z\s]/g, "")
            .split(/\s+/)
            .filter((w) => w.length > 4)
            .forEach((w) => words.add(w));
        });
        const arr = dedupeAgainstSeen("news", Array.from(words));
        if (arr.length) return arr.slice(0, 12);
      }
    } catch (e) {
      /* fall through to RSS below */
    }
  }

  // No key configured, or GNews failed - try NY Post RSS via a public CORS
  // proxy as a second live source before giving up honestly.
  try {
    const proxy = "https://api.allorigins.win/raw?url=";
    const feed = encodeURIComponent("https://nypost.com/feed/");
    const res = await fetch(proxy + feed);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const titles = Array.from(xml.querySelectorAll("item > title")).map((t) => t.textContent);
    const words = new Set();
    titles.forEach((title) => {
      title
        .replace(/[^a-zA-Z\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .forEach((w) => words.add(w));
    });
    return dedupeAgainstSeen("news", Array.from(words)).slice(0, 12);
  } catch (e) {
    return [];
  }
}

// ---------- Mixed word banks: Themes and Inspiration-from-artist ----------
// Both return items tagged with their own type (noun/verb/adjective/phrase/
// slang) rather than one uniform source, since a single click here produces
// a MIX of word kinds - the chips need to be individually colored to match.

const TYPE_TAGS = ["noun", "verb", "adjective", "phrase", "slang"];

// A hand-picked (not scraped) list of themes that have run through Western
// popular music since 1950 - broad, recognizable categories, not owned by
// anyone.
export const MUSIC_THEMES = ["Love", "Sadness", "Nostalgia", "Freedom", "Protest", "Dreams", "Party", "Ambition", "Heartbreak", "Hope"];

function parseTypedWordListResponse(raw) {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const arr = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => ({
        text: String(item.word ?? item.text ?? "").trim(),
        source: TYPE_TAGS.includes(item.type) ? item.type : "phrase",
      }))
      .filter((item) => item.text);
  } catch (e) {
    return [];
  }
}

export async function fetchThemeWordBank(theme) {
  try {
    const raw = await callOllama(
      [
        { role: "system", content: "You are a precise assistant that replies with exactly the requested format and nothing else." },
        {
          role: "user",
          content: `Generate a mixed word bank of 12 items for songwriting on the theme "${theme}", drawing on how this theme has commonly appeared in Western popular music since 1950. Include a mix of nouns, verbs, adjectives, short evocative phrases, and mainstream slang. Keep it safe for all audiences. Reply with ONLY a JSON array of objects shaped like {"word": "...", "type": "noun"}, where type is one of noun, verb, adjective, phrase, slang. Nothing else.`,
        },
      ],
      { temperature: 1.0 }
    );
    return parseTypedWordListResponse(raw);
  } catch (e) {
    return [];
  }
}

export async function fetchArtistWordBank(artistName) {
  const name = artistName.trim();
  if (!name) return [];
  try {
    const raw = await callOllama(
      [
        {
          role: "system",
          content:
            "You are a precise assistant that replies with exactly the requested format and nothing else. You never quote or reproduce any actual song lyrics from any artist - you only generate original vocabulary evocative of their general public reputation, themes, and style.",
        },
        {
          role: "user",
          content: `Generate a mixed word bank of 12 ORIGINAL items for songwriting, evocative of the general lyrical themes, imagery, and vocabulary style publicly associated with the musical artist "${name}" - based on their well-known reputation, NOT quoting or paraphrasing any of their actual lyrics. Include a mix of nouns, verbs, adjectives, short original phrases, and slang, in a style reminiscent of that artist. Keep it safe for all audiences. Reply with ONLY a JSON array of objects shaped like {"word": "...", "type": "noun"}, where type is one of noun, verb, adjective, phrase, slang. Nothing else.`,
        },
      ],
      { temperature: 1.0 }
    );
    return parseTypedWordListResponse(raw);
  } catch (e) {
    return [];
  }
}
