"use client"

import BottomNav from "@/components/shared/BottomNav"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Monitor, ArrowRight, Clock, Heart } from "lucide-react"
import { getEventsForDate, decorate, sectionShort } from "@/lib/events"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type DayInfo = { date: Date; label: string; dayNum: number }
type EventItem = {
  id: number
  title: string
  start: string
  end: string
  tasks: number
  mode: "Online" | "Offline" | "Hybrid"
  bg: string
  deco: string
  section: "Olimpiads" | "Projects" | "Hackathons"
}

function startOfWeek(d: Date, weekStartsOn = 1) {
  const date = new Date(d)
  const day = (date.getDay() + 7 - weekStartsOn) % 7
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

const DOW = ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"]

function modeLabel(mode?: string) {
  if (mode === "Offline") return "Офлайн"
  if (mode === "Hybrid") return "Аралас"
  return "Онлайн"
}

function taskWord(_n: number) {
  return "тапсырма"
}

export default function Page() {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    const todayIdx = (new Date().getDay() + 6) % 7 // 0..6, Monday=0
    return todayIdx
  })
  // Избранное: календарные (fav_cal) — для кнопок "Добавить в календарь"; секционные — для сердца
  const [favCal, setFavCal] = useState<Set<number>>(() => new Set())
  const [favSec, setFavSec] = useState<{ ol: Set<number>; pr: Set<number>; ha: Set<number> }>(() => ({
    ol: new Set<number>(), pr: new Set<number>(), ha: new Set<number>()
  }))

  // Load calendar favorites
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("fav_cal") || "[]")
      const arr = (Array.isArray(raw) ? raw : []).map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n))
      setFavCal(new Set(arr))
    } catch {}
  }, [])

  // Load section favorites (heart)
  useEffect(() => {
    try {
      const toNums = (v: any) => (Array.isArray(v) ? v : []).map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n))
      const ol = new Set<number>(toNums(JSON.parse(localStorage.getItem("fav_ol") || "[]")))
      const pr = new Set<number>(toNums(JSON.parse(localStorage.getItem("fav_pr") || "[]")))
      const ha = new Set<number>(toNums(JSON.parse(localStorage.getItem("fav_ha") || "[]")))
      setFavSec({ ol, pr, ha })
    } catch {}
  }, [])

  // Auth guard
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }: any) => {
      if (!mounted) return
      if (!data?.session) router.replace("/")
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!session) router.replace("/")
    }) as any
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const toggleFav = (ev: EventItem) => {
    const id = ev.id
    const key = sectionShort(ev.section)
    setFavSec((prev) => {
      const next = { ...prev, ol: new Set(prev.ol), pr: new Set(prev.pr), ha: new Set(prev.ha) }
      const setRef = next[key]
      if (setRef.has(id)) setRef.delete(id)
      else setRef.add(id)
      try {
        localStorage.setItem(`fav_${key}`, JSON.stringify([...setRef]))
      } catch {}
      return next
    })
  }

  const { weekDays, monthLabel, selectedDate } = useMemo(() => {
    const today = new Date()
    const start = startOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() + weekOffset * 7))
    const days: DayInfo[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return { date: d, label: DOW[i], dayNum: d.getDate() }
    })
    const sel = new Date(start)
    sel.setDate(start.getDate() + selectedIndex)
    const monthLabel = sel.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    return { weekDays: days, monthLabel, selectedDate: sel }
  }, [weekOffset, selectedIndex])

  const events = useMemo(() => getEventsForDate(selectedDate).map(decorate), [selectedDate])

  return (
    <div className="smooth min-h-screen bg-black text-white pb-28">
      {/* Header */}
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <button
              aria-label="Алдыңғы апта"
              onClick={() => setWeekOffset((w) => w - 1)}
              className="w-9 h-9 rounded-full bg-neutral-900 border-2 border-black grid place-items-center shadow-[0_4px_0_#000] hover:bg-neutral-800 transition pressable"
            >
              <ChevronLeft className="size-4" />
            </button>
            <h1 className="font-serif text-2xl md:text-3xl tracking-wide">Күнтізбе</h1>
            <button
              aria-label="Келесі апта"
              onClick={() => setWeekOffset((w) => w + 1)}
              className="w-9 h-9 rounded-full bg-neutral-900 border-2 border-black grid place-items-center shadow-[0_4px_0_#000] hover:bg-neutral-800 transition pressable"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-4 text-center text-neutral-300">{monthLabel}</div>

          {/* Week strip */}
          <div className="mt-3 rounded-2xl bg-neutral-900 border-2 border-black shadow-[0_6px_0_#000] p-3">
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {weekDays.map((d, i) => {
                const active = i === selectedIndex
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedIndex(i)}
                    className={`flex flex-col items-center gap-1 rounded-xl py-2 transition border-2 border-black shadow-[0_4px_0_#000] pressable ${
                      active ? "bg-white text-black" : "bg-black/40"
                    }`}
                  >
                    <span className="text-xs md:text-sm opacity-80">{d.label}</span>
                    <span className={`h-8 w-8 md:h-9 md:w-9 grid place-items-center rounded-full ${
                      active ? "bg-black text-white" : "bg-white/10"
                    }`}>
                      {d.dayNum}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 mt-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl">Іс-шаралар</h2>
            <div className="text-sm text-neutral-400 flex items-center gap-3">
              <button className="hover:text-white transition pressable">Барлығы</button>
              <span>Оқылмағандар</span>
            </div>
          </div>

          <div className="mt-3 space-y-4">
            {events.map((ev, i) => (
              <article
                key={ev.id}
                className={`${ev.bg} reveal-card relative overflow-hidden rounded-2xl md:rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-4 text-black transition-transform hover:-translate-y-0.5`}
                style={{}}
              >
                {/* Decorative shape */}
                <svg
                  aria-hidden
                  width="180"
                  height="180"
                  viewBox="0 0 200 200"
                  className="absolute -right-10 -bottom-10 opacity-70"
                >
                  <path fill={ev.deco} d="M55-61.6c18.2-24.2 58.2-23.1 76.5 1.1 18.3 24.2 9.6 69.7-15.7 90.5-25.3 20.8-66.1 17-86.6-6.8C9.7-0.6 36.8-37.4 55-61.6z" />
                </svg>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg md:text-xl break-words pr-14">{ev.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <Clock className="size-4" />
                      <span>
                        {ev.start}–{ev.end}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm opacity-80 whitespace-nowrap">
                    {ev.tasks} {taskWord(ev.tasks)}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Monitor className="size-4" />
                  <span> {modeLabel(ev.mode)}</span>
                </div>

                {/* Heart toggle */}
                <button
                  type="button"
                  onClick={() => toggleFav(ev as EventItem)}
                  aria-pressed={favSec[sectionShort(ev.section)].has(ev.id as number)}
                  className="btn-heart absolute right-3 top-3 z-10 w-9 h-9 rounded-full bg-white/70 border-2 border-black grid place-items-center text-black hover:bg-white transition"
                >
                  <Heart className={`heart-icon ${favSec[sectionShort(ev.section)].has(ev.id as number) ? "size-4 text-red-600" : "size-4"}`} fill={favSec[sectionShort(ev.section)].has(ev.id as number) ? "currentColor" : "none"} />
                </button>

                {/* Clickable overlay to open details */}
                <Link href={`/calendar/${ev.id}`} className="absolute inset-0 z-[5]" aria-label={`Открыть ${ev.title}`}>
                  <span className="sr-only">Открыть</span>
                </Link>
                <div className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-black/60 border-2 border-black grid place-items-center text-white pointer-events-none">
                  <ArrowRight className="size-4" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
