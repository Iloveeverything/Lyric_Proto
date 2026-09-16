import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { colors, inputStyle, buttonPrimaryStyle, font, type } from '../theme';
import { useCollections } from '../state/CollectionsContext';
import { generateLyricLine, rephraseLine } from '../utils/ollama';
import { countLineSyllables } from '../utils/syllables';
import LineArranger from './LineArranger';

let lineIdCounter = 1;
const nextLineId = () => lineIdCounter++;

const CONNECTION_ERROR =
  "Couldn't reach a local Ollama server at localhost:11434. Run `ollama serve` with phi4-mini pulled and available.";

export default function ActionWorkspace({
  sourceCollectionId,
  setSourceCollectionId,
}) {
  const { collections } = useCollections();
  const [syllables, setSyllables] = useState(8);
  const [lastWord, setLastWord] = useState('');
  const [lines, setLines] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [busyIndex, setBusyIndex] = useState(null);
  const [error, setError] = useState(null);

  const sourceCollection = collections.find((c) => c.id === sourceCollectionId);
  const sourceWords = sourceCollection
    ? sourceCollection.words.map((w) => w.text)
    : [];

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateLyricLine({
        sourceWords,
        syllables,
        lastWord,
        avoidLines: lines.map((l) => l.text),
      });
      setLines((prev) => [
        ...prev,
        {
          id: nextLineId(),
          text: result.line,
          syllables: result.syllables,
          targetSyllables: Number(syllables) || 8,
          approximate: result.approximate,
        },
      ]);
    } catch (e) {
      setError(CONNECTION_ERROR);
    }
    setGenerating(false);
  };

  const handleRephrase = async (index) => {
    setBusyIndex(index);
    setError(null);
    try {
      const item = lines[index];
      const result = await rephraseLine({
        line: item.text,
        sourceWords,
        syllables: item.targetSyllables,
      });
      setLines((prev) =>
        prev.map((l, i) =>
          i === index
            ? {
                ...l,
                text: result.line,
                syllables: result.syllables,
                approximate: false,
              }
            : l,
        ),
      );
    } catch (e) {
      setError(CONNECTION_ERROR);
    }
    setBusyIndex(null);
  };

  const handleCutUp = (index) => {
    const item = lines[index];
    const words = item.text.split(' ');
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    const newText = words.join(' ');
    setLines((prev) =>
      prev.map((l, i) =>
        i === index
          ? { ...l, text: newText, syllables: countLineSyllables(newText) }
          : l,
      ),
    );
  };

  const handleEditLine = (id, updates) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '32px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '18px',
          flexWrap: 'wrap',
          marginBottom: '26px',
          alignItems: 'flex-end',
        }}
      >
        <Field label='Source collection'>
          <select
            value={sourceCollectionId || ''}
            onChange={(e) => setSourceCollectionId(e.target.value)}
            style={{ ...inputStyle, minWidth: '180px' }}
          >
            <option value=''>Select a collection…</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.words.length})
              </option>
            ))}
          </select>
        </Field>
        <Field label='Syllable count'>
          <input
            type='number'
            min={1}
            value={syllables}
            onChange={(e) => setSyllables(e.target.value)}
            style={{ ...inputStyle, width: '110px' }}
          />
        </Field>
        <Field label='Last word'>
          <input
            value={lastWord}
            onChange={(e) => setLastWord(e.target.value)}
            placeholder='optional'
            style={{ ...inputStyle, width: '170px' }}
          />
        </Field>
        <button
          onClick={generate}
          disabled={generating || !sourceCollectionId}
          style={{
            ...buttonPrimaryStyle,
            opacity: generating || !sourceCollectionId ? 0.6 : 1,
          }}
        >
          {generating ? (
            <Loader2 size={15} className='animate-spin' />
          ) : (
            <Sparkles size={15} />
          )}
          Generate line
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(224,106,106,0.1)',
            border: `1px solid ${colors.danger}55`,
            color: colors.danger,
            padding: '14px 18px',
            borderRadius: '12px',
            fontSize: type.md,
            marginBottom: '20px',
            fontFamily: font.base,
          }}
        >
          {error}
        </div>
      )}

      <LineArranger
        lines={lines}
        onReorder={setLines}
        onRephrase={handleRephrase}
        onCutUp={handleCutUp}
        onEditLine={handleEditLine}
        busyIndex={busyIndex}
      />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: type.sm,
          fontWeight: 600,
          color: colors.textMuted,
          marginBottom: '7px',
          fontFamily: font.base,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
