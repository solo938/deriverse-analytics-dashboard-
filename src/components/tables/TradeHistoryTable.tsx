'use client';

import React, { useState, useMemo, useCallback } from 'react';
// ✅ Import Trade from useDeriverseData — matches what the dashboard passes in
// Fields: symbol, realizedPnl, fee, openTime, closeTime (vs lib/types: asset, pnl, openedAt, closedAt)
import type { Trade } from '@/hooks/useDeriverseData';
import { useFilterStore } from '../../stores/filterStore';
import { calculateTradeFees } from '../../lib/calculations/fees';

// ─── Icons ────────────────────────────────────────────────────────────────────

const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | null }) => (
  <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4, opacity: direction ? 1 : 0.3 }}>
    <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
      <path d="M4 0L8 5H0L4 0Z" fill={direction === 'asc' ? '#22d3ee' : 'currentColor'} />
    </svg>
    <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ marginTop: 1 }}>
      <path d="M4 5L0 0H8L4 5Z" fill={direction === 'desc' ? '#22d3ee' : 'currentColor'} />
    </svg>
  </span>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="12" height="12" viewBox="0 0 12 12" fill="none"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
  >
    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(value: number): string {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(abs);
  return value < 0 ? `-${formatted}` : formatted;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatSize(size: number): string {
  return size.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

function formatLeverage(leverage: number): string {
  return `${leverage}×`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Badge = ({
  label,
  variant,
}: {
  label: string;
  // ✅ Removed 'open' | 'closed' | 'liquidated' | 'maker' | 'taker' — useDeriverseData Trade has no status field
  variant: 'long' | 'short' | 'neutral';
}) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    long:    { bg: 'rgba(34,197,94,0.1)',   text: '#22c55e', border: 'rgba(34,197,94,0.3)' },
    short:   { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    neutral: { bg: 'rgba(100,116,139,0.1)', text: '#64748b', border: 'rgba(100,116,139,0.3)' },
  };
  const c = colors[variant] ?? colors.neutral;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    }}>
      {label}
    </span>
  );
};

const PnLCell = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  const isZero = value === 0;
  return (
    <span style={{
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontWeight: 600, fontSize: 13,
      color: isZero ? '#64748b' : isPositive ? '#22c55e' : '#ef4444',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {!isZero && <span style={{ fontSize: 10 }}>{isPositive ? '▲' : '▼'}</span>}
      {formatUSD(value)}
    </span>
  );
};

// ─── Expanded Row ─────────────────────────────────────────────────────────────

const ExpandedRow = ({ trade }: { trade: Trade }) => {
  const fees = calculateTradeFees(trade);
  // ✅ openedAt → openTime, closedAt → closeTime
  const duration = trade.closeTime
    ? (() => {
        const ms = new Date(trade.closeTime).getTime() - new Date(trade.openTime).getTime();
        const h = Math.floor(ms / 3_600_000);
        const m = Math.floor((ms % 3_600_000) / 60_000);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      })()
    : '—';

  const row = (label: string, value: string, highlight?: boolean) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
      <span style={{
        fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
        color: highlight ? '#22d3ee' : '#e2e8f0', fontWeight: highlight ? 600 : 400,
      }}>{value}</span>
    </div>
  );

  return (
    <tr>
      <td colSpan={8} style={{ padding: 0 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
          background: 'rgba(15,23,42,0.6)',
          borderTop: '1px solid rgba(34,211,238,0.1)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '12px 24px',
        }}>
          {/* Trade Details */}
          <div style={{ padding: '0 16px 0 0', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', marginBottom: 8, textTransform: 'uppercase' }}>Trade Details</div>
            {row('Trade ID', `#${trade.id.slice(0, 8)}...`)}
            {row('Duration', duration)}
            {/* ✅ Removed orderType, isMaker, isLiquidated, referredBy — not on this Trade type */}
            {trade.notes && row('Note', trade.notes)}
          </div>

          {/* Price Info */}
          <div style={{ padding: '0 16px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', marginBottom: 8, textTransform: 'uppercase' }}>Price Info</div>
            {row('Entry Price', `$${trade.entryPrice.toLocaleString()}`)}
            {row('Exit Price', trade.exitPrice ? `$${trade.exitPrice.toLocaleString()}` : '—')}
            {trade.markPrice != null && row('Mark Price', `$${trade.markPrice.toLocaleString()}`)}
            {row('Size', formatSize(trade.size))}
            {row('Leverage', formatLeverage(trade.leverage))}
            {row('Notional', formatUSD(trade.entryPrice * trade.size))}
          </div>

          {/* Fee Breakdown */}
          <div style={{ padding: '0 0 0 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', marginBottom: 8, textTransform: 'uppercase' }}>Fee Breakdown</div>
            {row('Base Fee', formatUSD(fees.baseFee))}
            {fees.referralDiscount > 0 && row('Referral Discount', `-${formatUSD(fees.referralDiscount)}`, true)}
            {fees.fundingFee !== 0 && row('Funding Fee', formatUSD(fees.fundingFee))}
            {fees.liquidationFee > 0 && row('Liquidation Fee', formatUSD(fees.liquidationFee))}
            {row('Net Fee Paid', formatUSD(fees.netFee))}
            {row('Total Fee', formatUSD(fees.totalFee))}
          </div>
        </div>
      </td>
    </tr>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({
  page, totalPages, onPage,
}: {
  page: number; totalPages: number; onPage: (p: number) => void;
}) => {
  const btnStyle = (active: boolean, disabled: boolean): React.CSSProperties => ({
    padding: '4px 10px', borderRadius: 4,
    border: active ? '1px solid rgba(34,211,238,0.5)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(34,211,238,0.1)' : 'transparent',
    color: active ? '#22d3ee' : disabled ? '#334155' : '#94a3b8',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: '"JetBrains Mono", monospace', fontSize: 12, minWidth: 32,
    textAlign: 'center', transition: 'all 0.15s ease',
  });

  const pages = useMemo(() => {
    const p: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) p.push(i);
    } else {
      p.push(1);
      if (page > 3) p.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) p.push(i);
      if (page < totalPages - 2) p.push('...');
      p.push(totalPages);
    }
    return p;
  }, [page, totalPages]);

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <button style={btnStyle(false, page === 1)} onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`ellipsis-${i}`} style={{ color: '#475569', padding: '0 4px', fontSize: 12 }}>…</span>
          : <button key={p} style={btnStyle(p === page, false)} onClick={() => onPage(p as number)}>{p}</button>
      )}
      <button style={btnStyle(false, page === totalPages)} onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</button>
    </div>
  );
};

