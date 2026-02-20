'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFilterStore } from '../stores/filterStore';
import { useWallet } from '../hooks/useWallet';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getChainName(chainId?: number | null): string {
  const chains: Record<number, string> = {
    1:     'Ethereum',
    42161: 'Arbitrum',
    10:    'Optimism',
    137:   'Polygon',
    8453:  'Base',
    56:    'BSC',
  };
  return chainId ? (chains[chainId] ?? `Chain ${chainId}`) : 'Unknown';
}

function getChainColor(chainId?: number | null): string {
  const colors: Record<number, string> = {
    1:     '#627EEA',
    42161: '#28A0F0',
    10:    '#FF0420',
    137:   '#8247E5',
    8453:  '#0052FF',
    56:    '#F0B90B',
  };
  return chainId ? (colors[chainId] ?? '#64748b') : '#64748b';
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const WalletIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1 7h14" stroke="currentColor" strokeWidth="1.2" />
    <rect x="10" y="9" width="3" height="2" rx="0.5" fill="currentColor" />
    <path d="M4 2h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1 8V1h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DisconnectIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M4.5 6H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M7 4l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 2H2a1 1 0 00-1 1v6a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M6 1h4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 1L5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M4 2H2a1 1 0 00-1 1v6a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const Spinner = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
    <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

const AddressAvatar = ({ address, size = 20 }: { address: string; size?: number }) => {
  const colors = ['#22d3ee', '#a855f7', '#22c55e', '#f97316', '#3b82f6', '#ec4899'];
  const hash = address.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bg = colors[hash % colors.length];
  const bg2 = colors[(hash + 2) % colors.length];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ borderRadius: '50%', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`avatar-${hash}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bg} />
          <stop offset="100%" stopColor={bg2} />
        </linearGradient>
      </defs>
      <circle cx="10" cy="10" r="10" fill={`url(#avatar-${hash})`} />
      <circle cx="10" cy="8" r="3.5" fill="rgba(255,255,255,0.3)" />
      <ellipse cx="10" cy="18" rx="6" ry="4" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
};

const ChainBadge = ({ chainId }: { chainId?: number | null }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 6px', borderRadius: 4,
    background: `${getChainColor(chainId)}18`,
    border: `1px solid ${getChainColor(chainId)}40`,
    fontSize: 10, fontWeight: 600, color: getChainColor(chainId),
    fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.03em', whiteSpace: 'nowrap',
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: getChainColor(chainId), flexShrink: 0 }} />
    {getChainName(chainId)}
  </span>
);

// ─── Dropdown ─────────────────────────────────────────────────────────────────

interface DropdownProps {
  address: string;
  chainId: number | null;
  onDisconnect: () => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement>;
}

