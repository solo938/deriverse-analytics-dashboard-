// ─── Enums ────────────────────────────────────────────────────────────────────

export type TradeSide = 'long' | 'short';
export type TradeStatus = 'open' | 'closed' | 'liquidated';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type PositionStatus = 'open' | 'closed';

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Trade {
  id: string;
  walletAddress: string;
  asset: string;
  side: TradeSide;
  status: TradeStatus;
  orderType: OrderType;
  entryPrice: number;
  exitPrice: number;
  size: number;
  leverage: number;
  pnl: number;
  isMaker: boolean;
  isLiquidated: boolean;
  fundingFee?: number;
  markPrice?: number;
  referredBy?: string;
  openedAt: string;
  closedAt?: string;
}

export interface Position {
  id: string;
  walletAddress: string;
  asset: string;
  side: TradeSide;
  status: PositionStatus;
  entryPrice: number;
  markPrice: number;
  size: number;
  leverage?: number;
  margin?: number;
  liquidationPrice?: number;
  unrealizedPnL: number;
  openedAt: string;
  closedAt?: string;
}

export interface Referral {
  id: string;
  referrerAddress: string;
  refereeAddress: string;
  referralCode: string;
  isActive: boolean;
  joinedAt: string;
}

// ─── Metric Return Types ───────────────────────────────────────────────────────

export interface PnLMetrics {
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  netPnL: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  expectancy: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  cumulativePnL: { date: string; pnl: number }[];
}

export interface WinRateMetrics {
  winRate: number;
  lossRate: number;
  breakevenRate: number;
  totalTrades: number;
  winners: number;
  losers: number;
  breakeven: number;
  currentStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
  byAsset: Record<string, { wins: number; total: number; winRate: number }>;
}

export interface FeeBreakdown {
  makerFee: number;
  takerFee: number;
  baseFee: number;
  referralDiscount: number;
  netFee: number;
  referralRebate: number;
  fundingFee: number;
  liquidationFee: number;
  totalFee: number;
}

export interface FeeMetrics {
  totalFeesPaid: number;
  totalMakerFees: number;
  totalTakerFees: number;
  totalFundingFees: number;
  totalLiquidationFees: number;
  totalReferralDiscounts: number;
  totalReferralRebates: number;
  makerTakerRatio: number;
  avgFeePerTrade: number;
  byAsset: Record<string, { totalFee: number; count: number; avgFee: number }>;
  feesOverTime: { date: string; fee: number }[];
}

export interface ReferralMetrics {
  totalReferrals: number;
  activeReferrals: number;
  totalRefereeVolume: number;
  totalRefereeFeesGenerated: number;
  totalRebatesEarned: number;
  rebatesOverTime: { date: string; rebate: number }[];
  byReferee: Record<string, {
    address: string;
    tradeCount: number;
    volume: number;
    feesGenerated: number;
    rebatesEarned: number;
    joinedAt: string;
    isActive: boolean;
  }>;
  referralCode: string | null;
  myDiscountSaved: number;
  referralDiscountRate: number;
  referralRebateRate: number;
}

// ─── Supabase Database Schema ─────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string;
          wallet_address: string;
          asset: string;
          side: TradeSide;
          status: TradeStatus;
          order_type: OrderType;
          entry_price: number;
          exit_price: number;
          size: number;
          leverage: number;
          pnl: number;
          is_maker: boolean;
          is_liquidated: boolean;
          funding_fee: number | null;
          mark_price: number | null;
          referred_by: string | null;
          opened_at: string;
          closed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['trades']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['trades']['Row']>;
      };
      positions: {
        Row: {
          id: string;
          wallet_address: string;
          asset: string;
          side: TradeSide;
          status: PositionStatus;
          entry_price: number;
          mark_price: number;
          size: number;
          leverage: number | null;
          margin: number | null;
          liquidation_price: number | null;
          unrealized_pnl: number;
          opened_at: string;
          closed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['positions']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['positions']['Row']>;
      };
      referrals: {
        Row: {
          id: string;
          referrer_address: string;
          referee_address: string;
          referral_code: string;
          is_active: boolean;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['referrals']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['referrals']['Row']>;
      };
    };
  };
}

// ─── Filter / Store Types ─────────────────────────────────────────────────────

export type DateRange = {
  from: string | null;
  to: string | null;
};

export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  walletAddress: string | null;
  selectedAssets: string[];
  selectedSides: TradeSide[];
  selectedStatuses: TradeStatus[];
  dateRange: DateRange;
  minPnL: number | null;
  maxPnL: number | null;
  sortBy: keyof Trade;
  sortDirection: SortDirection;
}