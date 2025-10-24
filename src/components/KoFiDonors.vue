<script setup lang="ts">
import { ref, onMounted } from 'vue'

type Donor = {
  id?: string | number
  avatar_url?: string
  is_public?: boolean
  from_name?: string
  timestamp?: string | number | Date
  amount?: number
  currency?: string
  message?: string
}

const props = defineProps<{
  src: string
  color?: string
  limit?: number
}>()

const color = props.color ?? '#7b2cff'
const loading = ref(true)
const error = ref<string | null>(null)
const donors = ref<Donor[]>([])

function initials(name?: string) {
  const s = (name || '').trim()
  if (!s) return '?'
  const parts = s.split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (first + last).toUpperCase() || first.toUpperCase() || '?'
}

function timeAgo(input?: string | number | Date) {
  if (!input) return ''
  const d = new Date(input)
  if (isNaN(d.getTime())) return ''
  const seconds = Math.trunc((d.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat((typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'fr-FR', { numeric: 'auto' })
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, 'second')
  const minutes = Math.trunc(seconds / 60)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  const hours = Math.trunc(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  const days = Math.trunc(hours / 24)
  return rtf.format(days, 'day')
}

function formatAmount(amount?: number, currency?: string) {
  const value = typeof amount === 'number' ? amount : 0
  const cur = (currency || 'EUR').toUpperCase()
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${value} ${cur}`
  }
}

// --- CSV support ---
function parseCsv(text: string): Record<string, string>[] {
  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  const rows: string[][] = []
  let cur = ''
  let field: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
      } else {
        cur += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        field.push(cur); cur = ''
      } else if (ch === '\n') {
        field.push(cur); rows.push(field); field = []; cur = ''
      } else if (ch === '\r') {
        // ignore
      } else {
        cur += ch
      }
    }
  }
  if (cur.length > 0 || field.length > 0) { field.push(cur); rows.push(field) }
  if (rows.length === 0) return []
  const headers = rows[0].map(h => h.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim())
  const out: Record<string, string>[] = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (row.length === 1 && row[0].trim() === '') continue
    const obj: Record<string, string> = {}
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c]
      const val = (row[c] ?? '').trim()
      obj[key] = val
    }
    out.push(obj)
  }
  return out
}

function toNumberEU(s?: string): number | undefined {
  if (!s) return undefined
  const n = parseFloat(String(s).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

function normalizeUtc(s: string): string {
  const t = s.trim()
  if (!t) return t
  // If timezone information already present, keep as-is
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(t)) return t
  // Replace space with 'T' if present and append 'Z' to mark UTC
  return t.replace(' ', 'T') + 'Z'
}

function mapCsvDonors(rows: Record<string, string>[]): Donor[] {
  return rows.map((r, idx) => {
    // handle potential quoted/bom headers
    const name = r['Name'] ?? r['"Name"'] ?? r['﻿"Name"'] ?? r['\ufeffName']
    const ts = r['LastSupportedDateUTC']
    const total = r['Total']
    return {
      id: r['LastestTransactionId'] || idx,
      from_name: name,
      is_public: true,
      timestamp: ts ? normalizeUtc(ts) : undefined,
      amount: toNumberEU(total),
      currency: 'EUR',
      message: undefined,
    }
  })
}

onMounted(async () => {
  try {
    if (!props.src) throw new Error('Aucune source fournie')
    const res = await fetch(props.src, { headers: { 'cache-control': 'no-cache' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const contentType = res.headers.get('content-type') || ''
    if (props.src.toLowerCase().endsWith('.csv') || contentType.includes('text/csv')) {
      const text = await res.text()
      const rows = parseCsv(text)
      let arr = mapCsvDonors(rows)
      donors.value = (props.limit && props.limit > 0) ? arr.slice(0, props.limit) : arr
    } else {
      const data = await res.json()
      const arr: Donor[] = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.donors)
          ? (data as any).donors
          : []
      donors.value = (props.limit && props.limit > 0) ? arr.slice(0, props.limit) : arr
    }
  } catch (e: any) {
    error.value = e?.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
})
</script>


<template>
<section>

<ul class="grid grid-cols-1 gap-4">
<li v-for="(d, i) in donors" :key="d.id || i" class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition">
<div class="flex items-center gap-3">
<div class="shrink-0 w-12 h-12 rounded-full overflow-hidden border" :style="{ borderColor: color }">
<img v-if="d.avatar_url" :src="d.avatar_url" alt="avatar" class="w-full h-full object-cover" />
<div v-else class="w-full h-full flex items-center justify-center text-sm font-semibold" :style="{ background: color + '22', color }">{{ initials(d.is_public === false ? 'Anonyme' : d.from_name) }}</div>
</div>
<div class="flex-1 min-w-0">
<p class="font-semibold truncate">{{ d.is_public === false ? 'Anonyme' : (d.from_name || 'Supporter') }}</p>
<p class="text-xs opacity-70">{{ timeAgo(d.timestamp) }}</p>
</div>
<span class="text-sm font-bold px-2 py-1 rounded-full border" :style="{ borderColor: color, color }">
{{ formatAmount(d.amount, d.currency) }}
</span>
</div>
<p v-if="d.message" class="mt-3 text-sm leading-relaxed">
{{ d.message }}
</p>
</li>
</ul>
</section>
</template>


<style scoped>
:host, section { color: var(--tw-prose-invert); }
</style>