'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client ──────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Trade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnl: number;
  fee: number;
  openTime: string;
  closeTime: string;
  leverage: number;
  unrealizedPnl?: number;
  notes?: string;
  markPrice?: number;
  liquidationPrice?: number;
  roe?: number;
  margin?: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  roe: number;
  leverage: number;
  margin: number;
}

export interface PnLPoint {
  timestamp: number;
  cumulativePnl: number;
  drawdown: number;
  dailyPnl: number;
}

export interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  var95: number;       // Value at Risk at 95% confidence
  var99: number;       // Value at Risk at 99% confidence
  kellyFraction: number; // Kelly Criterion optimal position size
  avgHoldingTime: number;
}

export interface DashboardMetrics {
  totalPnl: number;
  totalPnlChange: number;
  unrealizedPnl: number;
  winRate: number;
  winningRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  var95: number;
  var99: number;
  kellyFraction: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  avgHoldingTime: number;
  availableSymbols: string[];
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  symbols: string[];
  sides: ('long' | 'short')[];
}

export type ConnectionStatus = 'connecting' | 'live' | 'polling' | 'disconnected';

interface UseDeriverseDataReturn {
  trades: Trade[];
  positions: Position[];
  metrics: DashboardMetrics;
  pnlHistory: PnLPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  connectionStatus: ConnectionStatus;
  lastUpdated: Date | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DERIVERSE_API_BASE = process.env.NEXT_PUBLIC_DERIVERSE_API_BASE || 'https://api.deriverse.com';
const POLL_INTERVAL = 30000;

// ─── Mock data ────────────────────────────────────────────────────────────────

function generateMockTrades(address: string): Trade[] {
  const symbols = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP', 'ARB-PERP', 'OP-PERP'];
  const now = Date.now();
  const seed = address.slice(2, 8);
  let rng = parseInt(seed || '123456', 16);

  function rand(min: number, max: number): number {
    rng = (rng * 1664525 + 1013904223) % 4294967296;
    return min + (rng / 4294967296) * (max - min);
  }

  return Array.from({ length: 40 }, (_, i) => {
    const symbol = symbols[i % symbols.length];
    const side: 'long' | 'short' = rand(0, 1) > 0.5 ? 'long' : 'short';
    const entryPrice = symbol.startsWith('BTC') ? rand(55000, 68000) : symbol.startsWith('ETH') ? rand(2800, 3800) : rand(80, 200);
    const exitPrice = entryPrice * (1 + (rand(-0.08, 0.12) * (side === 'long' ? 1 : -1)));
    const size = rand(0.01, 0.5);
    const pnl = (exitPrice - entryPrice) * size * (side === 'long' ? 1 : -1);
    const fee = Math.abs(entryPrice * size * 0.0005);
    const openTime = new Date(now - rand(1_000_000, 30_000_000) * (i + 1) * 0.1).toISOString();
    const closeTime = new Date(new Date(openTime).getTime() + rand(600_000, 86_400_000)).toISOString();

    return {
      id: `trade_${i + 1}`,
      symbol,
      side,
      size,
      entryPrice,
      exitPrice,
      realizedPnl: pnl,
      fee,
      openTime,
      closeTime,
      leverage: Math.floor(rand(1, 20)),
      markPrice: exitPrice,
      liquidationPrice: side === 'long' ? entryPrice * 0.85 : entryPrice * 1.15,
      unrealizedPnl: 0,
      roe: (pnl / (entryPrice * size / 10)) * 100,
      margin: entryPrice * size / 10,
    };
  });
}

function generateMockPositions(address: string): Position[] {
  const symbols = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP'];
  const seed = address.slice(2, 8);
  let rng = parseInt(seed || '123456', 16);

  function rand(min: number, max: number): number {
    rng = (rng * 1664525 + 1013904223) % 4294967296;
    return min + (rng / 4294967296) * (max - min);
  }

  return symbols.map((symbol, i) => ({
    id: `pos_${i + 1}`,
    symbol,
    side: rand(0, 1) > 0.5 ? 'long' : 'short' as 'long' | 'short',
    size: rand(0.1, 2),
    entryPrice: symbol.startsWith('BTC') ? rand(58000, 65000) : rand(2000, 4000),
    markPrice: symbol.startsWith('BTC') ? rand(58000, 66000) : rand(2000, 4100),
    liquidationPrice: rand(40000, 50000),
    unrealizedPnl: rand(-800, 1200),
    roe: rand(-15, 35),
    leverage: Math.floor(rand(2, 15)),
    margin: rand(500, 5000),
  }));
}

// ─── Risk computations ────────────────────────────────────────────────────────

function computeRiskMetrics(trades: Trade[], maxDrawdown: number): RiskMetrics {
  if (trades.length < 2) {
    return { sharpeRatio: 0, sortinoRatio: 0, calmarRatio: 0, maxDrawdown, var95: 0, var99: 0, kellyFraction: 0, avgHoldingTime: 0 };
  }

  const netPnls = trades.map(t => t.realizedPnl - t.fee);
  const mean = netPnls.reduce((a, b) => a + b, 0) / netPnls.length;

  // ── Sharpe Ratio (annualized) ─────────────────────────────────────────────
  const variance = netPnls.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / netPnls.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;

  // ── Sortino Ratio (downside deviation only) ───────────────────────────────
  // Only penalizes negative returns, unlike Sharpe which penalizes all volatility
  const downsidePnls = netPnls.filter(p => p < 0);
  const downsideVariance = downsidePnls.length > 0
    ? downsidePnls.reduce((a, b) => a + Math.pow(b, 2), 0) / downsidePnls.length
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance);
  const sortinoRatio = downsideDeviation > 0 ? (mean / downsideDeviation) * Math.sqrt(252) : 0;

