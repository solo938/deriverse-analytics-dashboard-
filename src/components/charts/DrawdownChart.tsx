'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { PnLPoint } from '@/hooks/useDeriverseData';

interface DrawdownChartProps {
  data: PnLPoint[];
  isLoading?: boolean;
}

/* ── Custom tooltip ───────────────────────────────────────── */
function DrawdownTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const dd = payload[0].value;
  const date = label
    ? new Date(label).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: '4px',
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        {date}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--signal-loss)' }}>
        -{dd.toFixed(2)}%
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
        from peak
      </div>
    </div>
  );
}

/* ── Component ────────────────────────────────────────────── */
export default function DrawdownChart({ data, isLoading = false }: DrawdownChartProps) {
  if (isLoading) {
    return (
      <div style={{
        height: '220px',
        background: 'var(--bg-elevated)',
        borderRadius: '4px',
        animation: 'shimmer 1.5s ease infinite',
      }}>
        <style>{`@keyframes shimmer { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }`}</style>
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
        No drawdown data available
      </div>
    );
  }

  /* Drawdown is rendered as negative values so area goes downward */
  const chartData = data.map((d) => ({
    ...d,
    drawdownNeg: -d.drawdown,
  }));

  const maxDrawdown = Math.max(...data.map((d) => d.drawdown));

  return (
    <div style={{ height: '220px' }}>
      {/* Max drawdown annotation */}
      <div style={{
        textAlign: 'right',
        marginBottom: '4px',
        fontSize: '10px',
        color: 'var(--text-muted)',
      }}>
        Max:{' '}
        <span style={{ color: 'var(--signal-loss)', fontWeight: 500 }}>
          -{maxDrawdown.toFixed(2)}%
        </span>
      </div>

      <div style={{ height: '196px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4466" stopOpacity={0.05} />
                <stop offset="95%" stopColor="#ff4466" stopOpacity={0.3} />
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
                new Date(ts).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }
              tick={{ fontSize: 10, fill: '#444466', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              minTickGap={60}
            />

            <YAxis
              tickFormatter={(v) => `${Math.abs(v).toFixed(0)}%`}
              tick={{ fontSize: 10, fill: '#444466', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              width={40}
              domain={[-(maxDrawdown * 1.2 || 10), 0]}
            />

            <ReferenceLine
              y={0}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />

            <Tooltip
              content={<DrawdownTooltip />}
              cursor={{
                stroke: 'rgba(255,255,255,0.08)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />

            <Area
              type="monotone"
              dataKey="drawdownNeg"
              stroke="#ff4466"
              strokeWidth={1.5}
              fill="url(#ddGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#ff4466',
                stroke: 'var(--bg-void)',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}