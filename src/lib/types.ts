export interface Extinguisher {
  id: string;
  code: string;
  port: string;
  type: string;
  weight: string;
  warranty_expiry: string | null;
  third_level: string | null;
  status: string;
  review_send_date: string | null;
  review_return_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  extinguisher_id: string;
  code: string;
  port: string;
  inspection_date: string;
  manometer_status: string;
  seal_status: string;
  plate_status: string;
  floor_paint_status: string;
  plate_description: string | null;
  floor_paint_description: string | null;
  manometer_review_date: string | null;
  seal_review_date: string | null;
  review_return_date: string | null;
  warranty_expiry: string | null;
  third_level: string | null;
  created_at: string;
}

export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const yearRaw = digits.slice(4, 8);
  let year = yearRaw;
  if (yearRaw.length === 2) {
    year = '20' + yearRaw;
  }
  return day + '/' + month + '/' + year;
}

export function formatMonthYearInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  const month = digits.slice(0, 2);
  const yearRaw = digits.slice(2, 6);
  let year = yearRaw;
  if (yearRaw.length === 2) {
    year = '20' + yearRaw;
  }
  return month + '/' + year;
}

export function formatYearInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) {
    return '20' + digits;
  }
  return digits.slice(0, 4);
}

// Convert MM/YYYY to 01/MM/YYYY
export function monthYearToFullDate(monthYear: string): string {
  const parts = monthYear.split('/');
  if (parts.length !== 2) return monthYear;
  return '01/' + parts[0] + '/' + parts[1];
}

// Convert YYYY to 01/01/YYYY
export function yearToFullDate(year: string): string {
  const digits = year.replace(/\D/g, '');
  let fullYear = digits;
  if (digits.length <= 2 && digits.length > 0) {
    fullYear = '20' + digits.padStart(2, '0');
  }
  if (fullYear.length < 4) return year;
  return '01/01/' + fullYear.slice(0, 4);
}

export function getTodayFormatted(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Display warranty as MM/YYYY (stored as DD/MM/YYYY)
export function displayWarranty(val: string | null): string {
  if (!val) return '-';
  const parts = val.split('/');
  if (parts.length === 3) return parts[1] + '/' + parts[2];
  return val;
}

// Display third level as YYYY (stored as DD/MM/YYYY)
export function displayThirdLevel(val: string | null): string {
  if (!val) return '-';
  const parts = val.split('/');
  if (parts.length === 3) {
    const year = parts[2];
    if (year.length <= 2) return '20' + year.padStart(2, '0');
    return year;
  }
  // If it's just digits (e.g. "29"), expand
  const digits = val.replace(/\D/g, '');
  if (digits.length > 0 && digits.length <= 2) return '20' + digits.padStart(2, '0');
  return val;
}
