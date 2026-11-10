import { useId } from 'react';
import { cn } from '../../lib/utils';

export default function BrandLogo({ className, alt = 'Silicon Computer Institute & Sanvi Computer and Traders', ...props }) {
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={alt}
      className={cn('h-9 w-9 shrink-0', className)}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0A1A3F" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="28"
        fontWeight="800"
        fill="#fff"
      >
        S
      </text>
    </svg>
  );
}
