import { daysInclusive, formatDate, isoDate } from './format'
import type { Booking, VehicleType } from './types'

/** Small helpers that make the UI talk like a person instead of a database. */

export function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'Up late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export const TYPE_BLURB: Record<VehicleType, string> = {
  HATCHBACK: 'Zippy, thrifty and easy to park',
  SEDAN: 'A smooth, quiet highway cruiser',
  SUV: 'Room for the gang and the luggage',
  MUV: 'Made for big family road trips',
  LUXURY: 'For when you want to arrive in style',
}

/** A friendly one-liner describing where a booking is in its life. */
export function tripMood(b: Booking, today = isoDate(new Date())): { text: string; tone: 'info' | 'warn' | 'good' | 'bad' } {
  if (b.status === 'RETURNED') return { text: "Thanks for bringing it back! We're giving it a quick once-over.", tone: 'warn' }
  if (b.status === 'COMPLETED') {
    return b.damageReported
      ? { text: `Our team noted: ${b.inspectionNotes}`, tone: 'bad' }
      : { text: `All good on inspection${b.inspectionNotes ? ` - "${b.inspectionNotes}"` : ''}. Hope you enjoyed the ride!`, tone: 'good' }
  }
  if (today < b.startDate) {
    const n = daysInclusive(today, b.startDate) - 1
    return { text: n === 1 ? 'Your trip starts tomorrow. Time to plan the playlist!' : `Your trip starts in ${n} days.`, tone: 'info' }
  }
  if (today <= b.endDate) {
    const day = daysInclusive(b.startDate, today)
    return { text: `You're on the road, day ${day} of ${b.days}. Drive safe!`, tone: 'info' }
  }
  return { text: `This was due back on ${formatDate(b.endDate)}. Please return it when you can.`, tone: 'warn' }
}
