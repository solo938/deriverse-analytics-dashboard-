import { Referral, ReferralMetrics, Trade } from '../types';

const REFERRAL_REBATE_RATE = 0.15;  // 15% of referee fees
const REFERRAL_DISCOUNT_RATE = 0.10; // 10% fee discount for referee

export function calculateReferralMetrics(
  referrals: Referral[],
  trades: Trade[],
  walletAddress: string
): ReferralMetrics {
  // All referrals made by this user
  const myReferrals = referrals.filter(r => r.referrerAddress === walletAddress);
  const activeReferrals = myReferrals.filter(r => r.isActive);

  // Trades made by my referees
  const refereeTrades = trades.filter(t =>
    myReferrals.some(r => r.refereeAddress === t.walletAddress)
  );

  // Total volume from referees
  const totalRefereeVolume = refereeTrades.reduce((sum, t) =>
    sum + t.entryPrice * t.size, 0
  );

  // Fees paid by referees
  const totalRefereeFeesGenerated = refereeTrades.reduce((sum, t) => {
    const notional = t.entryPrice * t.size;
    const rate = t.isMaker ? 0.0002 : 0.0005;
    return sum + notional * rate;
  }, 0);

  // My rebate earnings
  const totalRebatesEarned = totalRefereeFeesGenerated * REFERRAL_REBATE_RATE;

  // Rebate by referee
  const byReferee: Record<string, {
    address: string;
    tradeCount: number;
    volume: number;
    feesGenerated: number;
    rebatesEarned: number;
    joinedAt: string;
    isActive: boolean;
  }> = {};

  for (const referral of myReferrals) {
    const rTrades = refereeTrades.filter(t => t.walletAddress === referral.refereeAddress);
    const volume = rTrades.reduce((s, t) => s + t.entryPrice * t.size, 0);
    const feesGenerated = rTrades.reduce((s, t) => {
      const notional = t.entryPrice * t.size;
      const rate = t.isMaker ? 0.0002 : 0.0005;
      return s + notional * rate;
    }, 0);

    byReferee[referral.refereeAddress] = {
      address: referral.refereeAddress,
      tradeCount: rTrades.length,
      volume,
      feesGenerated,
      rebatesEarned: feesGenerated * REFERRAL_REBATE_RATE,
      joinedAt: referral.joinedAt,
      isActive: referral.isActive,
    };
  }

  // Rebate over time (daily)
  const rebatesByDay: Record<string, number> = {};
  for (const trade of refereeTrades) {
    const day = trade.openedAt.split('T')[0];
    const notional = trade.entryPrice * trade.size;
    const rate = trade.isMaker ? 0.0002 : 0.0005;
    const rebate = notional * rate * REFERRAL_REBATE_RATE;
    rebatesByDay[day] = (rebatesByDay[day] ?? 0) + rebate;
  }

  const rebatesOverTime = Object.entries(rebatesByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rebate]) => ({ date, rebate }));

  // My own discount from being referred
  const myReferral = referrals.find(r => r.refereeAddress === walletAddress);
  const myTrades = trades.filter(t => t.walletAddress === walletAddress);
  const myDiscountSaved = myReferral
    ? myTrades.reduce((sum, t) => {
        const notional = t.entryPrice * t.size;
        const rate = t.isMaker ? 0.0002 : 0.0005;
        return sum + notional * rate * REFERRAL_DISCOUNT_RATE;
      }, 0)
    : 0;

  return {
    totalReferrals: myReferrals.length,
    activeReferrals: activeReferrals.length,
    totalRefereeVolume,
    totalRefereeFeesGenerated,
    totalRebatesEarned,
    rebatesOverTime,
    byReferee,
    referralCode: myReferrals[0]?.referralCode ?? null,
    myDiscountSaved,
    referralDiscountRate: REFERRAL_DISCOUNT_RATE,
    referralRebateRate: REFERRAL_REBATE_RATE,
  };
}

export function generateReferralLink(referralCode: string, baseUrl: string): string {
  return `${baseUrl}?ref=${referralCode}`;
}

export function formatRebate(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}