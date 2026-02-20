'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useDeriverseData } from '@/hooks/useDeriverseData';
import type { Trade } from '@/hooks/useDeriverseData';
import WalletButton from '@/components/WalletButton';
import PnLCard from '@/components/metrics/PnLCard';
import PnLChart from '@/components/charts/PnLChart';
import DrawdownChart from '@/components/charts/DrawdownChart';
import TradeHistoryTable from '@/components/tables/TradeHistoryTable';
import DateSymbolFilter from '@/components/filters/DateSymbolFilter';
import AnnotationModal from '@/components/AnnotationModal';
import LongShortRatioChart from '@/components/charts/LongShortRatioChart';
import GainLossTracker from '@/components/charts/GainLossTracker';
import TimePerformanceChart from '@/components/charts/TimePerformanceChart';
import FeeCompositionChart from '@/components/charts/FeeCompositionChart';
import OrderTypeAnalysis from '@/components/charts/OrderTypeAnalysis';
import RiskMetricsPanel from '@/components/metrics/RiskMetricsPanel';
import ConnectionStatusBadge from '@/components/ConnectionStatusBadge';

interface UIFilterState {
  dateFrom: string;
  dateTo: string;
  symbol: string;
  side: 'all' | 'long' | 'short';
}

export default function DashboardPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();

  const [uiFilters, setUiFilters] = useState<UIFilterState>({
    dateFrom: '', dateTo: '', symbol: '', side: 'all',
  });
  const [annotatingTrade, setAnnotatingTrade] = useState<Trade | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && !isConnected) router.push('/'); }, [isConnected, mounted, router]);

  const hookFilters = useMemo(() => ({
    dateFrom: uiFilters.dateFrom,
    dateTo: uiFilters.dateTo,
    symbols: uiFilters.symbol ? [uiFilters.symbol] : [],
    sides: uiFilters.side === 'all'
      ? [] as ('long' | 'short')[]
      : [uiFilters.side] as ('long' | 'short')[],
  }), [uiFilters]);

  const {
    trades, positions, metrics, pnlHistory,
    isLoading, error, refetch,
    connectionStatus, lastUpdated,
  } = useDeriverseData(address || '', hookFilters);

  if (!mounted || !isConnected) return null;

  const card: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    overflow: 'hidden',
  };

  const cardHeader = (title: string, sub?: string) => (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, letterSpacing: '0.5px', color: 'var(--text-primary)' }}>{title}</span>
      {sub && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-void)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px', height: 52,
        backgroundColor: 'rgba(6,6,8,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: 'var(--accent)' }}>
            DERIVERSE
          </span>
          <span style={{ height: 16, width: 1, background: 'var(--border-default)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Analytics
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* ✅ Live connection status badge */}
          <ConnectionStatusBadge status={connectionStatus} lastUpdated={lastUpdated} />

          <button onClick={() => refetch()} style={{
            padding: '4px 10px', borderRadius: 2, fontSize: 11,
            color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)',
            background: 'transparent', cursor: 'pointer',
          }}>
            ↻ Refresh
          </button>
          <WalletButton size="sm" />
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: 1600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.2)', borderRadius: 4, color: 'var(--signal-loss)', fontSize: 12 }}>
            ⚠ {error} — <button onClick={() => refetch()} style={{ color: 'var(--accent)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>retry</button>
          </div>
        )}

        {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <PnLCard label="Total PnL"      value={metrics.totalPnl}      currency="USD" change={metrics.totalPnlChange} isLoading={isLoading} />
          <PnLCard label="Unrealized PnL" value={metrics.unrealizedPnl} currency="USD" isLoading={isLoading} />
          <PnLCard label="Win Rate"        value={metrics.winRate}        suffix="%" isLoading={isLoading} />
          <PnLCard label="Profit Factor"   value={metrics.profitFactor}   decimals={2} isLoading={isLoading} />
          <PnLCard label="Sharpe Ratio"    value={metrics.sharpeRatio}    decimals={2} isLoading={isLoading} />
          <PnLCard label="Sortino Ratio"   value={metrics.sortinoRatio}   decimals={2} isLoading={isLoading} />
          <PnLCard label="Max Drawdown"    value={metrics.maxDrawdown}    suffix="%" invertColors isLoading={isLoading} />
          <PnLCard label="Total Trades"    value={metrics.totalTrades}    decimals={0} isLoading={isLoading} />
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────────── */}
        <div style={card}>
          <DateSymbolFilter filters={uiFilters} onChange={setUiFilters} availableSymbols={metrics.availableSymbols ?? []} />
        </div>

        {/* ── PnL + Drawdown ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={card}>
            {cardHeader('Cumulative PnL', 'USD')}
            <div style={{ padding: 20 }}><PnLChart data={pnlHistory} isLoading={isLoading} /></div>
          </div>
          <div style={card}>
            {cardHeader('Drawdown', '% from peak')}
            <div style={{ padding: 20 }}><DrawdownChart data={pnlHistory} isLoading={isLoading} /></div>
          </div>
        </div>

        {/* ── Risk Metrics Panel (NEW) + Long/Short ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={card}>
            <RiskMetricsPanel metrics={metrics} isLoading={isLoading} />
          </div>
          <div style={card}>
            {cardHeader('Long / Short Ratio', 'directional bias')}
            <LongShortRatioChart trades={trades} isLoading={isLoading} />
          </div>
        </div>

        {/* ── Gain/Loss + Time Performance ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={card}>
            {cardHeader('Gain / Loss Tracker', 'risk management')}
            <GainLossTracker trades={trades} isLoading={isLoading} />
          </div>
          <div style={card}>
            <TimePerformanceChart trades={trades} isLoading={isLoading} />
          </div>
        </div>

        {/* ── Fee Composition + Order Type ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={card}>
            <FeeCompositionChart trades={trades} isLoading={isLoading} />
          </div>
          <div style={card}>
            <OrderTypeAnalysis trades={trades} isLoading={isLoading} />
          </div>
        </div>

        {/* ── Open Positions ───────────────────────────────────────────────────── */}
        {positions.length > 0 && (
          <div style={card}>
            {cardHeader('Open Positions', `${positions.length} active`)}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Symbol', 'Side', 'Size', 'Entry', 'Mark', 'Liq.', 'Unreal. PnL', 'ROE%'].map(col => (
                      <th key={col} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, letterSpacing: '1px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 400, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-subtle)' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos, i) => (
                    <tr key={pos.id ?? i} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{pos.symbol}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 2, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', background: pos.side === 'long' ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,102,0.08)', color: pos.side === 'long' ? 'var(--signal-gain)' : 'var(--signal-loss)', border: `1px solid ${pos.side === 'long' ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,102,0.2)'}` }}>
                          {pos.side}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>{pos.size.toFixed(4)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>${pos.entryPrice.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontSize: 12 }}>${pos.markPrice.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--signal-warn)', fontSize: 12 }}>${pos.liquidationPrice.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 12, color: pos.unrealizedPnl >= 0 ? 'var(--signal-gain)' : 'var(--signal-loss)' }}>
                        {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: pos.roe >= 0 ? 'var(--signal-gain)' : 'var(--signal-loss)' }}>
                        {pos.roe >= 0 ? '+' : ''}{pos.roe.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Trade History ─────────────────────────────────────────────────────── */}
        <div style={card}>
          {cardHeader('Trade History', `${trades.length} trades`)}
          <TradeHistoryTable
            trades={trades}
            isLoading={isLoading}
            onAnnotate={(trade) => setAnnotatingTrade(trade)}
          />
        </div>
      </main>

      {annotatingTrade && (
        <AnnotationModal
          trade={annotatingTrade}
          onClose={() => setAnnotatingTrade(null)}
          onSave={(note) => {
            console.log('Note saved for trade', annotatingTrade.id, note);
            setAnnotatingTrade(null);
          }}
        />
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}