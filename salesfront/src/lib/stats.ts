import { dayKey, parseDay } from './format'
import type { Produit, Vente } from './types'

export const LOW_STOCK = 5

export type StockLevel = 'out' | 'low' | 'ok'

export function stockLevel(qte: number): StockLevel {
  if (qte <= 0) return 'out'
  if (qte <= LOW_STOCK) return 'low'
  return 'ok'
}

/**
 * Sales carry no price of their own, so an amount is the quantity at the product's
 * current list price.
 */
export function amountOf(vente: Vente): number {
  return vente.quantite * (vente.produit?.prix ?? 0)
}

export type Period = '7d' | '14d' | '30d' | 'all'

const periodDays: Record<Exclude<Period, 'all'>, number> = { '7d': 7, '14d': 14, '30d': 30 }

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function inPeriod(ventes: Vente[], period: Period): Vente[] {
  if (period === 'all') return ventes
  const days = periodDays[period]
  const from = startOfToday()
  from.setDate(from.getDate() - (days - 1))
  return ventes.filter((v) => parseDay(v.date) >= from)
}

export interface Bucket {
  key: string
  start: Date
  total: number
  count: number
}

/** Daily buckets for 7 and 30 days; monthly buckets for the last 12 months otherwise. */
export function buckets(ventes: Vente[], period: Period): Bucket[] {
  const today = startOfToday()
  const result: Bucket[] = []
  const index = new Map<string, Bucket>()

  if (period === 'all') {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const bucket = { key: dayKey(start).slice(0, 7), start, total: 0, count: 0 }
      result.push(bucket)
      index.set(bucket.key, bucket)
    }
    for (const v of ventes) {
      const bucket = index.get(v.date.slice(0, 7))
      if (bucket) {
        bucket.total += amountOf(v)
        bucket.count += 1
      }
    }
    return result
  }

  const days = periodDays[period]
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(today)
    start.setDate(today.getDate() - i)
    const bucket = { key: dayKey(start), start, total: 0, count: 0 }
    result.push(bucket)
    index.set(bucket.key, bucket)
  }
  for (const v of ventes) {
    const bucket = index.get(v.date.slice(0, 10))
    if (bucket) {
      bucket.total += amountOf(v)
      bucket.count += 1
    }
  }
  return result
}

export interface ProductRank {
  produit: Produit
  units: number
  revenue: number
}

export function rankProducts(ventes: Vente[]): ProductRank[] {
  const map = new Map<number, ProductRank>()
  for (const v of ventes) {
    if (!v.produit) continue
    const entry = map.get(v.produit.id) ?? { produit: v.produit, units: 0, revenue: 0 }
    entry.units += v.quantite
    entry.revenue += amountOf(v)
    map.set(v.produit.id, entry)
  }
  return [...map.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue)
}

export function salesByProduct(ventes: Vente[]): Map<number, { units: number; count: number }> {
  const map = new Map<number, { units: number; count: number }>()
  for (const v of ventes) {
    if (!v.produit) continue
    const entry = map.get(v.produit.id) ?? { units: 0, count: 0 }
    entry.units += v.quantite
    entry.count += 1
    map.set(v.produit.id, entry)
  }
  return map
}

export function salesByClient(ventes: Vente[]): Map<number, { count: number; total: number; last: string | null }> {
  const map = new Map<number, { count: number; total: number; last: string | null }>()
  for (const v of ventes) {
    if (!v.client) continue
    const entry = map.get(v.client.id) ?? { count: 0, total: 0, last: null }
    entry.count += 1
    entry.total += amountOf(v)
    if (!entry.last || v.date > entry.last) entry.last = v.date
    map.set(v.client.id, entry)
  }
  return map
}

/** Newest first: by day, then by slip number within a day. */
export function newestFirst(a: Vente, b: Vente): number {
  return b.date.localeCompare(a.date) || b.id - a.id
}
