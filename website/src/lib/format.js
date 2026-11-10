const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatINR(value) {
  return inr.format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/** `YYYY-MM-DD` in local time, for `<input type="date">`. */
export function toInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function todayInput() {
  return toInputDate(new Date());
}

export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = String(hhmm).split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatTiming(from, to) {
  return from && to ? `${formatTime(from)} – ${formatTime(to)}` : '—';
}

export function labelize(value) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || '?';
}

/** wa.me link; assumes a 10-digit local number belongs to `countryCode`. */
export function whatsappLink(phone, text = '', countryCode = '91') {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const full = digits.length === 10 ? `${countryCode}${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** Whole days from `a` to `b` (b − a), ignoring time of day. */
export function daysBetween(a, b = new Date()) {
  const start = new Date(a);
  const end = new Date(b);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / 86400000);
}

/** Human span like "1 yr 2 mo", "3 mo 5 d", "12 d". */
export function formatSpan(totalDays) {
  const d = Math.abs(Math.round(totalDays || 0));
  if (d < 31) return `${d} d`;
  const years = Math.floor(d / 365);
  const months = Math.floor((d % 365) / 30);
  const days = d - years * 365 - months * 30;
  if (years) return `${years} yr${months ? ` ${months} mo` : ''}`;
  return `${months} mo${days ? ` ${days} d` : ''}`;
}

export function ageFromDob(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function yesNo(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '—';
}

/** Downloads rows as a CSV file (Excel-friendly, UTF-8 BOM). */
export function downloadCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.map((c) => escape(c.label)).join(','), ...rows.map((row) => columns.map((c) => escape(c.value(row))).join(','))];
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Drops empty values so they are not sent as query params. */
export function cleanParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false));
}
