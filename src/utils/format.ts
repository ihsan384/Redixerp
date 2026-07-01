import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns'

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  return format(new Date(date), pattern)
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'hh:mm a')
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatIndianNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount)
}

export function isDateToday(date: string | Date): boolean {
  return isToday(new Date(date))
}

export function isDateTomorrow(date: string | Date): boolean {
  return isTomorrow(new Date(date))
}

export function isDatePast(date: string | Date): boolean {
  return isPast(new Date(date))
}

export function getMonthName(date: string | Date): string {
  return format(new Date(date), 'MMM yyyy')
}
