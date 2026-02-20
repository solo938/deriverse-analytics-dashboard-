'use client';

interface PnLCardProps {
    label: string;
    value: number;
    currency?: string;
    suffix?: string;
    decimals?: number;
    change?: number;
    invertColors?: boolean;
    isLoading?: boolean;
}

function formatValue(value: number, currency?: string, suffix?: string, decimals: number = 2): string {
    if (currency) {
        const abs = Math.abs(value);
        const formatted = abs >= 1e6
            ? `${(abs / 1e6).toFixed(decimals)}M`
            : abs >= 1e3
                ? `${(abs / 1e3).toFixed(decimals)}K`
                : abs.toFixed(decimals);
        return `${value < 0 ? '-' : ''}${currency}${formatted}${suffix || ''}`;

    }
    if (suffix) return `${value.toFixed(decimals)}${suffix}`;
    return value.toFixed(decimals);
}

export default  function PnLCard({
    label,
    value,
    currency,
    suffix,
    decimals = 2,
    change,
    invertColors = false,
    isLoading = false,
}: PnLCardProps) {
    const isPositive = invertColors ? value < 0 : value > 0;
    const isNegative = invertColors ? value > 0 : value < 0;
    const isNeutral = value === 0;

    const valueColor = isNeutral
        ? 'text-gray-500'
        : isPositive
            ? 'text-green-500'
            : 'text-red-500';

    const formattedValue = formatValue(value, currency, suffix, decimals);

    return (
        <div
          className="card"
          style={{
            padding: '16px 20px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
          }}
        >
          {/* Accent line top */}
          {!isNeutral && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: isPositive
                ? 'linear-gradient(90deg, transparent, var(--signal-gain), transparent)'
                : 'linear-gradient(90deg, transparent, var(--signal-loss), transparent)',
              opacity: 0.4,
            }} />
          )}
    
          {/* Label */}
          <div style={{
            fontSize: '10px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '10px',
            fontWeight: 400,
          }}>
            {label}
          </div>
    
          {/* Value */}
          {isLoading ? (
            <div style={{
              height: '28px',
              background: 'var(--bg-elevated)',
              borderRadius: '2px',
              animation: 'shimmer 1.5s ease infinite',
              marginBottom: '8px',
            }} />
          ) : (
            <div style={{
              fontSize: '22px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px',
              color: valueColor,
              lineHeight: 1.2,
              marginBottom: '8px',
            }}>
              {!isNeutral && value > 0 && !invertColors ? '+' : ''}
              {formattedValue}
            </div>
          )}
    
          {/* Change indicator */}
          {change !== undefined && !isLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              color: change >= 0 ? 'var(--signal-gain)' : 'var(--signal-loss)',
            }}>
              <span style={{ fontSize: '9px' }}>
                {change >= 0 ? '▲' : '▼'}
              </span>
              <span>
                {Math.abs(change).toFixed(1)}% vs prior period
              </span>
            </div>
          )}
    
          <style>{`
            @keyframes shimmer {
              0% { opacity: 0.4; }
              50% { opacity: 0.7; }
              100% { opacity: 0.4; }
            }
          `}</style>
        </div>
      );
    }
