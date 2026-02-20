'use client';

import React, { useMemo } from 'react';
import type { Trade } from '@/hooks/useDeriverseData';

interface GainLossTrackerProps {
  trades: Trade[];
  isLoading?: boolean;
}

function formatUSD(v: number) {
  return `${v >= 0 ? '+' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function GainLossTracker({ trades, isLoading }: GainLossTrackerProps) {
  const stats = useMemo(() => {
    if (!trades.length) return null;

    const withPnl = trades.map(t => ({ ...t, netPnl: t.realizedPnl - t.fee }));
    const sorted = [...withPnl].sort((a, b) => b.netPnl - a.netPnl);

    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    // Win/loss streaks
    let maxWinStreak = 0, maxLossStreak = 0;
    let curWin = 0, curLoss = 0;
    for (const t of withPnl) {
      if (t.netPnl > 0) { curWin++; curLoss = 0; maxWinStreak = Math.max(maxWinStreak, curWin); }
      else { curLoss++; curWin = 0; maxLossStreak = Math.max(maxLossStreak, curLoss); }
    }

    // Current streak
    let currentStreak = 0;
    let streakType: 'win' | 'loss' = 'win';
    for (let i = withPnl.length - 1; i >= 0; i--) {
      if (i === withPnl.length - 1) {
        streakType = withPnl[i].netPnl > 0 ? 'win' : 'loss';
        currentStreak = 1;
      } else if ((withPnl[i].netPnl > 0) === (streakType === 'win')) {
        currentStreak++;
      } else break;
    }

    // Top 3 best and worst
    const top3Best = sorted.slice(0, 3);
    const top3Worst = sorted.slice(-3).reverse();

    return { best, worst, maxWinStreak, maxLossStreak, currentStreak, streakType, top3Best, top3Worst };
  }, [trades]);

  if (isLoading) return <SkeletonCard />;
  if (!stats) return null;

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
          Gain / Loss Tracker
        </span>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 4,
          background: stats.streakType === 'win' ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,102,0.1)',
          color: stats.streakType === 'win' ? '#00ff88' : '#ff4466',
          border: `1px solid ${stats.streakType === 'win' ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,102,0.3)'}`,
          fontFamily: 'var(--font-mono)',
        }}>
          {stats.currentStreak} {stats.streakType === 'win' ? '🔥' : '❄️'} streak
        </span>
      </div>

      {/* Best / Worst single trade */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '12px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.5px' }}>BEST TRADE</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#00ff88', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            {formatUSD(stats.best.netPnl)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {stats.best.symbol} · {formatDate(stats.best.openTime)}
          </div>
        </div>
        <div style={{ padding: '12px', background: 'rgba(255,68,102,0.04)', border: '1px solid rgba(255,68,102,0.15)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.5px' }}>WORST TRADE</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#ff4466', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            {formatUSD(stats.worst.netPnl)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {stats.worst.symbol} · {formatDate(stats.worst.openTime)}
          </div>
        </div>
      </div>

      {/* Streak stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.5px' }}>MAX WIN STREAK</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#00ff88', fontFamily: 'var(--font-mono)' }}>{stats.maxWinStreak}🔥</div>
        </div>
        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.5px' }}>MAX LOSS STREAK</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4466', fontFamily: 'var(--font-mono)' }}>{stats.maxLossStreak}❄️</div>
        </div>
      </div>

      {/* Top 3 best trades */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Top 3 Trades</div>
        {stats.top3Best.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 16 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.symbol}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#00ff88', fontFamily: 'var(--font-mono)' }}>{formatUSD(t.netPnl)}</span>
          </div>
        ))}
      </div>

      {/* Top 3 worst trades */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Worst 3 Trades</div>
        {stats.top3Worst.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', width: 16 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.symbol}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ff4466', fontFamily: 'var(--font-mono)' }}>{formatUSD(t.netPnl)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SkeletonCard = () => (
  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[80, 40, 60, 100, 70].map((w, i) => (
      <div key={i} style={{ height: 14, borderRadius: 4, width: `${w}%`, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.5s infinite' }} />
    ))}
    <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
  </div>
);