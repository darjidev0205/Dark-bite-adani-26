import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
  showBadge?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showTagline = true,
  showBadge = true,
}) => {
  // Dimension tokens
  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-base', subtext: 'text-[10px]', badge: 'text-[9px] px-1.5 py-0.2' },
    md: { icon: 'w-9 h-9 sm:w-10 sm:h-10', text: 'text-lg sm:text-xl', subtext: 'text-xs', badge: 'text-[10px] px-2 py-0.5' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', subtext: 'text-sm', badge: 'text-xs px-2.5 py-0.5' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', subtext: 'text-base', badge: 'text-xs px-3 py-1' },
  }[size];

  return (
    <div className={`flex items-center space-x-2.5 sm:space-x-3 select-none ${className}`}>
      {/* Custom Designed Vector Shield Emblem */}
      <div className={`relative shrink-0 ${sizeClasses.icon} group-hover:scale-105 transition-transform`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Outer Shield Geometry */}
          <path
            d="M24 3L8 9V21.5C8 32.8 14.8 43.1 24 46C33.2 43.1 40 32.8 40 21.5V9L24 3Z"
            fill="#0B1E36"
            stroke="#0D9488"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Inner Teal Security Accent */}
          <path
            d="M24 7L12 11.5V21.5C12 30.5 17.1 38.6 24 41.5C30.9 38.6 36 30.5 36 21.5V11.5L24 7Z"
            fill="#0F766E"
            fillOpacity="0.45"
          />

          {/* Verified Checkmark Combined with UPI Payment Node */}
          <path
            d="M17 23.5L22 28.5L31 18.5"
            stroke="#2DD4BF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secure Biometric / Rupee Dot Accent */}
          <circle cx="24" cy="34" r="2.2" fill="#5EEAD4" />
        </svg>
      </div>

      {/* Typography Block */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center space-x-2 flex-wrap">
            <span
              className={`font-extrabold tracking-tight text-white leading-tight ${sizeClasses.text}`}
            >
              UPI <span className="text-brandTeal-400">Shield</span>
            </span>

            {showBadge && (
              <span
                className={`inline-flex items-center rounded font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 whitespace-nowrap ${sizeClasses.badge}`}
              >
                Demo
              </span>
            )}
          </div>

          {variant === 'full' && showTagline && (
            <p className={`text-slate-300 font-medium tracking-normal truncate ${sizeClasses.subtext}`}>
              Stop Fraud Before Payment.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
