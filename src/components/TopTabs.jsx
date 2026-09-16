import React from "react";
import { colors, font, type } from "../theme";

const TABS = [
  { id: "brainstorm", label: "Brainstorm" },
  { id: "action", label: "Action" },
];

export default function TopTabs({ tab, setTab }) {
  return (
    <div style={{ display: "flex", background: colors.bg, paddingTop: "12px", paddingLeft: "14px", gap: "6px" }}>
      {TABS.map((t) => (
        <div
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            padding: "14px 28px",
            background: tab === t.id ? colors.panel : "transparent",
            color: tab === t.id ? colors.textPrimary : colors.textMuted,
            fontSize: type.md,
            fontWeight: 700,
            borderRadius: "12px 12px 0 0",
            cursor: "pointer",
            fontFamily: font.base,
            position: "relative",
            top: "1px",
          }}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}
