'use client';

import React from 'react';
import type { DashboardMetrics } from '@/hooks/useDeriverseData';

interface RiskMetricsPanelProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
}

function SkeletonBar({ width }: { width: string }) {
  return (
    <div style={{ height: 13, borderRadius: 3, width, background: 'rgba(255,255,255,0.06)', animation: 'shimmer 1.5s infinite' }} />
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  subtext: string;
  color: string;
  bar?: number; // 0-1 fill
  barColor?: string;
  tooltip: string;
}

function MetricRow({ label, value, subtext, color, bar, barColor, tooltip }: MetricRowProps) {
  return (
    <div title={tooltip} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'help' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{label}</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 6, opacity: 0.6 }}>ⓘ</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{value}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>{subtext}</span>
        </div>
      </div>
      {bar !== undefined && (
        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 4 }}>
          <div style={{
            height: '100%',
            width: `${Math.min(bar * 100, 100)}%`,
            background: barColor ?? color,
            borderRadius: 2,
            transition: 'width 0.6s ease',
          }} />
        </div>
      )}
    </div>
  );
}

export default function RiskMetricsPanel({ metrics, isLoading }: RiskMetricsPanelProps) {
  if (isLoading) {
    return (
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletonBar width="60%" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SkeletonBar width="40%" />
            <SkeletonBar width="25%" />
          </div>
        ))}
        <style>{`@keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  // ── Derive color ratings ────────────────────────────────────────────────────

  const sharpeColor = metrics.sharpeRatio > 2 ? '#00ff88' : metrics.sharpeRatio > 1 ? '#22d3ee' : metrics.sharpeRatio > 0 ? '#f97316' : '#ff4466';
  const sortinoColor = metrics.sortinoRatio > 2 ? '#00ff88' : metrics.sortinoRatio > 1 ? '#22d3ee' : metrics.sortinoRatio > 0 ? '#f97316' : '#ff4466';
  const calmarColor = metrics.calmarRatio > 3 ? '#00ff88' : metrics.calmarRatio > 1 ? '#22d3ee' : metrics.calmarRatio > 0 ? '#f97316' : '#ff4466';
  const kellyPct = (metrics.kellyFraction * 100).toFixed(1);

  // ── Rating labels ───────────────────────────────────────────────────────────
  const sharpeRating = metrics.sharpeRatio > 2 ? 'Excellent' : metrics.sharpeRatio > 1 ? 'Good' : metrics.sharpeRatio > 0 ? 'Weak' : 'Poor';
  const sortinoRating = metrics.sortinoRatio > 2 ? 'Excellent' : metrics.sortinoRatio > 1 ? 'Good' : metrics.sortinoRatio > 0 ? 'Weak' : 'Poor';

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
          Risk-Adjusted Returns
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Hover metrics for details
        </span>
      </div>

      {/* Metrics */}
      <MetricRow
        label="Sharpe Ratio"
        value={metrics.sharpeRatio.toFixed(2)}
        subtext={sharpeRating}
        color={sharpeColor}
        bar={Math.min(Math.max(metrics.sharpeRatio / 3, 0), 1)}
        tooltip="(Avg return - Risk free rate) / Std deviation × √252. Measures return per unit of total volatility. >2 = excellent, >1 = good, <0 = poor."
      />

      <MetricRow
        label="Sortino Ratio"
        value={metrics.sortinoRatio.toFixed(2)}
        subtext={sortinoRating}
        color={sortinoColor}
        bar={Math.min(Math.max(metrics.sortinoRatio / 3, 0), 1)}
        tooltip="Like Sharpe but only penalizes downside volatility. More relevant for trading — a strategy with large upside spikes shouldn't be penalized. >2 = excellent."
      />

      <MetricRow
        label="Calmar Ratio"
        value={metrics.calmarRatio.toFixed(2)}
        subtext="return / drawdown"
        color={calmarColor}
        bar={Math.min(Math.max(metrics.calmarRatio / 5, 0), 1)}
        tooltip="Annualized return divided by maximum drawdown. Measures how much return you earn per unit of drawdown risk. >3 = excellent, >1 = good."
      />

      <MetricRow
        label="Max Drawdown"
        value={`${metrics.maxDrawdown.toFixed(1)}%`}
        subtext="peak to trough"
        color={metrics.maxDrawdown < 10 ? '#00ff88' : metrics.maxDrawdown < 25 ? '#f97316' : '#ff4466'}
        tooltip="Largest percentage decline from a peak to a subsequent trough. Measures worst-case loss scenario. Lower is better."
      />

      <MetricRow
        label="VaR (95%)"
        value={`$${metrics.var95.toFixed(0)}`}
        subtext="per trade"
        color="#a855f7"
        tooltip="Value at Risk at 95% confidence. In 95% of cases, a single trade should not lose more than this amount. Historical method using your actual trade distribution."
      />

      <MetricRow
        label="VaR (99%)"
        value={`$${metrics.var99.toFixed(0)}`}
        subtext="tail risk"
        color="#f97316"
        tooltip="Value at Risk at 99% confidence (tail risk). In 99% of cases, a single trade should not lose more than this. The remaining 1% represents black swan scenarios."
      />

      <MetricRow
        label="Kelly Criterion"
        value={`${kellyPct}%`}
        subtext="optimal sizing"
        color="#22d3ee"
        bar={metrics.kellyFraction}
        barColor="rgba(34,211,238,0.6)"
        tooltip={`Kelly formula: f* = (b×p - q) / b. Suggests ${kellyPct}% of capital per trade for theoretically optimal long-run growth. Capped at 25% (half-Kelly recommended in practice).`}
      />

      {/* Legend */}
      <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Rating Guide</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#00ff88', label: 'Excellent' },
            { color: '#22d3ee', label: 'Good' },
            { color: '#f97316', label: 'Weak' },
            { color: '#ff4466', label: 'Poor' },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}