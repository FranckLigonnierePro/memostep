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
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return `il y a ${diff}s`
  const m = Math.floor(diff / 60)
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  const days = Math.floor(h / 24)
  return `il y a ${days}j`
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
      timestamp: ts,
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
<h2 class="text-xl font-bold tracking-tight">Nos derniers donateurs</h2>

<!-- Loading state -->
<div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
<div v-for="n in 6" :key="n" class="animate-pulse rounded-2xl p-4 border border-white/10 bg-white/5 dark:bg-white/5">
<div class="flex items-center gap-3">
<div class="w-12 h-12 rounded-full bg-white/20" />
<div class="flex-1 space-y-2">
<div class="h-3 w-1/3 bg-white/20 rounded" />
<div class="h-3 w-1/4 bg-white/20 rounded" />
</div>
</div>
<div class="h-3 w-2/3 bg-white/20 rounded mt-4" />
</div>
</div>


<!-- Error state -->
<div v-else-if="error" class="p-4 rounded-xl border border-red-300/50 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200">
Une erreur est survenue : {{ error }}
</div>


<!-- Empty state -->
<div v-else-if="!donors.length" class="p-6 rounded-xl border border-white/10 bg-white/5 text-sm opacity-80">
Aucun don pour le moment. Sois le premier à soutenir 💜
</div>


<!-- Donors grid -->
<ul v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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