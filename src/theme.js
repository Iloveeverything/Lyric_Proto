// Central design tokens. Change a color here and it updates everywhere.

export const colors = {
  bg: "#120E1C",
  panel: "#1C1530",
  panelElevated: "#241C38",
  border: "#3D2F5C",
  borderActive: "#9D5CFF",
  glow: "rgba(157, 92, 255, 0.35)",
  accent: "#9D5CFF",
  accentSoft: "rgba(157, 92, 255, 0.14)",
  textPrimary: "#F5F1FC",
  textMuted: "#B3A8CC",
  textFaint: "#8A7FA8",
  danger: "#E06A6A",
  dangerSoft: "rgba(224, 106, 106, 0.14)",
  success: "#7FD8A0",
};

// Pastel-on-dark colors for word chips, keyed by source type.
// Used as translucent fills with matching text color (no borders).
// Filter buttons in the Brainstorm workspace use these same colors so the
// button you click visually matches the chips it produces. Noun/verb/
// adjective get distinct colors (not one shared "part of speech" color) so
// mixed word banks (Themes, Inspiration) are visually legible at a glance.
export const sourceColors = {
  noun: { text: "#A8E0B0", bg: "rgba(168, 224, 176, 0.14)" },
  verb: { text: "#7FE3C4", bg: "rgba(127, 227, 196, 0.14)" },
  adjective: { text: "#FFB37F", bg: "rgba(255, 179, 127, 0.14)" },
  phrase: { text: "#F0C987", bg: "rgba(240, 201, 135, 0.14)" },
  slang: { text: "#F0AED0", bg: "rgba(240, 174, 208, 0.14)" },
  news: { text: "#9ECBE8", bg: "rgba(158, 203, 232, 0.14)" },
  default: { text: "#CFC9DF", bg: "rgba(207, 201, 223, 0.14)" },
};

export const sourceLabels = {
  noun: "Noun",
  verb: "Verb",
  adjective: "Adjective",
  phrase: "Phrase",
  slang: "Slang",
  news: "World",
};

export const font = {
  base: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  lyric: "'Fraunces', Georgia, serif",
};

// Type scale - bumped up across the board for readability (kid + senior friendly)
export const type = {
  sm: "17px",
  md: "20px",
  lg: "24px",
  xl: "30px",
};

export const panelStyle = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: "16px",
};

export const inputStyle = {
  background: colors.bg,
  border: `2px solid ${colors.border}`,
  borderRadius: "14px",
  color: colors.textPrimary,
  padding: "16px 18px",
  fontSize: type.md,
  outline: "none",
  fontFamily: font.base,
};

export const inputFocusStyle = {
  border: `2px solid ${colors.borderActive}`,
  boxShadow: `0 0 0 4px ${colors.glow}`,
};

export const buttonPrimaryStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  background: colors.accentSoft,
  border: `2px solid ${colors.borderActive}`,
  borderRadius: "14px",
  color: colors.textPrimary,
  padding: "16px 28px",
  fontSize: type.md,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: font.base,
};

export const buttonGhostStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  background: "transparent",
  border: `2px solid ${colors.border}`,
  borderRadius: "14px",
  color: colors.textMuted,
  padding: "16px 28px",
  fontSize: type.md,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font.base,
};

export const buttonDangerStyle = {
  ...buttonGhostStyle,
  color: colors.danger,
  border: `1px solid ${colors.danger}55`,
  background: colors.dangerSoft,
};
