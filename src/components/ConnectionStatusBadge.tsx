'use client';

import type { ConnectionStatus } from '@/hooks/useDeriverseData';

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  lastUpdated: Date | null;
}

export default function ConnectionStatusBadge({ status, lastUpdated }: ConnectionStatusBadgeProps) {
  const configs = {
    live: {
      color: '#00ff88',
      bg: 'rgba(0,255,136,0.08)',
      border: 'rgba(0,255,136,0.25)',
      label: 'LIVE',
      pulse: true,
    },
    polling: {
      color: '#f97316',
      bg: 'rgba(249,115,22,0.08)',
      border: 'rgba(249,115,22,0.25)',
      label: 'POLLING',
      pulse: false,
    },
    connecting: {
      color: '#22d3ee',
      bg: 'rgba(34,211,238,0.08)',
      border: 'rgba(34,211,238,0.25)',
      label: 'CONNECTING',
      pulse: true,
    },
    disconnected: {
      color: '#64748b',
      bg: 'rgba(100,116,139,0.08)',
      border: 'rgba(100,116,139,0.2)',
      label: 'OFFLINE',
      pulse: false,
    },
  };

  const cfg = configs[status];

  const timeAgo = lastUpdated
    ? (() => {
        const s = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
        if (s < 10) return 'just now';
        if (s < 60) return `${s}s ago`;
        return `${Math.floor(s / 60)}m ago`;
      })()
    : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {timeAgo && (
        <span style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-mono)' }}>
          {timeAgo}
        </span>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 4,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: cfg.color,
          boxShadow: cfg.pulse ? `0 0 6px ${cfg.color}` : 'none',
          animation: cfg.pulse ? 'pulse 1.5s ease infinite' : 'none',
        }} />
        <span style={{ fontSize: 10, color: cfg.color, fontFamily: 'var(--font-mono)', letterSpacing: '1px', fontWeight: 600 }}>
          {cfg.label}
        </span>
        {status === 'live' && (
          <span style={{ fontSize: 9, color: '#475569' }}>WebSocket</span>
        )}
        {status === 'polling' && (
          <span style={{ fontSize: 9, color: '#475569' }}>30s poll</span>
        )}
      </div>
    </div>
  );
}