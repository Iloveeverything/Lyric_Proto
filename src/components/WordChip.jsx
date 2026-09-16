import React, { useRef } from "react";
import { sourceColors } from "../theme";

export default function WordChip({ word, onDrag, onCollect }) {
  const ref = useRef(null);
  const dragInfo = useRef({ startX: 0, startY: 0, moved: false, offsetX: 0, offsetY: 0 });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    const rect = ref.current.getBoundingClientRect();
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    const parentRect = ref.current.parentElement.getBoundingClientRect();

    const onMove = (ev) => {
      const dx = Math.abs(ev.clientX - dragInfo.current.startX);
      const dy = Math.abs(ev.clientY - dragInfo.current.startY);
      if (dx > 4 || dy > 4) dragInfo.current.moved = true;
      if (dragInfo.current.moved) {
        const x = ev.clientX - parentRect.left - dragInfo.current.offsetX;
        const y = ev.clientY - parentRect.top - dragInfo.current.offsetY;
        onDrag(word.id, x, y);
      }
    };
    const onUp = () => {
      if (!dragInfo.current.moved) {
        onCollect(word);
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const palette = sourceColors[word.source] || sourceColors.default;

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      style={{
        position: "absolute",
        left: word.x,
        top: word.y,
        background: palette.bg,
        color: palette.text,
        fontSize: "20px",
        fontWeight: 700,
        padding: "14px 24px",
        borderRadius: "999px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
        whiteSpace: "nowrap",
        zIndex: 2,
        backdropFilter: "blur(2px)",
      }}
      title="Click to save · drag to move"
    >
      {word.text}
    </div>
  );
}
