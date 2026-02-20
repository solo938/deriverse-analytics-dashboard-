'use client';

import { useCallback } from 'react';

interface FilterState {
  dateFrom: string;
  dateTo: string;
  symbol: string;
  side: 'all' | 'long' | 'short';
}

interface DateSymbolFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableSymbols: string[];
}

/* ── Shared input style ───────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  height: '32px',
  padding: '0 10px',
  borderRadius: '2px',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  outline: 'none',
  transition: 'border-color 0.15s',
};

/* ── Presets ──────────────────────────────────────────────── */
const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: -1 },
] as const;

function getPresetDates(days: number): { from: string; to: string } {
  if (days === -1) return { from: '', to: '' };
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

/* ── Component ────────────────────────────────────────────── */
export default function DateSymbolFilter({
  filters,
  onChange,
  availableSymbols,
}: DateSymbolFilterProps) {
  const update = useCallback(
    (patch: Partial<FilterState>) => onChange({ ...filters, ...patch }),
    [filters, onChange]
  );

  const hasActiveFilters =
    filters.dateFrom || filters.dateTo || filters.symbol || filters.side !== 'all';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '12px 16px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '4px',
    }}>
      {/* Label */}
      <span style={{
        fontSize: '10px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginRight: '4px',
        whiteSpace: 'nowrap',
      }}>
        Filter
      </span>

      {/* Date presets */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderRight: '1px solid var(--border-subtle)',
        paddingRight: '12px',
        marginRight: '4px',
      }}>
        {DATE_PRESETS.map(({ label, days }) => {
          const { from, to } = getPresetDates(days);
          const isActive = days === -1
            ? !filters.dateFrom && !filters.dateTo
            : filters.dateFrom === from && filters.dateTo === to;

          return (
            <button
              key={label}
              onClick={() => update({ dateFrom: from, dateTo: to })}
              style={{
                padding: '3px 10px',
                borderRadius: '2px',
                fontSize: '11px',
                border: '1px solid',
                borderColor: isActive ? 'rgba(0,255,136,0.3)' : 'var(--border-subtle)',
                background: isActive ? 'var(--accent-muted)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '0.5px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Custom date from */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>From</span>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
          style={{
            ...inputStyle,
            width: '136px',
            colorScheme: 'dark',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)'; }}
        />
      </div>

      {/* Custom date to */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>To</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
          style={{
            ...inputStyle,
            width: '136px',
            colorScheme: 'dark',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)'; }}
        />
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

      {/* Symbol filter */}
      <select
        value={filters.symbol}
        onChange={(e) => update({ symbol: e.target.value })}
        style={{
          ...inputStyle,
          width: '140px',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23444466'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: '28px',
        }}
      >
        <option value="">All Markets</option>
        {availableSymbols.map((sym) => (
          <option key={sym} value={sym}>{sym}</option>
        ))}
      </select>

      {/* Side filter */}
      <div style={{ display: 'flex', gap: '0' }}>
        {(['all', 'long', 'short'] as const).map((side, i) => (
          <button
            key={side}
            onClick={() => update({ side })}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              border: '1px solid',
              borderColor: filters.side === side
                ? side === 'long'
                  ? 'rgba(0,255,136,0.4)'
                  : side === 'short'
                  ? 'rgba(255,68,102,0.4)'
                  : 'var(--accent)'
                : 'var(--border-default)',
              background: filters.side === side
                ? side === 'long'
                  ? 'rgba(0,255,136,0.08)'
                  : side === 'short'
                  ? 'rgba(255,68,102,0.08)'
                  : 'var(--accent-muted)'
                : 'var(--bg-elevated)',
              color: filters.side === side
                ? side === 'long'
                  ? 'var(--signal-gain)'
                  : side === 'short'
                  ? 'var(--signal-loss)'
                  : 'var(--accent)'
                : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              borderRadius: i === 0 ? '2px 0 0 2px' : i === 2 ? '0 2px 2px 0' : '0',
              borderLeft: i > 0 ? 'none' : undefined,
              textTransform: 'capitalize',
              letterSpacing: '0.5px',
            }}
          >
            {side === 'all' ? 'All' : side === 'long' ? '▲ Long' : '▼ Short'}
          </button>
        ))}
      </div>

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({ dateFrom: '', dateTo: '', symbol: '', side: 'all' })}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            borderRadius: '2px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--signal-loss)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,68,102,0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
          }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}