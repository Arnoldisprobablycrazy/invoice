import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKes(value: number, currency = "KES"): string {
  const rounded = Math.round(value * 100) / 100
  const hasDecimals = rounded % 1 !== 0
  return `${currency} ${rounded.toLocaleString("en-KE", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Normalize a Kenyan phone number to WhatsApp's international format.
 * WhatsApp requires: 2547XXXXXXXX or 2541XXXXXXXX (no +, no spaces, no leading 0)
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');  // strip everything non-digit
  if (p.startsWith('0')) p = '254' + p.slice(1);
  if (p.startsWith('254')) {
    // Must be 12 digits: 254 + 9 digits
    if (p.length === 12) return p;
  }
  if (p.length === 9 && (p.startsWith('7') || p.startsWith('1'))) {
    return '254' + p;
  }
  return null;  // not a valid Kenyan number
}

/**
 * Build a WhatsApp share URL with pre-filled text.
 * If phone is null, opens WhatsApp's contact picker.
 */
export function whatsAppShareUrl(phone: string | null, message: string): string {
  const waNumber = phone ? toWhatsAppNumber(phone) : null;
  const encoded = encodeURIComponent(message);
  return waNumber
    ? `https://wa.me/${waNumber}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/**
 * Build a public invoice URL from a public_token.
 * Uses NEXT_PUBLIC_APP_URL env var, or falls back to window.location.origin.
 */
export function publicInvoiceUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/i/${token}`;
}

export function formatKenyanPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  let formatted = phone.replace(/\s+/g, '').replace(/^\+/, '')
  if (formatted.startsWith('254')) formatted = `0${formatted.slice(3)}`
  if (formatted.length === 10) {
    return `${formatted.slice(0, 4)} ${formatted.slice(4, 7)} ${formatted.slice(7)}`
  }
  return phone
}

export function formatDate(date: string | Date): string {
  const value = typeof date === 'string' ? new Date(date) : date
  return value.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function isOverdue(
  dueDate: string | Date,
  status: string
): boolean {
  if (status === 'paid' || status === 'cancelled' || status === 'draft') return false
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

export function daysOverdue(dueDate: string | Date): number {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}
