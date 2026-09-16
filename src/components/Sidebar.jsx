import React, { useState } from "react";
import { Plus, Folder, FolderOpen } from "lucide-react";
import { colors, inputStyle, font, type } from "../theme";
import { useCollections } from "../state/CollectionsContext";
import CollectionModal from "./CollectionModal";

export default function Sidebar({ activeCollectionId, setActiveCollectionId }) {
  const { collections, createCollection } = useCollections();
  const [newName, setNewName] = useState("");
  const [openCollectionId, setOpenCollectionId] = useState(null);

  const handleCreate = () => {
    if (newName.trim()) {
      const id = createCollection(newName.trim());
      setActiveCollectionId(id);
      setNewName("");
    }
  };

  return (
    <div style={{ width: "280px", background: colors.panel, borderRight: `1px solid ${colors.border}`, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 10px", fontSize: type.sm, letterSpacing: "0.04em", color: colors.textMuted, fontFamily: font.base, textTransform: "uppercase", fontWeight: 700 }}>
        Collections
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "0 12px" }}>
        {collections.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveCollectionId(c.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setOpenCollectionId(c.id);
            }}
            title="Right-click to view, rename, or edit"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 16px",
              borderRadius: "12px",
              cursor: "pointer",
              marginBottom: "6px",
              background: c.id === activeCollectionId ? colors.accentSoft : "transparent",
              border: c.id === activeCollectionId ? `2px solid ${colors.borderActive}` : "2px solid transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
              {c.id === activeCollectionId ? <FolderOpen size={24} color={colors.accent} /> : <Folder size={24} color={colors.textMuted} />}
              <span style={{ color: colors.textPrimary, fontSize: type.md, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: font.base, fontWeight: 600 }}>
                {c.name}
              </span>
            </div>
            <span style={{ color: colors.textFaint, fontSize: type.sm, fontFamily: font.base }}>{c.words.length}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "16px", borderTop: `1px solid ${colors.border}`, display: "flex", gap: "10px" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New collection…"
          style={{ ...inputStyle, flex: 1, padding: "12px 14px", fontSize: type.sm }}
        />
        <button
          onClick={handleCreate}
          style={{ background: colors.accentSoft, border: `2px solid ${colors.borderActive}`, borderRadius: "10px", color: colors.textPrimary, padding: "0 14px", cursor: "pointer" }}
        >
          <Plus size={22} />
        </button>
      </div>

      {openCollectionId && (
        <CollectionModal collectionId={openCollectionId} onClose={() => setOpenCollectionId(null)} />
      )}
    </div>
  );
}
