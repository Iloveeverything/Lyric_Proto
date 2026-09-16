// Shared low-level client for talking to the local Ollama server. Both
// ollama.js (lyric generation) and wordSources.js (slang/idiom generation)
// use this - pulled out into its own file so those two don't have to
// import from each other in a circle.

export const OLLAMA_CHAT_URL = "http://localhost:11434/api/chat";
export const MODEL = "phi4-mini";

export async function callOllama(messages, options = {}) {
  const res = await fetch(OLLAMA_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, stream: false, options }),
  });
  if (!res.ok) {
    throw new Error("ollama-unreachable");
  }
  const data = await res.json();
  return (data.message?.content ?? "").trim();
}
