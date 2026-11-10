export const BRAND_THEME = {
  institute: {
    tile: 'brand-tile-silicon',
    text: 'brand-text-silicon',
    textLight: 'brand-text-silicon-light',
    ink: 'text-blue-700',
    inkLight: 'text-blue-200',
    soft: 'bg-blue-50',
    ring: 'ring-blue-200/70',
    dot: 'bg-blue-500',
    check: 'text-blue-600',
    banner: 'from-blue-600 via-blue-700 to-indigo-900',
    bar: 'bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-700',
    cta: 'solid',
    hover: 'hover:border-blue-200',
  },
  traders: {
    tile: 'brand-tile-sanvi',
    text: 'brand-text-sanvi',
    textLight: 'brand-text-sanvi-light',
    ink: 'text-orange-700',
    inkLight: 'text-amber-200',
    soft: 'bg-amber-50',
    ring: 'ring-amber-200/80',
    dot: 'bg-amber-500',
    check: 'text-orange-600',
    banner: 'from-amber-500 via-orange-600 to-orange-800',
    bar: 'bg-gradient-to-r from-amber-300 via-amber-500 to-orange-600',
    cta: 'amber',
    hover: 'hover:border-amber-200',
  },
};

export function brandTheme(business) {
  return BRAND_THEME[business] || BRAND_THEME.institute;
}
