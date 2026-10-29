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
