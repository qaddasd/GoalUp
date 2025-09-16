import rawEvents from "@/data/events.json"

export type Section = "Olimpiads" | "Projects" | "Hackathons"

export type EventItem = {
  id: number
  title: string
  section: Section
  category?: string
  description?: string
  classes?: { min?: number; max?: number }
  age?: { min?: number; max?: number }
  link?: string
  award?: string
  mode?: "Online" | "Offline" | "Hybrid"
  date: { start: string; end: string }
}

export const EVENTS: EventItem[] = (rawEvents as EventItem[]).map((e) => ({ ...e }))

const BG_POOL = [
  "bg-[#c4c8ff]",
  "bg-[#ffb08f]",
  "bg-[#d6ff1f]",
  "bg-[var(--color-accent-yellow)]",
  "bg-[var(--color-brand-lime)]",
]
const DECO_COLORS = ["#A29BFE", "#FF7F50", "#9AE114", "#FFCD29", "#B19CD9"]

export function sectionShort(s: Section): "ol" | "pr" | "ha" {
  if (s === "Olimpiads") return "ol"
  if (s === "Projects") return "pr"
  return "ha"
}

export function shortToSection(k: string): Section | null {
  if (k === "ol") return "Olimpiads"
  if (k === "pr") return "Projects"
  if (k === "ha") return "Hackathons"
  return null
}

export function getEventById(id: number): EventItem | undefined {
  return EVENTS.find((e) => e.id === id)
}

export function getEventsBySection(section: Section): EventItem[] {
  return EVENTS.filter((e) => e.section === section)
}

export function isClassEligible(e: EventItem, cls?: number): boolean {
  if (!e.classes) return true
  if (cls === undefined || cls === null) return true
  const { min, max } = e.classes
  if (typeof min === "number" && cls < min) return false
  if (typeof max === "number" && cls > max) return false
  return true
}

export function getCategories(): string[] {
  const set = new Set<string>()
  for (const e of EVENTS) if (e.category) set.add(e.category)
  return Array.from(set)
}

function parseLocalYMD(iso: string): Date {
  // Parse 'YYYY-MM-DD' as a local date to avoid TZ shifts
  const [y, m, d] = iso.split("-").map((n) => Number(n))
  return new Date(y, (m || 1) - 1, d || 1)
}

export function dateInRange(day: Date, range: { start: string; end: string }): boolean {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const s = parseLocalYMD(range.start)
  const e = parseLocalYMD(range.end)
  s.setHours(0, 0, 0, 0)
  e.setHours(0, 0, 0, 0)
  return d >= s && d <= e
}

export function getEventsForDate(day: Date): EventItem[] {
  return EVENTS.filter((e) => dateInRange(day, e.date))
}

export function formatTime(n: number) {
  return String(n).padStart(2, "0") + ":00"
}

export function computedTimesForEvent(e: EventItem) {
  // Deterministic pseudo schedule per event id
  const base = e.id % 6 // 0..5
  const startH = 9 + base
  const endH = startH + 2
  return { start: formatTime(startH), end: formatTime(endH) }
}

export function computedTasksForEvent(e: EventItem) {
  return 1 + (e.id % 3)
}

export function computedVisualsForEvent(e: EventItem) {
  const bg = BG_POOL[e.id % BG_POOL.length]
  const deco = DECO_COLORS[e.id % DECO_COLORS.length]
  return { bg, deco }
}

export function decorate(e: EventItem) {
  return { ...e, ...computedTimesForEvent(e), tasks: computedTasksForEvent(e), ...computedVisualsForEvent(e) }
}
