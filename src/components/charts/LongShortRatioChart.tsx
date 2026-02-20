'use client';

import React, { useMemo } from 'react';
import type { Trade } from '@/hooks/useDeriverseData';

interface LongShortRatioChartProps {
  trades: Trade[];
  isLoading?: boolean;
}

export default function LongShortRatioChart({ trades, isLoading }: LongShortRatioChartProps) {
  const stats = useMemo(() => {
    if (!trades.length) return null;

    const longs = trades.filter(t => t.side === 'long');
    const shorts = trades.filter(t => t.side === 'short');

    const longPnl = longs.reduce((s, t) => s + (t.realizedPnl - t.fee), 0);
    const shortPnl = shorts.reduce((s, t) => s + (t.realizedPnl - t.fee), 0);
    const longWins = longs.filter(t => (t.realizedPnl - t.fee) > 0).length;
    const shortWins = shorts.filter(t => (t.realizedPnl - t.fee) > 0).length;

    const longPct = Math.round((longs.length / trades.length) * 100);
    const shortPct = 100 - longPct;

    // Bias over last 10 trades
    const last10 = trades.slice(-10);
    const recentLongPct = Math.round((last10.filter(t => t.side === 'long').length / last10.length) * 100);

    return {
      longCount: longs.length,
      shortCount: shorts.length,
      longPct,
      shortPct,
      longPnl,
      shortPnl,
      longWinRate: longs.length ? Math.round((longWins / longs.length) * 100) : 0,
      shortWinRate: shorts.length ? Math.round((shortWins / shorts.length) * 100) : 0,
      recentBias: recentLongPct > 60 ? 'Long Biased' : recentLongPct < 40 ? 'Short Biased' : 'Neutral',
      recentLongPct,
    };
  }, [trades]);

  if (isLoading) return <SkeletonCard />;
  if (!stats) return null;

  const biasColor = stats.recentBias === 'Long Biased'
    ? '#00ff88' : stats.recentBias === 'Short Biased'
    ? '#ff4466' : '#22d3ee';

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
          Long / Short Ratio
        </span>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${biasColor}15`, color: biasColor, border: `1px solid ${biasColor}40`, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>
          {stats.recentBias}
        </span>
      </div>

      {/* Main bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: '#00ff88' }}>▲ Long {stats.longPct}%</span>
          <span style={{ color: '#ff4466' }}>▼ Short {stats.shortPct}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', background: 'rgba(255,68,102,0.3)', display: 'flex' }}>
          <div style={{
            width: `${stats.longPct}%`,
            background: 'linear-gradient(90deg, #00ff88, #00cc6a)',
            transition: 'width 0.6s ease',
            borderRadius: '5px 0 0 5px',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>{stats.longCount} trades</span>
          <span>{stats.shortCount} trades</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Long Win Rate', value: `${stats.longWinRate}%`, color: '#00ff88' },
          { label: 'Short Win Rate', value: `${stats.shortWinRate}%`, color: '#ff4466' },
          { label: 'Long PnL', value: `${stats.longPnl >= 0 ? '+' : ''}$${stats.longPnl.toFixed(0)}`, color: stats.longPnl >= 0 ? '#00ff88' : '#ff4466' },
          { label: 'Short PnL', value: `${stats.shortPnl >= 0 ? '+' : ''}$${stats.shortPnl.toFixed(0)}`, color: stats.shortPnl >= 0 ? '#00ff88' : '#ff4466' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.5px' }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Recent bias indicator */}
      <div style={{ marginTop: 'auto', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.5px' }}>LAST 10 TRADES BIAS</div>
        <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,68,102,0.3)', display: 'flex' }}>
          <div style={{ width: `${stats.recentLongPct}%`, background: '#00ff88', borderRadius: '3px 0 0 3px', transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          <span style={{ color: '#00ff88' }}>Long {stats.recentLongPct}%</span>
          <span style={{ color: '#ff4466' }}>Short {100 - stats.recentLongPct}%</span>
        </div>
      </div>
    </div>
  );
}

const SkeletonCard = () => (
  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[80, 40, 60, 100].map((w, i) => (
      <div key={i} style={{ height: 14, borderRadius: 4, width: `${w}%`, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.5s infinite' }} />
    ))}
    <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
  </div>
);