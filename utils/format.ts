const pad = (n: number) => String(n).padStart(2, '0');

// "2026-08-28, 12:43 PM" — the timestamp style used in the list designs.
export const formatStamp = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}, ${pad(h12)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`;
};

// "2026-09-22"
export const formatDay = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// "08-05, 11:32AM" — compact style used in the documents list.
export const formatShort = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}, ${pad(h12)}:${pad(d.getMinutes())}${h >= 12 ? 'PM' : 'AM'}`;
};

// "12 Sep 2026" — used in the Create Project date fields.
export const formatLong = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const initialOf = (s?: string) => (s?.trim()?.charAt(0) || '?').toUpperCase();

// "Just now", "2m ago", "3h ago", "Yesterday", "3d ago", then "12 Sep 2026".
export const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatLong(iso);
};