  // ── Calmar Ratio (annualized return / max drawdown) ───────────────────────
  const annualizedReturn = mean * 252;
  const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

  // ── Value at Risk (Historical VaR) ────────────────────────────────────────
  // Sort losses, take percentile cutoffs
  const sortedPnls = [...netPnls].sort((a, b) => a - b);
  const var95Index = Math.floor(sortedPnls.length * 0.05);
  const var99Index = Math.floor(sortedPnls.length * 0.01);
  const var95 = Math.abs(sortedPnls[var95Index] ?? 0);
  const var99 = Math.abs(sortedPnls[var99Index] ?? 0);

  // ── Kelly Criterion ───────────────────────────────────────────────────────
  // f* = (bp - q) / b  where b = avg win/avg loss ratio, p = win rate, q = loss rate
  const wins = netPnls.filter(p => p > 0);
  const losses = netPnls.filter(p => p < 0);
  const winRate = wins.length / netPnls.length;
  const lossRate = 1 - winRate;
  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;
  const b = avgLoss > 0 ? avgWin / avgLoss : 0;
  const kellyFraction = b > 0 ? Math.max(0, Math.min(0.25, (b * winRate - lossRate) / b)) : 0; // capped at 25%

  // ── Average holding time ──────────────────────────────────────────────────
  const avgHoldingTime = trades.reduce((sum, t) => {
    return sum + (new Date(t.closeTime).getTime() - new Date(t.openTime).getTime());
  }, 0) / trades.length;

  return { sharpeRatio, sortinoRatio, calmarRatio, maxDrawdown, var95, var99, kellyFraction, avgHoldingTime };
}

function computePnLHistory(trades: Trade[]): PnLPoint[] {
  const sorted = [...trades].sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());
  let cumulative = 0;
  let peak = 0;

  return sorted.map(trade => {
    cumulative += trade.realizedPnl - trade.fee;
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
    return {
      timestamp: new Date(trade.closeTime).getTime(),
      cumulativePnl: cumulative,
      drawdown,
      dailyPnl: trade.realizedPnl - trade.fee,
    };
  });
}

function computeMetrics(trades: Trade[], positions: Position[]): DashboardMetrics {
  if (trades.length === 0) {
    return {
      totalPnl: 0, totalPnlChange: 0, unrealizedPnl: 0,
      winRate: 0, winningRate: 0, profitFactor: 0,
      maxDrawdown: 0, sharpeRatio: 0, sortinoRatio: 0,
      calmarRatio: 0, var95: 0, var99: 0, kellyFraction: 0,
      totalTrades: 0, avgWin: 0, avgLoss: 0,
      avgWinningTrade: 0, avgLosingTrade: 0,
      avgHoldingTime: 0, availableSymbols: [],
    };
  }

  const netPnls = trades.map(t => t.realizedPnl - t.fee);
  const totalPnl = netPnls.reduce((a, b) => a + b, 0);
  const wins = netPnls.filter(p => p > 0);
  const losses = netPnls.filter(p => p < 0);
  const winRate = (wins.length / trades.length) * 100;
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

  // Max drawdown
  let peak = 0, maxDd = 0, running = 0;
  const sorted = [...netPnls].sort((a, b) => a - b);
  for (const p of sorted) {
    running += p;
    if (running > peak) peak = running;
    const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
    if (dd > maxDd) maxDd = dd;
  }

  const risk = computeRiskMetrics(trades, maxDd);

  const mid = Math.floor(trades.length / 2);
  const oldPnl = netPnls.slice(0, mid).reduce((a, b) => a + b, 0);
  const newPnl = netPnls.slice(mid).reduce((a, b) => a + b, 0);
  const totalPnlChange = oldPnl !== 0 ? ((newPnl - oldPnl) / Math.abs(oldPnl)) * 100 : 0;
  const unrealizedPnl = positions.reduce((a, p) => a + p.unrealizedPnl, 0);
  const availableSymbols = [...new Set(trades.map(t => t.symbol))].sort();

  return {
    totalPnl, totalPnlChange, unrealizedPnl,
    winRate, winningRate: winRate, profitFactor,
    maxDrawdown: maxDd,
    sharpeRatio: risk.sharpeRatio,
    sortinoRatio: risk.sortinoRatio,
    calmarRatio: risk.calmarRatio,
    var95: risk.var95,
    var99: risk.var99,
    kellyFraction: risk.kellyFraction,
    totalTrades: trades.length,
    avgWin, avgLoss,
    avgWinningTrade: avgWin,
    avgLosingTrade: avgLoss,
    avgHoldingTime: risk.avgHoldingTime,
    availableSymbols,
  };
}