// ─── Column Definitions ───────────────────────────────────────────────────────

type ColKey = keyof Trade | 'fees' | 'expand';

interface Column {
  key: ColKey;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'right' | 'center';
}

// ✅ asset → symbol, pnl → realizedPnl, openedAt → openTime, removed status column
const COLUMNS: Column[] = [
  { key: 'expand',      label: '',       width: '32px',  align: 'center' },
  { key: 'symbol',      label: 'Asset',  sortable: true, width: '100px' },
  { key: 'side',        label: 'Side',   sortable: true, width: '80px',  align: 'center' },
  { key: 'openTime',    label: 'Opened', sortable: true, width: '140px' },
  { key: 'entryPrice',  label: 'Entry',  sortable: true, width: '110px', align: 'right' },
  { key: 'size',        label: 'Size',   sortable: true, width: '90px',  align: 'right' },
  { key: 'realizedPnl', label: 'PnL',    sortable: true, width: '120px', align: 'right' },
  { key: 'fees',        label: 'Fees',   width: '100px', align: 'right' },
];

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ hasFilters }: { hasFilters: boolean }) => (
  <tr>
    <td colSpan={8}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
        <div style={{ fontSize: 32, opacity: 0.2 }}>📭</div>
        <div style={{ color: '#475569', fontSize: 14, fontWeight: 500 }}>
          {hasFilters ? 'No trades match your filters' : 'No trade history yet'}
        </div>
        <div style={{ color: '#334155', fontSize: 12 }}>
          {hasFilters ? 'Try adjusting your filters' : 'Your completed trades will appear here'}
        </div>
      </div>
    </td>
  </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface TradeHistoryTableProps {
  trades: Trade[];
  isLoading?: boolean;
  pageSize?: number;
  onAnnotate?: (trade: Trade) => void;
  className?: string;
}

export const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({
  trades,
  isLoading = false,
  pageSize = 20,
  onAnnotate,
  className,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const { applyFilters, sortBy, sortDirection, toggleSort, getActiveFilterCount } = useFilterStore();

  const filtered = useMemo(() => applyFilters(trades), [trades, applyFilters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const toggleRow = useCallback((id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSort = useCallback((col: Column) => {
    if (!col.sortable || col.key === 'fees' || col.key === 'expand') return;
    toggleSort(col.key as keyof Trade);
    setPage(1);
  }, [toggleSort]);

  const activeFilters = getActiveFilterCount();
  const hasFilters = activeFilters > 0;

  const containerStyle: React.CSSProperties = {
    fontFamily: '"Inter", "DM Sans", system-ui, sans-serif',
    background: 'linear-gradient(180deg, #0d1526 0%, #080f1e 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12, overflow: 'hidden',
  };

  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' };

  const thStyle = (col: Column): React.CSSProperties => ({
    padding: '10px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: '#475569', textAlign: col.align ?? 'left',
    width: col.width, cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
    transition: 'color 0.15s ease', whiteSpace: 'nowrap',
  });

  const tdStyle = (align?: 'left' | 'right' | 'center'): React.CSSProperties => ({
    padding: '10px 12px', fontSize: 13, color: '#cbd5e1', textAlign: align ?? 'left',
    borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  });

  const trStyle = (expanded: boolean): React.CSSProperties => ({
    background: expanded ? 'rgba(34,211,238,0.03)' : 'transparent',
    transition: 'background 0.15s ease', cursor: 'pointer',
  });

  if (isLoading) {
    return (
      <div style={containerStyle} className={className}>
        <table style={tableStyle}>
          <thead>
            <tr>{COLUMNS.map(col => <th key={String(col.key)} style={thStyle(col)}>{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                {COLUMNS.map(col => (
                  <td key={String(col.key)} style={tdStyle(col.align)}>
                    <div style={{
                      height: 14, borderRadius: 4,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                      backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
                      width: `${40 + Math.random() * 50}%`,
                    }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Trade History</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,211,238,0.08)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)', fontFamily: '"JetBrains Mono", monospace' }}>
            {filtered.length} trades
          </span>
          {hasFilters && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(168,85,247,0.08)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)', fontFamily: '"JetBrains Mono", monospace' }}>
              {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#475569' }}>Page {page} of {totalPages}</div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th key={String(col.key)} style={thStyle(col)} onClick={() => handleSort(col)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {col.label}
                    {col.sortable && <SortIcon direction={sortBy === col.key ? sortDirection : null} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0
              ? <EmptyState hasFilters={hasFilters} />
              : paginated.map(trade => {
                  const expanded = expandedRows.has(trade.id);
                  const fees = calculateTradeFees(trade);
                  // ✅ pnl → realizedPnl - fee (net PnL)
                  const netPnl = trade.realizedPnl - trade.fee;

                  return (
                    <React.Fragment key={trade.id}>
                      <tr
                        style={trStyle(expanded)}
                        onClick={() => toggleRow(trade.id)}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = expanded ? 'rgba(34,211,238,0.05)' : 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = expanded ? 'rgba(34,211,238,0.03)' : 'transparent'; }}
                      >
                        <td style={{ ...tdStyle('center'), color: '#475569' }}>
                          <ChevronIcon open={expanded} />
                        </td>

                        {/* ✅ asset → symbol */}
                        <td style={tdStyle('left')}>
                          <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 13 }}>{trade.symbol}</span>
                          <span style={{ color: '#475569', fontSize: 11, marginLeft: 4 }}>{formatLeverage(trade.leverage)}</span>
                        </td>

                        <td style={tdStyle('center')}>
                          <Badge label={trade.side} variant={trade.side === 'long' ? 'long' : 'short'} />
                        </td>

                        {/* ✅ openedAt → openTime */}
                        <td style={{ ...tdStyle('left'), color: '#64748b', fontSize: 12 }}>
                          {formatDate(trade.openTime)}
                        </td>

                        <td style={{ ...tdStyle('right'), fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>
                          ${trade.entryPrice.toLocaleString()}
                        </td>

                        <td style={{ ...tdStyle('right'), fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#94a3b8' }}>
                          {formatSize(trade.size)}
                        </td>

                        {/* ✅ trade.pnl → netPnl */}
                        <td style={tdStyle('right')}>
                          <PnLCell value={netPnl} />
                        </td>

                        <td style={{ ...tdStyle('right'), fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#64748b' }}>
                          {formatUSD(fees.totalFee)}
                          {onAnnotate && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onAnnotate(trade); }}
                              style={{
                                marginLeft: 8, padding: '2px 6px', borderRadius: 3, fontSize: 10,
                                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                                color: '#475569', cursor: 'pointer', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)'; e.currentTarget.style.color = '#00ff88'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#475569'; }}
                            >
                              + note
                            </button>
                          )}
                        </td>
                      </tr>

                      {expanded && <ExpandedRow trade={trade} />}
                    </React.Fragment>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 11, color: '#475569' }}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      )}
    </div>
  );
};

export default TradeHistoryTable;