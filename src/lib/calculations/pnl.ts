import { Trade, Position, PnLMetrics, WinRateMetrics } from '../types';

export function calculatePnL(trades: Trade[]): PnLMetrics {
  const closedTrades = trades.filter(t => t.status === 'closed');

  const totalRealizedPnL = closedTrades.reduce((sum, trade) => {
    return sum + (trade.exitPrice - trade.entryPrice) * trade.size * (trade.side === 'long' ? 1 : -1);
  }, 0);

  const grossProfit = closedTrades
    .filter(t => t.pnl > 0)
    .reduce((sum, t) => sum + t.pnl, 0);

  const grossLoss = closedTrades
    .filter(t => t.pnl < 0)
    .reduce((sum, t) => sum + Math.abs(t.pnl), 0);

  const profitFactor = grossLoss === 0 ? Infinity : grossProfit / grossLoss;

  const averageWin = closedTrades.filter(t => t.pnl > 0).length > 0
    ? grossProfit / closedTrades.filter(t => t.pnl > 0).length
    : 0;

  const averageLoss = closedTrades.filter(t => t.pnl < 0).length > 0
    ? grossLoss / closedTrades.filter(t => t.pnl < 0).length
    : 0;

  const expectancy = closedTrades.length > 0
    ? totalRealizedPnL / closedTrades.length
    : 0;

  // Unrealized PnL from open positions
  const openTrades = trades.filter(t => t.status === 'open');
  const totalUnrealizedPnL = openTrades.reduce((sum, trade) => {
    if (!trade.markPrice) return sum;
    return sum + (trade.markPrice - trade.entryPrice) * trade.size * (trade.side === 'long' ? 1 : -1);
  }, 0);

  // Max drawdown calculation
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnL = 0;

  for (const trade of closedTrades) {
    runningPnL += trade.pnl;
    if (runningPnL > peak) peak = runningPnL;
    const drawdown = peak - runningPnL;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Cumulative PnL over time
  const cumulativePnL: { date: string; pnl: number }[] = [];
  let cumSum = 0;
  for (const trade of closedTrades.sort((a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime())) {
    cumSum += trade.pnl;
    cumulativePnL.push({ date: trade.closedAt!, pnl: cumSum });
  }

  return {
    totalRealizedPnL,
    totalUnrealizedPnL,
    netPnL: totalRealizedPnL + totalUnrealizedPnL,
    grossProfit,
    grossLoss,
    profitFactor,
    averageWin,
    averageLoss,
    expectancy,
    maxDrawdown,
    maxDrawdownPercent: peak > 0 ? (maxDrawdown / peak) * 100 : 0,
    cumulativePnL,
  };
}

export function calculateWinRate(trades: Trade[]): WinRateMetrics {
  const closedTrades = trades.filter(t => t.status === 'closed');
  const winners = closedTrades.filter(t => t.pnl > 0);
  const losers = closedTrades.filter(t => t.pnl < 0);
  const breakeven = closedTrades.filter(t => t.pnl === 0);

  const winRate = closedTrades.length > 0
    ? (winners.length / closedTrades.length) * 100
    : 0;

  const lossRate = closedTrades.length > 0
    ? (losers.length / closedTrades.length) * 100
    : 0;

  // Streak calculations
  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let tempWin = 0;
  let tempLoss = 0;

  for (const trade of closedTrades) {
    if (trade.pnl > 0) {
      tempWin++;
      tempLoss = 0;
      if (tempWin > maxWinStreak) maxWinStreak = tempWin;
    } else if (trade.pnl < 0) {
      tempLoss++;
      tempWin = 0;
      if (tempLoss > maxLossStreak) maxLossStreak = tempLoss;
    }
  }

  // Current streak
  if (closedTrades.length > 0) {
    const lastPnL = closedTrades[closedTrades.length - 1].pnl;
    const isWin = lastPnL > 0;
    for (let i = closedTrades.length - 1; i >= 0; i--) {
      if ((closedTrades[i].pnl > 0) === isWin) {
        currentStreak += isWin ? 1 : -1;
      } else {
        break;
      }
    }
  }

  // Win rate by asset
  const byAsset: Record<string, { wins: number; total: number; winRate: number }> = {};
  for (const trade of closedTrades) {
    if (!byAsset[trade.asset]) {
      byAsset[trade.asset] = { wins: 0, total: 0, winRate: 0 };
    }
    byAsset[trade.asset].total++;
    if (trade.pnl > 0) byAsset[trade.asset].wins++;
  }
  for (const asset in byAsset) {
    byAsset[asset].winRate = (byAsset[asset].wins / byAsset[asset].total) * 100;
  }

  return {
    winRate,
    lossRate,
    breakevenRate: closedTrades.length > 0 ? (breakeven.length / closedTrades.length) * 100 : 0,
    totalTrades: closedTrades.length,
    winners: winners.length,
    losers: losers.length,
    breakeven: breakeven.length,
    currentStreak,
    maxWinStreak,
    maxLossStreak,
    byAsset,
  };
}

export function calculateSharpeRatio(trades: Trade[], riskFreeRate = 0): number {
  const closedTrades = trades.filter(t => t.status === 'closed');
  if (closedTrades.length < 2) return 0;

  const returns = closedTrades.map(t => t.pnl);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  return stdDev === 0 ? 0 : (avgReturn - riskFreeRate) / stdDev;
}

export function calculatePositionPnL(position: Position): number {
  const direction = position.side === 'long' ? 1 : -1;
  return (position.markPrice - position.entryPrice) * position.size * direction;
}

export function calculateRoE(position: Position): number {
  const pnl = calculatePositionPnL(position);
  const margin = position.margin ?? position.entryPrice * position.size / (position.leverage ?? 1);
  return margin === 0 ? 0 : (pnl / margin) * 100;
}