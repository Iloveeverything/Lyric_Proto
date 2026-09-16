import { useState } from 'react';
import { RefreshCw, GripVertical } from 'lucide-react';
import { colors, font, type } from '../theme';
import { countLineSyllables } from '../utils/syllables';

function IconButton({ icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'transparent',
        border: `2px solid ${colors.border}`,
        color: colors.textMuted,
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: type.sm,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: font.base,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function LineArranger({
  lines,
  onReorder,
  onRephrase,
  onCutUp,
  onEditLine,
  busyIndex,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    const next = [...lines];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved);
    onReorder(next);
    setDragIndex(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.text);
  };

  const commitEdit = (item) => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.text) {
      onEditLine(item.id, {
        text: trimmed,
        syllables: countLineSyllables(trimmed),
        approximate: false,
      });
    }
    setEditingId(null);
  };

  if (lines.length === 0) {
    return (
      <div
        style={{
          color: colors.textFaint,
          fontFamily: font.base,
          fontSize: type.md,
        }}
      >
        Generated lines will appear here — drag them to arrange your song.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {lines.map((item, i) => {
        const onTarget = item.syllables === item.targetSyllables;
        const isEditing = editingId === item.id;

        return (
          <div
            key={item.id}
            draggable={!isEditing}
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            style={{
              background: colors.panelElevated,
              borderRadius: '14px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              opacity: dragIndex === i ? 0.5 : 1,
              cursor: isEditing ? 'text' : 'grab',
            }}
          >
            <GripVertical size={22} color={colors.textFaint} />
            <div style={{ flex: 1 }}>
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(item)}
                  onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: font.base,
                    fontSize: '22px',
                    color: colors.textPrimary,
                  }}
                />
              ) : (
                <div
                  onClick={() => startEdit(item)}
                  title='Click to edit'
                  style={{
                    fontFamily: font.base,
                    fontSize: '22px',
                    color: colors.textPrimary,
                    cursor: 'text',
                  }}
                >
                  {item.text}
                </div>
              )}
              <div
                style={{
                  fontSize: type.sm,
                  color: onTarget ? colors.success : colors.textMuted,
                  fontFamily: font.base,
                  marginTop: '4px',
                }}
              >
                {item.syllables}/{item.targetSyllables} syllables
                {item.approximate ? ' (closest match found)' : ''}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexShrink: 0,
              }}
            >
              <IconButton
                icon={<RefreshCw size={18} />}
                label='Rephrase'
                disabled={busyIndex === i}
                onClick={() => onRephrase(i)}
              />
              <IconButton
                label='Slice'
                disabled={busyIndex === i}
                onClick={() => onCutUp(i)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
