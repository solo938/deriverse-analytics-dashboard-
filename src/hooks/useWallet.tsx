'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const SUPPORTED_CHAINS: Record<number, { name: string; rpcUrl: string }> = {
  1:     { name: 'Ethereum',     rpcUrl: 'https://cloudflare-eth.com' },
  42161: { name: 'Arbitrum One', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
  10:    { name: 'Optimism',     rpcUrl: 'https://mainnet.optimism.io' },
  8453:  { name: 'Base',         rpcUrl: 'https://mainnet.base.org' },
};

export const WalletContext = createContext<WalletState>({
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async (_chainId: number) => {},
});

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!address;

  // ── Restore session on mount ───────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem('dv_wallet');
    if (stored) {
      try {
        const { address: storedAddress, chainId: storedChainId } = JSON.parse(stored);
        setAddress(storedAddress);
        setChainId(storedChainId);
      } catch {
        sessionStorage.removeItem('dv_wallet');
      }
    }
  }, []);

  // ── Sync already-connected accounts on mount ──────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        const accs = accounts as string[];
        if (accs.length > 0) {
          setAddress(accs[0]);
          sessionStorage.setItem('dv_wallet', JSON.stringify({ address: accs[0], chainId }));
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Wallet event listeners ────────────────────────────────────
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        setAddress(null);
        sessionStorage.removeItem('dv_wallet');
      } else {
        setAddress(accs[0]);
        sessionStorage.setItem('dv_wallet', JSON.stringify({ address: accs[0], chainId }));
      }
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      setChainId(parseInt(chainIdHex as string, 16));
      window.location.reload(); // safest approach for chain changes
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [chainId]);

  // ── Connect ───────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No wallet detected. Please install MetaMask or another Web3 wallet.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      const chainIdHex = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string;

      const parsedChainId = parseInt(chainIdHex, 16);
      setAddress(accounts[0]);
      setChainId(parsedChainId);
      sessionStorage.setItem(
        'dv_wallet',
        JSON.stringify({ address: accounts[0], chainId: parsedChainId })
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection rejected';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setError(null);
    sessionStorage.removeItem('dv_wallet');
  }, []);

  // ── Switch chain ──────────────────────────────────────────────
  const switchChain = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) return;

    const hexChainId = `0x${targetChainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (err: unknown) {
      const switchError = err as { code?: number };
      // 4902 = chain not added to wallet
      if (switchError.code === 4902) {
        const chainName = SUPPORTED_CHAINS[targetChainId]?.name ?? targetChainId;
        setError(`Chain ${chainName} not added to wallet.`);
      }
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        chainId,
        isConnected,
        isConnecting,
        error,
        connect,
        disconnect,
        switchChain,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────
export function useWallet(): WalletState {
  return useContext(WalletContext);
}