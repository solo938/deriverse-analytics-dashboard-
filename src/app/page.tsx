'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import WalletButton from '@/components/WalletButton';

const BOOT_LINES = [
  'Booting up the Deriverse Analytics Dashboard...',
  'Loading data from the blockchain...',
  'Analyzing transactions and smart contracts...',
];

export default function Home() {
  const { isConnected } = useWallet();
  const router = useRouter();
  const [bootLineIndex, setBootLineIndex] = useState(0);
  const [bootDone, setBootDone] = useState(false);

  // ✅ Fix: derive visible lines from bootLineIndex — was referenced as `bootLines` in JSX
  // but that variable never existed. Now it's computed from the index.
  const bootLines = BOOT_LINES.slice(0, bootLineIndex + 1);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setBootLineIndex(idx);
      idx++;
      if (idx >= BOOT_LINES.length) {
        clearInterval(interval);
        setBootDone(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bootDone && isConnected) {
      router.push('/dashboard');
    }
  }, [bootDone, isConnected, router]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `
          linear-gradient(135deg, rgba(255, 0, 150, 0.1) 0%, rgba(0, 255, 255, 0.1) 100%),
          linear-gradient(45deg, rgba(255, 255, 0, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: -1,
      }} />
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, #060608 90%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '560px', width: '100%' }}>

        {/* Logo */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '48px',
            fontWeight: 800,
            letterSpacing: '-2px',
            color: 'var(--accent)',
            textShadow: '0 0 40px rgba(0,255,136,0.3), 0 0 80px rgba(0,255,136,0.1)',
            lineHeight: 1,
            marginBottom: '8px',
          }}>
            DERIVERSE
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '4px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}>
            Trading Analytics Dashboard
          </div>
        </div>

        {/* Terminal boot sequence */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '4px',
          padding: '24px',
          marginBottom: '32px',
          minHeight: '180px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
        }}>
          {/* Terminal header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            {['#ff4466', '#ffaa00', '#00ff88'].map((c, i) => (
              <div key={i} style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: c, opacity: 0.7,
              }} />
            ))}
            <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '11px' }}>
              deriverse — terminal
            </span>
          </div>

          {/* Boot lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {bootLines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: i === bootLines.length - 1 ? 'var(--accent)' : 'var(--text-secondary)',
                  animation: 'fadeInUp 0.2s ease forwards',
                  opacity: i === bootLines.length - 1 ? 1 : 0.6,
                }}
              >
                {line}
              </div>
            ))}
            {!bootDone && bootLines.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '8px', height: '14px',
                  background: 'var(--accent)',
                  animation: 'blink 1s step-end infinite',
                }} />
              </div>
            )}
          </div>
        </div>

        {/* Connect wallet section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          opacity: bootDone ? 1 : 0,
          transform: bootDone ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}>
          <WalletButton size="lg" />
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '11px',
            letterSpacing: '0.5px',
            textAlign: 'center',
          }}>
            Connect your wallet to access trade analytics, PnL tracking,<br />
            and position history across all Deriverse markets.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '10px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          Deriverse Protocol · Non-custodial · On-chain
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </main>
  );
}