// ✅ Import Trade from useDeriverseData — the actual runtime type
import type { Trade } from '../../hooks/useDeriverseData'; // Ensure this module exists or update the path
import type { FeeBreakdown, FeeMetrics } from '../types';

const MAKER_FEE_RATE = 0.0002;     // 0.02%
const TAKER_FEE_RATE = 0.0005;     // 0.05%
const REFERRAL_DISCOUNT = 0.1;     // 10% discount
const REFERRAL_REBATE_RATE = 0.15; // 15% rebate to referrer

export function calculateTradeFees(trade: Trade): FeeBreakdown {
  const notional = trade.entryPrice * trade.size;

  // ✅ trade.isMaker and trade.orderType don't exist on useDeriverseData Trade
  // Use the pre-calculated trade.fee directly as baseFee, split evenly as approximation
  const baseFee = trade.fee;
  const makerFee = baseFee * 0.5;
  const takerFee = baseFee * 0.5;

  // ✅ trade.referredBy doesn't exist — no referral discount
  const referralDiscount = 0;
  const netFee = baseFee - referralDiscount;
  const referralRebate = 0;

  // ✅ trade.fundingFee doesn't exist on this Trade type
  const fundingFee = 0;

  // ✅ trade.isLiquidated doesn't exist — no liquidation fee
  const liquidationFee = 0;

  return {
    makerFee,
    takerFee,
    baseFee,
    referralDiscount,
    netFee,
    referralRebate,
    fundingFee,
    liquidationFee,
    totalFee: netFee + fundingFee + liquidationFee,
  };
}

export function calculateFeeMetrics(trades: Trade[]): FeeMetrics {
  const breakdowns = trades.map((t) => ({ trade: t, fees: calculateTradeFees(t) }));

  const totalFeesPaid = breakdowns.reduce((sum, { fees }) => sum + fees.totalFee, 0);
  const totalMakerFees = breakdowns.reduce((sum, { fees }) => sum + fees.makerFee, 0);
  const totalTakerFees = breakdowns.reduce((sum, { fees }) => sum + fees.takerFee, 0);
  const totalFundingFees = 0;
  const totalLiquidationFees = 0;
  const totalReferralDiscounts = 0;
  const totalReferralRebates = 0;

  // ✅ asset → symbol
  const byAsset: Record<string, { totalFee: number; count: number; avgFee: number }> = {};
  for (const { trade, fees } of breakdowns) {
    if (!byAsset[trade.symbol]) {
      byAsset[trade.symbol] = { totalFee: 0, count: 0, avgFee: 0 };
    }
    byAsset[trade.symbol].totalFee += fees.totalFee;
    byAsset[trade.symbol].count++;
  }
  for (const sym in byAsset) {
    byAsset[sym].avgFee = byAsset[sym].totalFee / byAsset[sym].count;
  }

  // ✅ openedAt → openTime
  const feesByDay: Record<string, number> = {};
  for (const { trade, fees } of breakdowns) {
    const day = trade.openTime.split('T')[0];
    feesByDay[day] = (feesByDay[day] ?? 0) + fees.totalFee;
  }
  const feesOverTime = Object.entries(feesByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, fee]) => ({ date, fee }));

  const makerTakerRatio = totalTakerFees === 0 ? Infinity : totalMakerFees / totalTakerFees;
  const avgFeePerTrade = trades.length > 0 ? totalFeesPaid / trades.length : 0;

  return {
    totalFeesPaid,
    totalMakerFees,
    totalTakerFees,
    totalFundingFees,
    totalLiquidationFees,
    totalReferralDiscounts,
    totalReferralRebates,
    makerTakerRatio,
    avgFeePerTrade,
    byAsset,
    feesOverTime,
  };
}

export function estimateFee(notional: number, isMaker: boolean, hasReferral: boolean): number {
  const rate = isMaker ? MAKER_FEE_RATE : TAKER_FEE_RATE;
  const base = notional * rate;
  return hasReferral ? base * (1 - REFERRAL_DISCOUNT) : base;
}