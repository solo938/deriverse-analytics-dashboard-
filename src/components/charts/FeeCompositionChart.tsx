'use client';

import React, { useMemo, useState } from 'react';
import type { Trade } from '@/hooks/useDeriverseData';

interface FeeCompositionChartProps {
  trades: Trade[];
  isLoading?: boolean;
}

type Tab = 'cumulative' | 'breakdown';

function formatUSD(v: number) {
  return `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FeeCompositionChart({ trades, isLoading }: FeeCompositionChartProps) {
  const [tab, setTab] = useState<Tab>('cumulative');

  const data = useMemo(() => {
    if (!trades.length) return null;

    const sorted = [...trades].sort((a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime());

    // Cumulative fees over time
    let cumFee = 0;
    const cumulativePoints = sorted.map(t => {
      cumFee += t.fee;
      return { date: t.openTime.split('T')[0], fee: cumFee, tradeFee: t.fee };
    });

    const totalFees = trades.reduce((s, t) => s + t.fee, 0);
    const totalPnl = trades.reduce((s, t) => s + t.realizedPnl, 0);
    const feeToGrossPct = totalPnl > 0 ? (totalFees / totalPnl) * 100 : 0;
    const avgFeePerTrade = totalFees / trades.length;

    // By symbol
    const bySymbol: Record<string, number> = {};
    for (const t of trades) {
      bySymbol[t.symbol] = (bySymbol[t.symbol] ?? 0) + t.fee;
    }
    const bySymbolSorted = Object.entries(bySymbol).sort(([, a], [, b]) => b - a);
    const maxSymbolFee = bySymbolSorted[0]?.[1] ?? 1;

    // Fee tiers (approximate maker/taker split based on fee size relative to notional)
    let makerFees = 0, takerFees = 0;
    for (const t of trades) {
      const notional = t.entryPrice * t.size;
      const feeRate = notional > 0 ? t.fee / notional : 0;
      if (feeRate < 0.00035) makerFees += t.fee;
      else takerFees += t.fee;
    }

    return { cumulativePoints, totalFees, feeToGrossPct, avgFeePerTrade, bySymbolSorted, maxSymbolFee, makerFees, takerFees };
  }, [trades]);

  if (isLoading) return <SkeletonCard />;
  if (!data) return null;

  const maxCumFee = data.cumulativePoints[data.cumulativePoints.length - 1]?.fee ?? 1;

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
          Fee Analysis
        </span>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', padding: 2, borderRadius: 6 }}>
          {(['cumulative', 'breakdown'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '3px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)',
              background: tab === t ? 'rgba(168,85,247,0.15)' : 'transparent',
              color: tab === t ? '#a855f7' : 'var(--text-muted)',
              border: tab === t ? '1px solid rgba(168,85,247,0.3)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'Total Fees', value: formatUSD(data.totalFees), color: '#a855f7' },
          { label: 'Avg / Trade', value: formatUSD(data.avgFeePerTrade), color: '#f97316' },
          { label: 'Fee/Gross %', value: `${data.feeToGrossPct.toFixed(1)}%`, color: '#22d3ee' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Cumulative chart */}
      {tab === 'cumulative' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative', minHeight: 100, background: 'rgba(168,85,247,0.03)', border: '1px solid rgba(168,85,247,0.1)', borderRadius: 6, padding: '8px 4px 4px' }}>
            <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              {data.cumulativePoints.length > 1 && (() => {
                const pts = data.cumulativePoints;
                const pathD = pts.map((p, i) => {
                  const x = (i / (pts.length - 1)) * 100;
                  const y = 58 - (p.fee / maxCumFee) * 54;
                  return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                }).join(' ');
                const areaD = pathD + ` L100,58 L0,58 Z`;
                return (
                  <>
                    <path d={areaD} fill="url(#feeGrad)" />
                    <path d={pathD} fill="none" stroke="#a855f7" strokeWidth="1.5" />
                  </>
                );
              })()}
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>{data.cumulativePoints[0]?.date?.slice(5)}</span>
            <span>Cumulative fees paid</span>
            <span>{data.cumulativePoints[data.cumulativePoints.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Breakdown by symbol + maker/taker */}
      {tab === 'breakdown' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Maker/taker split */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Maker / Taker Split</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Maker', value: data.makerFees, color: '#a855f7' },
                { label: 'Taker', value: data.takerFees, color: '#f97316' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, padding: '10px', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{formatUSD(value)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                    {data.totalFees > 0 ? ((value / data.totalFees) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By symbol */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Fees by Symbol</div>
            {data.bySymbolSorted.slice(0, 5).map(([symbol, fee]) => (
              <div key={symbol} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{symbol}</span>
                  <span style={{ color: '#a855f7', fontFamily: 'var(--font-mono)' }}>{formatUSD(fee)}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ height: '100%', width: `${(fee / data.maxSymbolFee) * 100}%`, background: 'linear-gradient(90deg, #a855f7, #7c3aed)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
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