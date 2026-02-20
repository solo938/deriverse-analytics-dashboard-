'use client';

import React, { useMemo, useState } from 'react';
import type { Trade } from '@/hooks/useDeriverseData';

interface TimePerformanceChartProps {
  trades: Trade[];
  isLoading?: boolean;
}

type Tab = 'daily' | 'session' | 'heatmap';

function getSession(hour: number): string {
  if (hour >= 0 && hour < 8) return 'Asia';
  if (hour >= 8 && hour < 14) return 'London';
  return 'New York';
}

const SESSION_COLORS: Record<string, string> = {
  Asia: '#a855f7',
  London: '#22d3ee',
  'New York': '#f97316',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatUSD(v: number) {
  const abs = Math.abs(v);
  const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
  return v >= 0 ? `+${s}` : `-${s}`;
}

export default function TimePerformanceChart({ trades, isLoading }: TimePerformanceChartProps) {
  const [tab, setTab] = useState<Tab>('daily');

  const data = useMemo(() => {
    if (!trades.length) return null;

    // Daily PnL (last 30 days)
    const dailyMap: Record<string, number> = {};
    const sessionMap: Record<string, { pnl: number; count: number; wins: number }> = {
      Asia: { pnl: 0, count: 0, wins: 0 },
      London: { pnl: 0, count: 0, wins: 0 },
      'New York': { pnl: 0, count: 0, wins: 0 },
    };
    // heatmap: day x hour
    const heatmap: Record<string, number> = {};

    for (const trade of trades) {
      const net = trade.realizedPnl - trade.fee;
      const date = new Date(trade.openTime);
      const day = date.toISOString().split('T')[0];
      const hour = date.getUTCHours();
      const dow = date.getDay();
      const session = getSession(hour);

      dailyMap[day] = (dailyMap[day] ?? 0) + net;
      sessionMap[session].pnl += net;
      sessionMap[session].count++;
      if (net > 0) sessionMap[session].wins++;

      const key = `${dow}-${hour}`;
      heatmap[key] = (heatmap[key] ?? 0) + net;
    }

    // Sort daily last 30
    const dailyEntries = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30);

    const maxDailyAbs = Math.max(...dailyEntries.map(([, v]) => Math.abs(v)), 1);

    return { dailyEntries, maxDailyAbs, sessionMap, heatmap };
  }, [trades]);

  if (isLoading) return <SkeletonCard />;
  if (!data) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'daily', label: 'Daily PnL' },
    { key: 'session', label: 'Session' },
    { key: 'heatmap', label: 'Heatmap' },
  ];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Header + Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
          Time-Based Performance
        </span>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', padding: 2, borderRadius: 6 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 11,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.3px',
              background: tab === t.key ? 'rgba(0,255,136,0.15)' : 'transparent',
              color: tab === t.key ? '#00ff88' : 'var(--text-muted)',
              border: tab === t.key ? '1px solid rgba(0,255,136,0.3)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily PnL bar chart */}
      {tab === 'daily' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, minHeight: 120 }}>
            {data.dailyEntries.map(([date, pnl]) => {
              const h = Math.abs(pnl) / data.maxDailyAbs;
              const isPos = pnl >= 0;
              return (
                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' }} title={`${date}: ${formatUSD(pnl)}`}>
                  <div style={{
                    width: '100%', height: `${Math.max(h * 100, 2)}%`,
                    background: isPos ? 'rgba(0,255,136,0.7)' : 'rgba(255,68,102,0.7)',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.4s ease',
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>{data.dailyEntries[0]?.[0]?.slice(5)}</span>
            <span>Last 30 days</span>
            <span>{data.dailyEntries[data.dailyEntries.length - 1]?.[0]?.slice(5)}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: '#00ff88' }}>▲ Profitable days: {data.dailyEntries.filter(([, v]) => v > 0).length}</span>
            <span style={{ color: '#ff4466' }}>▼ Loss days: {data.dailyEntries.filter(([, v]) => v < 0).length}</span>
          </div>
        </div>
      )}

      {/* Session breakdown */}
      {tab === 'session' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(data.sessionMap).map(([session, s]) => {
            const winRate = s.count ? Math.round((s.wins / s.count) * 100) : 0;
            const color = SESSION_COLORS[session];
            return (
              <div key={session} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}25`, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{session}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {session === 'Asia' ? '00:00–08:00' : session === 'London' ? '08:00–14:00' : '14:00–24:00'} UTC
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.pnl >= 0 ? '#00ff88' : '#ff4466' }}>
                    {formatUSD(s.pnl)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  <span>{s.count} trades</span>
                  <span>Win rate: <span style={{ color }}>{winRate}%</span></span>
                </div>
                <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', width: `${winRate}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Time-of-day heatmap */}
      {tab === 'heatmap' && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.5px' }}>PnL by Day × Hour (UTC)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(24, 1fr)', gap: 2, minWidth: 500 }}>
            {/* Hour labels */}
            <div />
            {HOURS.map(h => (
              <div key={h} style={{ fontSize: 8, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                {h % 6 === 0 ? h : ''}
              </div>
            ))}
            {/* Rows */}
            {DAYS.map((day, dow) => (
              <React.Fragment key={day}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)' }}>{day}</div>
                {HOURS.map(hour => {
                  const val = data.heatmap[`${dow}-${hour}`] ?? 0;
                  const intensity = Math.min(Math.abs(val) / 500, 1);
                  const bg = val > 0
                    ? `rgba(0,255,136,${0.08 + intensity * 0.7})`
                    : val < 0
                    ? `rgba(255,68,102,${0.08 + intensity * 0.7})`
                    : 'rgba(255,255,255,0.03)';
                  return (
                    <div key={hour} title={val !== 0 ? formatUSD(val) : ''} style={{
                      height: 18, borderRadius: 2, background: bg, cursor: val !== 0 ? 'pointer' : 'default',
                      transition: 'opacity 0.2s',
                    }} />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: 'rgba(0,255,136,0.7)', borderRadius: 2, display: 'inline-block' }} /> Profitable</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: 'rgba(255,68,102,0.7)', borderRadius: 2, display: 'inline-block' }} /> Loss</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 2, display: 'inline-block' }} /> No trades</span>
          </div>
        </div>
      )}
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