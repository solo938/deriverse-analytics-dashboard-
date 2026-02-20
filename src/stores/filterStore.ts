import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
// ✅ Use Trade from useDeriverseData — the actual runtime type flowing through the app
import type { Trade } from '../hooks/useDeriverseData';

type TradeSide = 'long' | 'short';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  walletAddress: string | null;
  selectedAssets: string[];
  selectedSides: TradeSide[];
  dateRange: { from: string | null; to: string | null };
  minPnL: number | null;
  maxPnL: number | null;
  sortBy: keyof Trade;
  sortDirection: SortDirection;
}

interface FilterStore extends FilterState {
  setWalletAddress: (address: string | null) => void;
  setSelectedAssets: (assets: string[]) => void;
  toggleAsset: (asset: string) => void;
  setSelectedSides: (sides: TradeSide[]) => void;
  toggleSide: (side: TradeSide) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  setMinPnL: (value: number | null) => void;
  setMaxPnL: (value: number | null) => void;
  setSortBy: (field: keyof Trade) => void;
  setSortDirection: (dir: SortDirection) => void;
  toggleSort: (field: keyof Trade) => void;
  resetFilters: () => void;
  applyFilters: (trades: Trade[]) => Trade[];
  getActiveFilterCount: () => number;
}

const defaultState: FilterState = {
  walletAddress: null,
  selectedAssets: [],
  selectedSides: [],
  dateRange: { from: null, to: null },
  minPnL: null,
  maxPnL: null,
  // ✅ openedAt → openTime, pnl → realizedPnl
  sortBy: 'openTime',
  sortDirection: 'desc',
};

export const useFilterStore = create<FilterStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultState,

        setWalletAddress: (address) => set({ walletAddress: address }),
        setSelectedAssets: (assets) => set({ selectedAssets: assets }),
        toggleAsset: (asset) =>
          set((state) => ({
            selectedAssets: state.selectedAssets.includes(asset)
              ? state.selectedAssets.filter((a) => a !== asset)
              : [...state.selectedAssets, asset],
          })),
        setSelectedSides: (sides) => set({ selectedSides: sides }),
        toggleSide: (side) =>
          set((state) => ({
            selectedSides: state.selectedSides.includes(side)
              ? state.selectedSides.filter((s) => s !== side)
              : [...state.selectedSides, side],
          })),
        setDateRange: (from, to) => set({ dateRange: { from, to } }),
        setMinPnL: (value) => set({ minPnL: value }),
        setMaxPnL: (value) => set({ maxPnL: value }),
        setSortBy: (field) => set({ sortBy: field }),
        setSortDirection: (dir) => set({ sortDirection: dir }),
        toggleSort: (field) =>
          set((state) => ({
            sortBy: field,
            sortDirection:
              state.sortBy === field && state.sortDirection === 'desc' ? 'asc' : 'desc',
          })),
        resetFilters: () => set({ ...defaultState, walletAddress: get().walletAddress }),

        applyFilters: (trades) => {
          const {
            selectedAssets,
            selectedSides,
            dateRange,
            minPnL,
            maxPnL,
            sortBy,
            sortDirection,
          } = get();

          let filtered = [...trades];

          // ✅ asset → symbol
          if (selectedAssets.length > 0) {
            filtered = filtered.filter((t) => selectedAssets.includes(t.symbol));
          }

          if (selectedSides.length > 0) {
            filtered = filtered.filter((t) => selectedSides.includes(t.side));
          }

          // ✅ Removed selectedStatuses — useDeriverseData Trade has no status field

          // ✅ openedAt → openTime
          if (dateRange.from) {
            filtered = filtered.filter((t) => t.openTime >= dateRange.from!);
          }
          if (dateRange.to) {
            filtered = filtered.filter((t) => t.openTime <= dateRange.to!);
          }

          // ✅ pnl → realizedPnl - fee (net PnL)
          if (minPnL !== null) {
            filtered = filtered.filter((t) => (t.realizedPnl - t.fee) >= minPnL);
          }
          if (maxPnL !== null) {
            filtered = filtered.filter((t) => (t.realizedPnl - t.fee) <= maxPnL);
          }

          filtered.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (aVal === undefined || bVal === undefined) return 0;
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          });

          return filtered;
        },

        getActiveFilterCount: () => {
          const { selectedAssets, selectedSides, dateRange, minPnL, maxPnL } = get();
          let count = 0;
          if (selectedAssets.length > 0) count++;
          if (selectedSides.length > 0) count++;
          if (dateRange.from || dateRange.to) count++;
          if (minPnL !== null) count++;
          if (maxPnL !== null) count++;
          return count;
        },
      }),
      {
        name: 'filter-store',
        partialize: (state) => ({
          selectedAssets: state.selectedAssets,
          selectedSides: state.selectedSides,
          dateRange: state.dateRange,
          sortBy: state.sortBy,
          sortDirection: state.sortDirection,
        }),
      }
    )
  )
);