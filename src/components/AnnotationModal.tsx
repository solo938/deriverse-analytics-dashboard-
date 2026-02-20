'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Trade } from '@/hooks/useDeriverseData';

interface AnnotationModalProps {
  trade: Trade;
  onClose: () => void;
  onSave: (note: string) => void;
}

/* ── Tag suggestions ──────────────────────────────────────── */
const QUICK_TAGS = [
  'FOMO entry',
  'Good setup',
  'Revenge trade',
  'Planned entry',
  'Early exit',
  'Late entry',
  'Perfect execution',
  'Rule violation',
  'High conviction',
  'Scalp',
];

const MAX_NOTE_LENGTH = 500;

/* ── Component ────────────────────────────────────────────── */
export default function AnnotationModal({ trade, onClose, onSave }: AnnotationModalProps) {
  const [note, setNote] = useState(trade.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  /* Focus textarea on mount */
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Simulate async save (replace with actual persistence)
    await new Promise((r) => setTimeout(r, 300));
    onSave(note.trim());
    setIsSaving(false);
  }, [note, onSave]);

  const appendTag = (tag: string) => {
    const prefix = note.trim() ? `${note.trim()} ` : '';
    setNote(`${prefix}#${tag.replace(/\s+/g, '_')}`);
    textareaRef.current?.focus();
  };

  const pnlNet = trade.realizedPnl - trade.fee;
  const isWin = pnlNet > 0;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          animation: 'slideUp 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: '0.3px',
            }}>
              Trade Note
            </span>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              #{trade.id.slice(-8)}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '2px',
              color: 'var(--text-muted)',
              border: '1px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Trade summary ──────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px',
          background: 'var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
        }}>
          {[
            { label: 'Symbol', value: trade.symbol },
            {
              label: 'Side',
              value: trade.side.toUpperCase(),
              color: trade.side === 'long' ? 'var(--signal-gain)' : 'var(--signal-loss)',
            },
            { label: 'Leverage', value: `${trade.leverage}×` },
            {
              label: 'Net PnL',
              value: `${isWin ? '+' : ''}$${pnlNet.toFixed(2)}`,
              color: isWin ? 'var(--signal-gain)' : 'var(--signal-loss)',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: 'var(--bg-elevated)',
                padding: '10px 14px',
              }}
            >
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '3px' }}>
                {label}
              </div>
              <div style={{ color: color ?? 'var(--text-primary)', fontWeight: 500 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Note input ─────────────────────────────────── */}
        <div style={{ padding: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <label style={{
              fontSize: '10px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>
              Note
            </label>
            <span style={{
              fontSize: '10px',
              color: note.length > MAX_NOTE_LENGTH * 0.8
                ? 'var(--signal-warn)'
                : 'var(--text-muted)',
            }}>
              {note.length}/{MAX_NOTE_LENGTH}
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => {
              if (e.target.value.length <= MAX_NOTE_LENGTH) setNote(e.target.value);
            }}
            placeholder="What happened? Entry thesis, mistakes, lessons learned..."
            rows={5}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(0,255,136,0.3)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)'; }}
          />

          {/* Quick tags */}
          <div style={{ marginTop: '12px' }}>
            <div style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Quick tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => appendTag(tag)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                    letterSpacing: '0.3px',
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget;
                    btn.style.borderColor = 'rgba(0,255,136,0.3)';
                    btn.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget;
                    btn.style.borderColor = 'var(--border-default)';
                    btn.style.color = 'var(--text-secondary)';
                  }}
                >
                  #{tag.replace(/\s+/g, '_')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            ⌘+Enter to save · Esc to close
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '2px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '6px 18px',
                borderRadius: '2px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
                color: '#000',
                background: isSaving ? 'var(--accent-dim)' : 'var(--accent)',
                border: '1px solid var(--accent)',
                cursor: isSaving ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isSaving ? 'none' : '0 0 16px rgba(0,255,136,0.2)',
              }}
            >
              {isSaving ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    border: '2px solid #000',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Saving...
                </>
              ) : (
                '✓ Save Note'
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}