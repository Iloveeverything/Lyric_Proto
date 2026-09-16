import React, { useState, useRef, useCallback } from "react";
import { colors, font, type } from "../theme";
import { useCollections } from "../state/CollectionsContext";
import FilterBar from "./FilterBar";
import WordChip from "./WordChip";

let chipIdCounter = 1;
const nextChipId = () => chipIdCounter++;

export default function BrainstormWorkspace({ activeCollectionId }) {
  const { collections, addWord } = useCollections();
  const [canvasWords, setCanvasWords] = useState([]);
  const [sourceError, setSourceError] = useState(null);
  const [loading, setLoading] = useState(null);
  const canvasRef = useRef(null);

  const spawnWords = (words, source) => {
    if (!words.length) {
      setSourceError("Couldn't get words from that source — check the relevant service is reachable (an API key, or a running local Ollama server for Slang/Phrase) and try again.");
      return;
    }
    setSourceError(null);
    const rect = canvasRef.current?.getBoundingClientRect();
    const w = rect ? rect.width : 700;
    const h = rect ? rect.height : 400;
    const spawned = words.map((text) => ({
      id: nextChipId(),
      text,
      source,
      x: 30 + Math.random() * Math.max(w - 140, 100),
      y: 30 + Math.random() * Math.max(h - 100, 100),
    }));
    setCanvasWords((prev) => [...prev, ...spawned]);
  };

  const spawnTypedWords = (items) => {
    if (!items.length) {
      setSourceError("Couldn't get words from that source — check the relevant service is reachable (an API key, or a running local Ollama server) and try again.");
      return;
    }
    setSourceError(null);
    const rect = canvasRef.current?.getBoundingClientRect();
    const w = rect ? rect.width : 700;
    const h = rect ? rect.height : 400;
    const spawned = items.map((item) => ({
      id: nextChipId(),
      text: item.text,
      source: item.source,
      x: 30 + Math.random() * Math.max(w - 140, 100),
      y: 30 + Math.random() * Math.max(h - 100, 100),
    }));
    setCanvasWords((prev) => [...prev, ...spawned]);
  };

  const clearCanvas = () => {
    setCanvasWords([]);
    setSourceError(null);
  };

  const handleDrag = useCallback((id, x, y) => {
    setCanvasWords((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const handleCollect = useCallback(
    (word) => {
      if (!activeCollectionId) return;
      addWord(activeCollectionId, word.text, word.source);
      setCanvasWords((prev) => prev.filter((w) => w.id !== word.id));
    },
    [activeCollectionId, addWord]
  );

  const activeCollection = collections.find((c) => c.id === activeCollectionId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <FilterBar onSpawn={spawnWords} onSpawnTyped={spawnTypedWords} onClear={clearCanvas} loading={loading} setLoading={setLoading} />

      {sourceError && (
        <div
          style={{
            padding: "10px 24px",
            background: "rgba(224,106,106,0.1)",
            borderBottom: `1px solid ${colors.danger}55`,
            color: colors.danger,
            fontSize: type.sm,
            fontFamily: font.base,
          }}
        >
          {sourceError}
        </div>
      )}

      <div
        ref={canvasRef}
        style={{
          flex: 1,
          position: "relative",
          background: colors.bg,
          overflow: "hidden",
        }}
      >
        {canvasWords.length === 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.textFaint,
              fontFamily: font.base,
              fontSize: type.lg,
              textAlign: "center",
              padding: "0 40px",
            }}
          >
            Click a filter above to bring words onto the board.
            <br />
            Click a word to save it · drag to rearrange.
          </div>
        )}
        {canvasWords.map((w) => (
          <WordChip key={w.id} word={w} onDrag={handleDrag} onCollect={handleCollect} />
        ))}
      </div>

      <div
        style={{
          padding: "14px 24px",
          background: colors.panel,
          borderTop: `1px solid ${colors.border}`,
          fontSize: type.md,
          color: colors.textMuted,
          fontFamily: font.base,
        }}
      >
        {activeCollection ? (
          <span>
            Saving to <strong style={{ color: colors.accent }}>{activeCollection.name}</strong> — {activeCollection.words.length} word{activeCollection.words.length === 1 ? "" : "s"}
          </span>
        ) : (
          <span>No active collection — create or select one in the sidebar.</span>
        )}
      </div>
    </div>
  );
}
