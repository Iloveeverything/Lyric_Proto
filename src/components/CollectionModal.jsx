import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { colors, inputStyle, buttonGhostStyle, buttonDangerStyle, font, type, sourceColors } from "../theme";
import { useCollections } from "../state/CollectionsContext";

export default function CollectionModal({ collectionId, onClose }) {
  const { collections, renameCollection, deleteCollection, removeWord } = useCollections();
  const collection = collections.find((c) => c.id === collectionId);
  const [name, setName] = useState(collection?.name ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setName(collection?.name ?? "");
  }, [collection?.id]);

  if (!collection) return null;

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== collection.name) {
      renameCollection(collection.id, trimmed);
    } else {
      setName(collection.name);
    }
  };

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteCollection(collection.id);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6, 4, 12, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "480px",
          maxHeight: "72vh",
          display: "flex",
          flexDirection: "column",
          background: colors.panel,
          border: `2px solid ${colors.border}`,
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          fontFamily: font.base,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 20px 14px" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
            style={{ ...inputStyle, flex: 1, fontSize: type.xl, fontWeight: 700 }}
          />
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: colors.textMuted }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "6px 20px" }}>
          {collection.words.length === 0 ? (
            <div style={{ color: colors.textFaint, fontSize: type.md, padding: "16px 0" }}>
              No words saved yet — collect some from the Brainstorm board.
            </div>
          ) : (
            collection.words.map((w) => {
              const palette = sourceColors[w.source] || sourceColors.default;
              return (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 6px",
                    borderBottom: `1px solid ${colors.border}55`,
                  }}
                >
                  <span style={{ color: palette.text, fontSize: type.lg, fontWeight: 700 }}>{w.text}</span>
                  <button
                    onClick={() => removeWord(collection.id, w.id)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: colors.textFaint }}
                    title="Remove word"
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "18px 20px" }}>
          <button onClick={handleDelete} style={buttonDangerStyle}>
            <Trash2 size={18} />
            {confirmingDelete ? "Confirm delete?" : "Delete collection"}
          </button>
          <button onClick={onClose} style={buttonGhostStyle}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
