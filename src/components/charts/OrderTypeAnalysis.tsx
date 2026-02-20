'use client';

import React, { useMemo } from 'react';
import type { Trade } from '@/hooks/useDeriverseData';

interface OrderTypeAnalysisProps {
  trades: Trade[];
  isLoading?: boolean;
}

function formatUSD(v: number) {
  return `${v >= 0 ? '+' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderTypeAnalysis({ trades, isLoading }: OrderTypeAnalysisProps) {
  const data = useMemo(() => {
    if (!trades.length) return null;

    const groups: Record<string, { count: number; pnl: number; wins: number; fees: number }> = {};

    for (const t of trades) {
      // Infer order type from fee rate relative to notional
      const notional = t.entryPrice * t.size;
      const feeRate = notional > 0 ? t.fee / notional : 0;
      const orderType = feeRate < 0.00035 ? 'Limit' : 'Market';
      const net = t.realizedPnl - t.fee;

      if (!groups[orderType]) groups[orderType] = { count: 0, pnl: 0, wins: 0, fees: 0 };
      groups[orderType].count++;
      groups[orderType].pnl += net;
      groups[orderType].fees += t.fee;
      if (net > 0) groups[orderType].wins++;
    }

    const entries = Object.entries(groups).map(([type, s]) => ({
      type,
      count: s.count,
      pnl: s.pnl,
      fees: s.fees,
      winRate: s.count ? Math.round((s.wins / s.count) * 100) : 0,
      avgPnl: s.count ? s.pnl / s.count : 0,
      pct: Math.round((s.count / trades.length) * 100),
    })).sort((a, b) => b.count - a.count);

    // PnL per trade comparison
    const maxAbsAvgPnl = Math.max(...entries.map(e => Math.abs(e.avgPnl)), 1);

    return { entries, maxAbsAvgPnl };
  }, [trades]);

  if (isLoading) return <SkeletonCard />;
  if (!data) return null;

  const TYPE_COLORS: Record<string, string> = {
    Limit: '#22d3ee',
    Market: '#f97316',
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
          Order Type Performance
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {trades.length} trades
        </span>
      </div>

      {/* Type cards */}
      {data.entries.map(entry => {
        const color = TYPE_COLORS[entry.type] ?? '#94a3b8';
        return (
          <div key={entry.type} style={{ padding: '14px 16px', background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{entry.type}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{entry.pct}% of trades</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: entry.pnl >= 0 ? '#00ff88' : '#ff4466', fontFamily: 'var(--font-mono)' }}>
                {formatUSD(entry.pnl)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
              {[
                { label: 'Trades', value: entry.count },
                { label: 'Win Rate', value: `${entry.winRate}%` },
                { label: 'Avg PnL', value: formatUSD(entry.avgPnl) },
                { label: 'Total Fees', value: `$${entry.fees.toFixed(0)}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Win rate bar */}
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ height: '100%', width: `${entry.winRate}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        );
      })}

      {/* Usage ratio bar */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>Order Mix</div>
        <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
          {data.entries.map((entry, i) => (
            <div key={entry.type} style={{
              width: `${entry.pct}%`,
              background: TYPE_COLORS[entry.type] ?? '#94a3b8',
              borderRadius: i === 0 ? '4px 0 0 4px' : i === data.entries.length - 1 ? '0 4px 4px 0' : 0,
              transition: 'width 0.5s ease',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          {data.entries.map(entry => (
            <span key={entry.type} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: TYPE_COLORS[entry.type] ?? '#94a3b8' }}>
              {entry.type} {entry.pct}%
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const SkeletonCard = () => (
  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[100, 60, 80, 40, 90].map((w, i) => (
      <div key={i} style={{ height: 14, borderRadius: 4, width: `${w}%`, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.5s infinite' }} />
    ))}
    <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
  </div>
);