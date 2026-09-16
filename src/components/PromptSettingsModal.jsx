import React, { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { colors, inputStyle, buttonGhostStyle, buttonPrimaryStyle, font, type } from "../theme";
import { getPromptSettings, updatePromptSettings, resetPromptSettings, subscribePromptSettings } from "../state/promptSettings";

function Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: type.sm, fontWeight: 600, color: colors.textMuted, marginBottom: "6px", fontFamily: font.base }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={label.includes("system") ? 2 : 4}
        style={{ ...inputStyle, width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: "14px", lineHeight: 1.5 }}
      />
    </div>
  );
}

export default function PromptSettingsModal({ onClose }) {
  const [values, setValues] = useState(getPromptSettings());

  useEffect(() => subscribePromptSettings(setValues), []);

  const set = (key) => (val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    updatePromptSettings(values);
    onClose();
  };

  const handleReset = () => {
    resetPromptSettings();
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
          width: "560px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          background: colors.panel,
          border: `2px solid ${colors.border}`,
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          fontFamily: font.base,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px" }}>
          <span style={{ fontSize: type.lg, fontWeight: 700, color: colors.textPrimary }}>AI prompts</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: colors.textMuted }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "0 20px" }}>
          <p style={{ color: colors.textMuted, fontSize: type.sm, marginTop: 0, marginBottom: "18px" }}>
            These control what Phi is asked for when generating Slang and Phrase (idiom) word banks. The token{" "}
            <code style={{ background: colors.panelElevated, padding: "1px 6px", borderRadius: "4px" }}>{"{avoid}"}</code>{" "}
            gets replaced automatically with a "don't repeat these" list built from words already shown.
          </p>
          <Field label="Slang - system prompt" value={values.slangSystem} onChange={set("slangSystem")} />
          <Field label="Slang - user prompt" value={values.slangUser} onChange={set("slangUser")} />
          <Field label="Phrase / idiom - system prompt" value={values.idiomSystem} onChange={set("idiomSystem")} />
          <Field label="Phrase / idiom - user prompt" value={values.idiomUser} onChange={set("idiomUser")} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "18px 20px" }}>
          <button onClick={handleReset} style={buttonGhostStyle}>
            <RotateCcw size={16} />
            Reset to defaults
          </button>
          <button onClick={handleSave} style={buttonPrimaryStyle}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