function applyFilters(trades: Trade[], filters: FilterState): Trade[] {
  return trades.filter(trade => {
    if (filters.dateFrom && new Date(trade.closeTime).getTime() < new Date(filters.dateFrom).getTime()) return false;
    if (filters.dateTo && new Date(trade.closeTime).getTime() > new Date(filters.dateTo).getTime() + 86_400_000) return false;
    if (filters.symbols.length > 0 && !filters.symbols.includes(trade.symbol)) return false;
    if (filters.sides.length > 0 && !filters.sides.includes(trade.side)) return false;
    return true;
  });
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useDeriverseData(
  address: string | null,
  filters: FilterState
): UseDeriverseDataReturn {
  const [rawTrades, setRawTrades] = useState<Trade[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);

  // ── Fetch via REST API / mock ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);

    try {
      const [tradesRes, positionsRes] = await Promise.all([
        fetch(`${DERIVERSE_API_BASE}/trades?address=${address}&limit=500`, {
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        }),
        fetch(`${DERIVERSE_API_BASE}/positions?address=${address}`, {
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        }),
      ]);

      if (tradesRes.ok && positionsRes.ok) {
        const tradesJson = await tradesRes.json();
        const positionsJson = await positionsRes.json();
        setRawTrades(tradesJson.trades ?? tradesJson);
        setPositions(positionsJson.positions ?? positionsJson);
      } else {
        throw new Error(`API error: ${tradesRes.status}`);
      }
    } catch {
      console.warn('[useDeriverseData] API unreachable — using mock data');
      setRawTrades(generateMockTrades(address));
      setPositions(generateMockPositions(address));
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  }, [address]);

  // ── Supabase Realtime WebSocket subscription ───────────────────────────────
  useEffect(() => {
    if (!address || !supabase) return;

    setConnectionStatus('connecting');

    // Subscribe to trades table for this wallet address
    const channel = supabase
      .channel(`trades:${address}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `wallet_address=eq.${address}`,
        },
        (payload) => {
          // New trade closed — prepend to rawTrades
          setRawTrades(prev => [payload.new as Trade, ...prev]);
          setLastUpdated(new Date());
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trades',
          filter: `wallet_address=eq.${address}`,
        },
        (payload) => {
          // Trade updated (e.g. annotation added)
          setRawTrades(prev => prev.map(t => t.id === (payload.new as Trade).id ? payload.new as Trade : t));
          setLastUpdated(new Date());
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: `wallet_address=eq.${address}`,
        },
        (payload) => {
          // Position opened/updated/closed in real time
          if (payload.eventType === 'DELETE') {
            setPositions(prev => prev.filter(p => p.id !== (payload.old as Position).id));
          } else if (payload.eventType === 'INSERT') {
            setPositions(prev => [payload.new as Position, ...prev]);
          } else {
            setPositions(prev => prev.map(p => p.id === (payload.new as Position).id ? payload.new as Position : p));
          }
          setLastUpdated(new Date());
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('live');
          console.log('[useDeriverseData] WebSocket connected — live updates active');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('polling');
          console.warn('[useDeriverseData] WebSocket closed — falling back to polling');
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setConnectionStatus('disconnected');
    };
  }, [address]);

  // ── Polling fallback (always runs, WebSocket is additive) ─────────────────
  useEffect(() => {
    fetchData();
  }, [fetchData, fetchTick]);

  useEffect(() => {
    if (!address) return;
    // Poll every 30s as fallback — WebSocket updates arrive instantly when connected
    const interval = setInterval(() => setFetchTick(t => t + 1), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [address]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const trades = useMemo(() => applyFilters(rawTrades, filters), [rawTrades, filters]);
  const pnlHistory = useMemo(() => computePnLHistory(trades), [trades]);
  const metrics = useMemo(() => computeMetrics(trades, positions), [trades, positions]);
  const refetch = useCallback(() => setFetchTick(t => t + 1), []);

  return { trades, positions, metrics, pnlHistory, isLoading, error, refetch, connectionStatus, lastUpdated };
}