const WalletDropdown: React.FC<DropdownProps> = ({ address, chainId, onDisconnect, onClose, anchorRef }) => {
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address]);

  const handleViewExplorer = useCallback(() => {
    const explorers: Record<number, string> = {
      1:     'https://etherscan.io/address/',
      42161: 'https://arbiscan.io/address/',
      10:    'https://optimistic.etherscan.io/address/',
      137:   'https://polygonscan.com/address/',
      8453:  'https://basescan.org/address/',
    };
    const base = chainId ? (explorers[chainId] ?? 'https://etherscan.io/address/') : 'https://etherscan.io/address/';
    window.open(`${base}${address}`, '_blank', 'noopener');
  }, [address, chainId]);

  const menuItemStyle = (danger = false): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6,
    cursor: 'pointer', fontSize: 12, color: danger ? '#ef4444' : '#94a3b8',
    transition: 'all 0.12s ease', userSelect: 'none', border: 'none',
    background: 'transparent', width: '100%', textAlign: 'left',
  });

  return (
    <div ref={dropdownRef} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 1000,
      minWidth: 240, background: 'linear-gradient(145deg, #0f172a, #0d1526)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
      boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      overflow: 'hidden', animation: 'dropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <AddressAvatar address={address} size={32} />
          <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.02em' }}>
            {shortenAddress(address)}
          </div>
        </div>
        <ChainBadge chainId={chainId} />
      </div>

      <div style={{ padding: '6px' }}>
        <button style={menuItemStyle()} onClick={handleCopy}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span style={{ color: copied ? '#22c55e' : undefined }}>{copied ? 'Copied!' : 'Copy address'}</span>
        </button>

        <button style={menuItemStyle()} onClick={handleViewExplorer}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <ExternalIcon />
          View on explorer
        </button>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

        <button style={menuItemStyle(true)} onClick={() => { onDisconnect(); onClose(); }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}>
          <DisconnectIcon />
          Disconnect wallet
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const WalletButton: React.FC<WalletButtonProps> = ({
  onConnect,
  onDisconnect,
  className,
  size = 'md',
}) => {
  // ✅ Single source of truth — all wallet state comes from context
  const { address, chainId, isConnected, isConnecting, error, connect, disconnect } = useWallet();
  const { setWalletAddress } = useFilterStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Keep filterStore in sync with context
  useEffect(() => {
    setWalletAddress(address);
  }, [address, setWalletAddress]);

  const handleConnect = useCallback(async () => {
    await connect();
    if (address) onConnect?.(address);
  }, [connect, address, onConnect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setShowDropdown(false);
    onDisconnect?.();
  }, [disconnect, onDisconnect]);

  const sizeMap = {
    sm: { padding: '6px 12px',  fontSize: 12, height: 32, iconSize: 13 },
    md: { padding: '8px 16px',  fontSize: 13, height: 38, iconSize: 15 },
    lg: { padding: '10px 20px', fontSize: 14, height: 44, iconSize: 16 },
  };
  const s = sizeMap[size];

  type Status = 'disconnected' | 'connecting' | 'connected' | 'error';
  const status: Status = isConnecting ? 'connecting' : isConnected ? 'connected' : error ? 'error' : 'disconnected';

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: s.padding, height: s.height, borderRadius: 8,
    fontFamily: '"Inter", "DM Sans", system-ui, sans-serif',
    fontSize: s.fontSize, fontWeight: 600,
    cursor: isConnecting ? 'wait' : 'pointer',
    userSelect: 'none', transition: 'all 0.15s ease',
    border: '1px solid transparent', outline: 'none',
    position: 'relative', whiteSpace: 'nowrap',
  };

  const stateStyles: Record<Status, React.CSSProperties> = {
    disconnected: { background: 'linear-gradient(135deg, #22d3ee18 0%, #a855f718 100%)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', boxShadow: '0 0 20px rgba(34,211,238,0.06)' },
    connecting:   { background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee', opacity: 0.8 },
    connected:    { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' },
    error:        { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' },
  };

  return (
    <>
      <style>{`
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(34,211,238,0.4); } 70% { box-shadow: 0 0 0 6px rgba(34,211,238,0); } 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); } }
      `}</style>

      <div ref={anchorRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          style={{ ...baseStyle, ...stateStyles[status], ...(isConnected && showDropdown ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' } : {}) }}
          onClick={isConnected ? () => setShowDropdown(p => !p) : handleConnect}
          aria-label={isConnected ? 'Wallet menu' : 'Connect wallet'}
          aria-expanded={showDropdown}
        >
          {isConnecting ? (
            <Spinner size={s.iconSize} />
          ) : isConnected && address ? (
            <AddressAvatar address={address} size={s.iconSize + 3} />
          ) : status === 'error' ? (
            <span style={{ fontSize: s.iconSize }}>⚠</span>
          ) : (
            <WalletIcon size={s.iconSize} />
          )}

          <span>
            {isConnecting && 'Connecting…'}
            {status === 'error' && (error ?? 'Error')}
            {!isConnecting && !isConnected && !error && 'Connect Wallet'}
            {isConnected && address && shortenAddress(address)}
          </span>

          {isConnected && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0, animation: 'pulse-ring 2s ease-out infinite' }} />
          )}

          {isConnected && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', opacity: 0.5, marginLeft: -2 }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {showDropdown && address && (
          <WalletDropdown
            address={address}
            chainId={chainId}
            onDisconnect={handleDisconnect}
            onClose={() => setShowDropdown(false)}
            anchorRef={anchorRef as React.RefObject<HTMLDivElement>}
          />
        )}
      </div>
    </>
  );
};

export default WalletButton;