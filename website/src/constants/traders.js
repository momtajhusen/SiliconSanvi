export const PRODUCT_CATEGORIES = [
  { value: 'laptops-desktops', label: 'Laptops & Desktops' },
  { value: 'components', label: 'PC Components' },
  { value: 'monitors', label: 'Monitors' },
  { value: 'printers', label: 'Printers & Ink' },
  { value: 'accessories', label: 'Keyboards & Mice' },
  { value: 'storage', label: 'Storage' },
  { value: 'networking', label: 'Networking' },
  { value: 'power', label: 'UPS & Power' },
  { value: 'cctv', label: 'CCTV & Security' },
  { value: 'other', label: 'Other' },
];

export const categoryLabel = (value) => PRODUCT_CATEGORIES.find((c) => c.value === value)?.label || 'Other';

export const PRODUCT_UNITS = ['pcs', 'set', 'box', 'metre', 'roll', 'kg', 'pair'];

export const JOB_STATUSES = [
  { value: 'installed', label: 'Installed' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const JOB_PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

export const STOCK_STATES = {
  ok: { label: 'In stock', tone: 'navy' },
  low: { label: 'Low stock', tone: 'amber' },
  out: { label: 'Out of stock', tone: 'red' },
};

export const STOCK_MOVE_LABELS = {
  opening: 'Opening stock',
  purchase: 'Purchase / stock in',
  purchase_return: 'Purchase reduced / returned',
  adjustment: 'Adjustment',
  job: 'Installed (bill)',
  job_return: 'Returned from bill',
};

export const GST_RATES = [0, 5, 12, 18, 28];
