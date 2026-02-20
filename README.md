# DERIVERSE Analytics Dashboard

> A Bloomberg-terminal-style trading analytics platform for on-chain derivatives — built for the [Deriverse Protocol bounty](https://superteam.fun/earn/listing/design-trading-analytics-dashboard-with-journal-and-portfolio-analysis) on Superteam Earn.

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ecf8e?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Overview

DERIVERSE Analytics gives DeFi traders the same quality of performance analytics that professional TradFi traders take for granted — non-custodial, wallet-connected, and fully on-chain.

Connect your wallet, and the dashboard pulls your complete trade history, calculates institutional-grade risk metrics, and visualises your performance across time, session, symbol, and order type — all updating in real time via WebSocket.

---

## Features

### 13/13 Bounty Features Implemented

| Feature | Status | Description |
|---|---|---|
| Total PnL Tracking | ✅ | Real-time cumulative PnL with visual gain/loss indicators |
| Trading Volume & Fee Analysis | ✅ | Volume by symbol, fee breakdown, cumulative fee chart |
| Win Rate & Trade Count | ✅ | Win rate %, profit factor, total trades, avg win/loss |
| Average Trade Duration | ✅ | Mean holding time across all closed trades |
| Long/Short Ratio | ✅ | Directional bias chart with last-10-trades indicator |
| Largest Gain/Loss Tracking | ✅ | Best/worst trades, top 3/worst 3 list, streak tracking |
| Average Win/Loss Amount | ✅ | Avg winning trade vs avg losing trade in USD |
| Symbol Filtering & Date Range | ✅ | Filter by symbol, date range, and long/short side |
| Historical PnL + Drawdown | ✅ | Cumulative PnL chart with peak-to-trough drawdown overlay |
| Time-Based Performance | ✅ | Daily PnL bars, Asia/London/NY sessions, day×hour heatmap |
| Trade History + Annotations | ✅ | Sortable table with per-trade journal notes and tags |
| Fee Composition & Cumulative | ✅ | Cumulative fee chart, maker/taker split, fees by symbol |
| Order Type Performance | ✅ | Limit vs Market win rate, avg PnL, fee comparison |

### Beyond the Scope — Risk-Adjusted Metrics

| Metric | Formula | Interpretation |
|---|---|---|
| **Sharpe Ratio** | `(avg_return / std_dev) × √252` | Return per unit of total volatility |
| **Sortino Ratio** | `(avg_return / downside_dev) × √252` | Like Sharpe, penalizes only downside volatility |
| **Calmar Ratio** | `annualised_return / max_drawdown` | Return per unit of drawdown risk |
| **VaR 95%** | Historical 5th percentile of trade PnL | Max expected loss in 95% of trades |
| **VaR 99%** | Historical 1st percentile of trade PnL | Tail risk — black swan threshold |
| **Kelly Criterion** | `f* = (b×p - q) / b` (capped at 25%) | Optimal position size as % of capital |
| **Max Drawdown** | `(peak - trough) / peak × 100` | Worst historical peak-to-trough decline |

---

## Architecture

### Real-Time Data Layer

The dashboard uses a **dual-layer data strategy**:

1. **Supabase Realtime WebSocket** (primary) — subscribes to `trades` and `positions` tables filtered by `wallet_address`. Pushes `INSERT`, `UPDATE`, and `DELETE` events instantly to the UI.
2. **REST API polling** (fallback) — polls the Deriverse API every 30 seconds. Activates automatically if the WebSocket connection drops.

The header badge reflects the current state:
- 🟢 **LIVE (WebSocket)** — sub-second updates active
- 🟠 **POLLING (30s)** — fallback mode
- 🔵 **CONNECTING** — establishing WebSocket
- ⚫ **OFFLINE** — no connection

If the Deriverse API is unreachable (e.g. in development), the hook falls back to deterministic mock data seeded from the wallet address — so the dashboard is always demonstrable.

### State Architecture

```
useDeriverseData (hook)
├── Supabase Realtime subscription (WebSocket)
├── REST API fetch + polling fallback
├── Raw trade/position state
└── Derived state (useMemo)
    ├── Filtered trades (applyFilters)
    ├── PnL history (computePnLHistory)
    └── Metrics (computeMetrics + computeRiskMetrics)

filterStore (Zustand + persist)
├── UI filter state (symbol, side, date range)
├── Sort state (column, direction)
└── applyFilters (client-side filtering)
```

### Component Tree

```
app/
├── page.tsx                    # Landing / connect wallet
└── dashboard/
    └── page.tsx                # Main dashboard

components/
├── ConnectionStatusBadge.tsx   # Live/Polling/Offline indicator
├── WalletButton.tsx            # MetaMask connection UI
├── AnnotationModal.tsx         # Trade journal note entry
├── charts/
│   ├── PnLChart.tsx            # Cumulative PnL area chart
│   ├── DrawdownChart.tsx       # Peak-to-trough drawdown
│   ├── LongShortRatioChart.tsx # Directional bias visualisation
│   ├── GainLossTracker.tsx     # Best/worst trades + streaks
│   ├── TimePerformanceChart.tsx# Daily / session / heatmap tabs
│   ├── FeeCompositionChart.tsx # Cumulative + breakdown tabs
│   └── OrderTypeAnalysis.tsx   # Limit vs Market performance
├── filters/
│   └── DateSymbolFilter.tsx    # Date range + symbol + side filter
├── metrics/
│   ├── PnLCard.tsx             # KPI metric card
│   └── RiskMetricsPanel.tsx    # Sharpe / Sortino / VaR / Kelly
└── tables/
    └── TradeHistoryTable.tsx   # Sortable trade history + annotations

hooks/
├── useDeriverseData.ts         # Core data hook (WebSocket + REST + mock)
└── useWallet.tsx               # MetaMask wallet context

stores/
└── filterStore.ts              # Zustand global filter state

lib/
├── types.ts                    # Shared TypeScript types
├── supabase.ts                 # Supabase client
└── calculations/
    ├── fees.ts                 # Fee breakdown calculations
    └── pnl.ts                  # PnL computation utilities
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | Server + Client components |
| Language | TypeScript 5 (strict mode) | No `any`, no shortcuts |
| Styling | Tailwind CSS v4 | New CSS-first engine |
| State | Zustand + persist middleware | Filters survive page refresh |
| Real-time | Supabase Realtime | WebSocket via `postgres_changes` |
| Database | Supabase (PostgreSQL) | Trade + position storage |
| Charts | Recharts | Responsive chart library |
| Wallet | MetaMask injected provider | No third-party wallet libraries |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MetaMask browser extension

### Installation

```bash
# Clone the repository
git clone https://github.com/solo938/deriverse-analytics-dashboard-.git
cd deriverse-analytics-dashboard-

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase — get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Deriverse API (optional — falls back to mock data if not set)
NEXT_PUBLIC_DERIVERSE_API_BASE=https://api.deriverse.com
```

> If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set, the app runs in **mock data mode** — all features are fully functional with deterministic sample data seeded from the connected wallet address.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your MetaMask wallet.

### Production Build

```bash
npm run build
npm start
```

---

## Supabase Setup

If connecting to a real Supabase database, your tables should follow this schema:

```sql
-- Trades table
create table trades (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  symbol text not null,
  side text check (side in ('long', 'short')),
  size numeric not null,
  entry_price numeric not null,
  exit_price numeric not null,
  realized_pnl numeric not null,
  fee numeric not null default 0,
  open_time timestamptz not null,
  close_time timestamptz not null,
  leverage integer default 1,
  notes text,
  created_at timestamptz default now()
);

-- Positions table
create table positions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  symbol text not null,
  side text check (side in ('long', 'short')),
  size numeric not null,
  entry_price numeric not null,
  mark_price numeric not null,
  liquidation_price numeric not null,
  unrealized_pnl numeric not null default 0,
  roe numeric not null default 0,
  leverage integer default 1,
  margin numeric not null default 0,
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table trades enable row level security;
alter table positions enable row level security;

-- Policy: users can only read their own trades
create policy "trades_own_wallet" on trades
  for select using (wallet_address = current_setting('app.wallet_address', true));

-- Enable Realtime
alter publication supabase_realtime add table trades;
alter publication supabase_realtime add table positions;
```

---

## Risk Metrics — Methodology

### Sharpe Ratio
```
sharpe = (mean_pnl / std_dev_pnl) × √252
```
Annualised. Uses per-trade PnL as a proxy for daily returns. Higher is better. >2 = excellent.

### Sortino Ratio
```
sortino = (mean_pnl / downside_deviation) × √252
```
Only penalises negative returns. More relevant for trading strategies with asymmetric upside. The metric quant funds actually use.

### Calmar Ratio
```
calmar = (mean_pnl × 252) / max_drawdown_pct
```
Annualised return divided by max drawdown percentage. Tells you how much return you generate per unit of drawdown risk. >3 = excellent.

### Value at Risk (Historical)
```
VaR_95 = abs(5th percentile of sorted trade PnL distribution)
VaR_99 = abs(1st percentile of sorted trade PnL distribution)
```
Uses your actual trade distribution — no normal distribution assumption. More accurate than parametric VaR for fat-tailed trading returns.

### Kelly Criterion
```
f* = (b × p - q) / b
```
Where `b = avg_win / avg_loss`, `p = win_rate`, `q = 1 - win_rate`. Capped at 25% in the UI (half-Kelly is the practitioner standard to account for estimation error).

---

## Project Structure

```
deriverse-analytics-dashboard/
├── src/
│   ├── app/
│   │   ├── dashboard/page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── stores/
├── public/
├── .env.local              # Not committed — see .env.example
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Known Limitations

- **Order type inference** — the Deriverse API does not expose an `orderType` field. The dashboard infers Limit vs Market from the fee rate relative to notional value (fee rate < 0.035% = Limit). This is an approximation.
- **Sharpe/Sortino annualisation** — uses per-trade PnL rather than daily return series. This is a common simplification; for maximum accuracy, aggregate to daily returns first.
- **Kelly Criterion cap** — the raw Kelly formula can suggest aggressive position sizes during winning streaks. The UI caps at 25% and recommends half-Kelly (12.5%) in practice.
- **Mock data mode** — when the Deriverse API is unreachable, data is generated deterministically from the wallet address. All metrics and charts are functional but reflect simulated trades.

---

## Bounty

Built for the **Deriverse Protocol — Design Trading Analytics Dashboard with Journal and Portfolio Analysis** bounty on [Superteam Earn](https://superteam.fun/earn/listing/design-trading-analytics-dashboard-with-journal-and-portfolio-analysis).

---

## License

MIT — see [LICENSE](LICENSE) for details.
