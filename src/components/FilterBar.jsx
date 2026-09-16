import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Search, Settings } from 'lucide-react';
import { colors, font, type, sourceColors, inputStyle } from '../theme';
import {
  fetchIdioms,
  fetchSlang,
  fetchPartOfSpeech,
  fetchNews,
  fetchThemeWordBank,
  fetchArtistWordBank,
  MUSIC_THEMES,
} from '../utils/wordSources';
import PromptSettingsModal from './PromptSettingsModal';

function FilterButton({ label, onClick, loading, accentColor }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        background: `${accentColor}1A`,
        color: accentColor,
        border: `2px solid ${accentColor}55`,
        borderRadius: '999px',
        padding: '10px 18px',
        fontSize: type.sm,
        fontWeight: 600,
        fontFamily: font.base,
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.6 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {loading && <Loader2 size={16} className='animate-spin' />}
      {label}
    </button>
  );
}

function ThemesButton({ loading, onSelect }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const accentColor = colors.accent;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <FilterButton
        label='Themes'
        loading={loading}
        accentColor={accentColor}
        onClick={() => setOpen((prev) => !prev)}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            background: colors.panelElevated,
            border: `2px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '8px',
            zIndex: 20,
            minWidth: '180px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
          }}
        >
          {MUSIC_THEMES.map((themeName) => (
            <div
              key={themeName}
              onClick={() => {
                setOpen(false);
                onSelect(themeName);
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                color: colors.textPrimary,
                fontSize: type.sm,
                fontFamily: font.base,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = colors.accentSoft)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              {themeName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({
  onSpawn,
  onSpawnTyped,
  onClear,
  loading,
  setLoading,
}) {
  const [artistName, setArtistName] = useState('');
  const [promptsOpen, setPromptsOpen] = useState(false);

  const run = async (key, fn) => {
    setLoading(key);
    const words = await fn();
    onSpawn(words, key);
    setLoading(null);
  };

  const runTyped = async (key, fn) => {
    setLoading(key);
    const items = await fn();
    onSpawnTyped(items);
    setLoading(null);
  };

  const submitArtist = () => {
    if (artistName.trim() && loading !== 'artist') {
      runTyped('artist', () => fetchArtistWordBank(artistName));
    }
  };

  const nounColor = sourceColors.noun.text;
  const verbColor = sourceColors.verb.text;
  const adjColor = sourceColors.adjective.text;
  const phraseColor = sourceColors.phrase.text;
  const slangColor = sourceColors.slang.text;
  const newsColor = sourceColors.news.text;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        rowGap: '12px',
        columnGap: '24px',
        padding: '16px 24px',
        background: colors.panel,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <ThemesButton
          loading={loading === 'theme'}
          onSelect={(themeName) =>
            runTyped('theme', () => fetchThemeWordBank(themeName))
          }
        />

        <div
          style={{
            width: 1,
            height: '26px',
            background: colors.border,
            margin: '0 4px',
          }}
        />

        <FilterButton
          label='Noun'
          loading={loading === 'noun'}
          accentColor={nounColor}
          onClick={() => run('noun', () => fetchPartOfSpeech('noun'))}
        />
        <FilterButton
          label='Verb'
          loading={loading === 'verb'}
          accentColor={verbColor}
          onClick={() => run('verb', () => fetchPartOfSpeech('verb'))}
        />
        <FilterButton
          label='Adjective'
          loading={loading === 'adjective'}
          accentColor={adjColor}
          onClick={() => run('adjective', () => fetchPartOfSpeech('adjective'))}
        />
        <FilterButton
          label='Phrase'
          loading={loading === 'phrase'}
          accentColor={phraseColor}
          onClick={() => run('phrase', fetchIdioms)}
        />
        <FilterButton
          label='Slang'
          loading={loading === 'slang'}
          accentColor={slangColor}
          onClick={() => run('slang', fetchSlang)}
        />
        <FilterButton
          label='World'
          loading={loading === 'news'}
          accentColor={newsColor}
          onClick={() => run('news', fetchNews)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: '999px',
            padding: '4px 4px 4px 16px',
          }}
        >
          <span
            style={{
              color: colors.textFaint,
              fontSize: type.sm,
              fontFamily: font.base,
              whiteSpace: 'nowrap',
              marginRight: '10px',
            }}
          >
            Learn from
          </span>
          <input
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitArtist()}
            placeholder='Enter Artist Name'
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: colors.textPrimary,
              fontSize: type.sm,
              fontFamily: font.base,
              width: '160px',
            }}
          />
          <button
            onClick={submitArtist}
            disabled={loading === 'artist' || !artistName.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: colors.accentSoft,
              border: 'none',
              borderRadius: '999px',
              width: '34px',
              height: '34px',
              color: colors.textPrimary,
              cursor: loading === 'artist' ? 'default' : 'pointer',
              opacity: !artistName.trim() ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {loading === 'artist' ? (
              <Loader2 size={15} className='animate-spin' />
            ) : (
              <Search size={15} />
            )}
          </button>
        </div>

        <button
          onClick={() => setPromptsOpen(true)}
          title='Edit the AI prompts used for Slang and Phrase'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            color: colors.textFaint,
            border: `2px solid ${colors.border}`,
            borderRadius: '999px',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Settings size={17} />
        </button>

        <button
          onClick={onClear}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'transparent',
            color: colors.textMuted,
            border: `2px solid ${colors.border}`,
            borderRadius: '999px',
            padding: '10px 16px',
            fontSize: type.sm,
            fontFamily: font.base,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Clear
        </button>
      </div>

      {promptsOpen && (
        <PromptSettingsModal onClose={() => setPromptsOpen(false)} />
      )}
    </div>
  );
}
