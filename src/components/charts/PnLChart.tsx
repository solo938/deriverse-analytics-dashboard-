'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
        ResponsiveContainer,

} from 'recharts';

import type { PnLPoint } from '../../hooks/useDeriverseData';

interface PnLChartProps {
    data: PnLPoint[];
    isLoading?: boolean;
}

function CustomTooltip({ active, payload, label }: {active?: boolean; payload?: any; label?: string}) {
    if (active || payload || payload.length === 0) return null;

    const value = payload[0].value;
    const isPositive = value > 0;
    const date = new Date(label || '').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',

    });

   return (
    <div style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '10px 14px',
        fontFamily: 'var(--font-mono)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    }}>

<div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
  {date}
</div>
      <div style={{
        fontSize: '15px',
        fontWeight: 600,
        color: isPositive ? 'var(--signal-gain)' : 'var(--signal-loss)',
      }}>
        {isPositive ? '+' : ''}${value.toFixed(2)}
      </div>
    </div>
  );
}

/* ── Component ────────────────────────────────────────────── */
export default function PnLChart({ data, isLoading = false }: PnLChartProps) {
  if (isLoading) {
    return (
      <div style={{
        height: '220px',
        background: 'var(--bg-elevated)',
        borderRadius: '4px',
        animation: 'shimmer 1.5s ease infinite',
      }}>
        <style>{`
          @keyframes shimmer {
            0% { opacity: 0.4; } 50% { opacity: 0.7; } 100% { opacity: 0.4; }
          }
        `}</style>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{
        height: '220px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '12px',
        letterSpacing: '0.5px',
      }}>
        No trade data available
      </div>
    );
  }

  /* Determine overall PnL direction for gradient */
  const finalPnl = data[data.length - 1]?.cumulativePnl ?? 0;
  const isOverallPositive = finalPnl >= 0;

  /* Min/max for Y domain padding */
  const values = data.map((d) => d.cumulativePnl);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || Math.abs(max) * 0.1 || 100;

  return (
    <div style={{ height: '220px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGradientPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pnlGradientNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff4466" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ff4466" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="1 4"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(ts) =>
              new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }
            tick={{ fontSize: 10, fill: '#444466', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            minTickGap={60}
          />

          <YAxis
            tickFormatter={(v) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toFixed(0)}`)}
            tick={{ fontSize: 10, fill: '#444466', fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            width={60}
            domain={[min - padding, max + padding]}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: 'rgba(255,255,255,0.1)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
            }}
          />

          {/* Zero reference line */}
          <CartesianGrid
            strokeDasharray="none"
            stroke="rgba(255,255,255,0.08)"
            horizontal={false}
          />

          <Area
            type="monotone"
            dataKey="cumulativePnl"
            stroke={isOverallPositive ? '#00ff88' : '#ff4466'}
            strokeWidth={1.5}
            fill={isOverallPositive ? 'url(#pnlGradientPos)' : 'url(#pnlGradientNeg)'}
            dot={false}
            activeDot={{
              r: 4,
              fill: isOverallPositive ? '#00ff88' : '#ff4466',
              stroke: 'var(--bg-void)',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}