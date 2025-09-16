'use client'

import React, { useEffect, useMemo, useState } from "react"
import BottomNav from "@/components/shared/BottomNav"
import Link from "next/link"
import { User, Heart, Clock, Tag, Monitor, SlidersHorizontal } from "lucide-react"
import { decorate, getEventsBySection, isClassEligible, getCategories } from "@/lib/events"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { setCookie, getCookie } from "@/lib/cookies"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const CLASS_LEVELS = [7, 8, 9, 10, 11, 12] as const

export default function Page() {
  // Derived lists from unified dataset by section
  const [selectedClass, setSelectedClass] = useState<number>(9)
  const router = useRouter()
  // Filters state
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedModes, setSelectedModes] = useState<Set<string>>(new Set())
  const [sectionEnabled, setSectionEnabled] = useState<{ ol: boolean; pr: boolean; ha: boolean }>({ ol: true, pr: true, ha: true })
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const allCategories = useMemo(() => getCategories(), [])
  const olympiads = useMemo(
    () => getEventsBySection("Olimpiads").filter((e) => isClassEligible(e, selectedClass)).map(decorate),
    [selectedClass]
  )
  const projects = useMemo(
    () => getEventsBySection("Projects").filter((e) => isClassEligible(e, selectedClass)).map(decorate),
    [selectedClass]
  )
  const hackathons = useMemo(
    () => getEventsBySection("Hackathons").filter((e) => isClassEligible(e, selectedClass)).map(decorate),
    [selectedClass]
  )

  // Desktop: show part of items initially, reveal the rest with "Еще"
  const INITIAL_SHOW = 6
  const [olShow, setOlShow] = useState(INITIAL_SHOW)
  const [prShow, setPrShow] = useState(INITIAL_SHOW)
  const [haShow, setHaShow] = useState(INITIAL_SHOW)
  
  // Favorites per section (persisted in localStorage)
  const [favOl, setFavOl] = useState<Set<number>>(() => new Set())
  const [favPr, setFavPr] = useState<Set<number>>(() => new Set())
  const [favHa, setFavHa] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem("fav_ol") || "[]")
      const p = JSON.parse(localStorage.getItem("fav_pr") || "[]")
      const h = JSON.parse(localStorage.getItem("fav_ha") || "[]")
      const toNums = (arr: any) => (Array.isArray(arr) ? arr : []).map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n))
      setFavOl(new Set(toNums(o)))
      setFavPr(new Set(toNums(p)))
      setFavHa(new Set(toNums(h)))
    } catch {}
  }, [])

  // Load saved filters
  useEffect(() => {
    try {
      const cats = JSON.parse(localStorage.getItem("filters_categories") || "[]")
      if (Array.isArray(cats)) setSelectedCategories(new Set(cats.filter((x) => typeof x === 'string')))
      const modes = JSON.parse(localStorage.getItem("filters_modes") || "[]")
      if (Array.isArray(modes)) setSelectedModes(new Set(modes.filter((x) => x === 'Online' || x === 'Offline' || x === 'Hybrid')))
      const sect = JSON.parse(localStorage.getItem("filters_sections") || "")
      if (sect && typeof sect === 'object') setSectionEnabled({ ol: sect.ol !== false, pr: sect.pr !== false, ha: sect.ha !== false })
      const df = localStorage.getItem("filters_dateFrom") || ""
      const dt = localStorage.getItem("filters_dateTo") || ""
      setDateFrom(df)
      setDateTo(dt)
    } catch {}
  }, [])

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem("filters_categories", JSON.stringify(Array.from(selectedCategories)))
      localStorage.setItem("filters_modes", JSON.stringify(Array.from(selectedModes)))
      localStorage.setItem("filters_sections", JSON.stringify(sectionEnabled))
      localStorage.setItem("filters_dateFrom", dateFrom || "")
      localStorage.setItem("filters_dateTo", dateTo || "")
    } catch {}
  }, [selectedCategories, selectedModes, sectionEnabled, dateFrom, dateTo])

  // Auth guard: redirect to onboarding if no session
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

  // Fallback: set class from user metadata if not present in localStorage
  useEffect(() => {
    const exists = (() => {
      try { return !!localStorage.getItem("userClass") } catch { return false }
    })()
    if (!exists) {
      // 1) Try cookie first
      try {
        const fromCookie = getCookie("userClass")
        const n = parseInt(String(fromCookie ?? ""), 10)
        if (Number.isFinite(n) && [7,8,9,10,11,12].includes(n)) {
          localStorage.setItem("userClass", String(n))
          setSelectedClass(n)
          return
        }
      } catch {}
      // 2) Fallback to Supabase metadata
      supabase.auth.getUser().then(({ data }: any) => {
        const cls = data?.user?.user_metadata?.class
        const n = parseInt(cls, 10)
        if (Number.isFinite(n)) {
          try { localStorage.setItem("userClass", String(n)) } catch {}
          if ([7,8,9,10,11,12].includes(n)) setSelectedClass(n)
        }
      })
    }
  }, [])

  const toggleFav = (section: "ol" | "pr" | "ha", id: number) => {
    if (section === "ol") {
      setFavOl((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        try { localStorage.setItem("fav_ol", JSON.stringify([...next])) } catch {}
        return next
      })
    } else if (section === "pr") {
      setFavPr((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        try { localStorage.setItem("fav_pr", JSON.stringify([...next])) } catch {}
        return next
      })
    } else {
      setFavHa((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        try { localStorage.setItem("fav_ha", JSON.stringify([...next])) } catch {}
        return next
      })
    }
  }
  // Load default class from registration (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("userClass") || ""
      const n = parseInt(raw, 10)
      if (!Number.isNaN(n) && CLASS_LEVELS.includes(n as (typeof CLASS_LEVELS)[number])) {
        setSelectedClass(n)
      } else if (raw === "university" || raw === "graduate") {
        setSelectedClass(12)
      }
    } catch {}
  }, [])

  // Helper: does event pass current filters (besides class and section)?
  const passesFilters = (e: any) => {
    // Category
    if (selectedCategories.size > 0) {
      const cat = (e.category || "").toString()
      if (!selectedCategories.has(cat)) return false
    }
    // Mode
    if (selectedModes.size > 0) {
      if (!selectedModes.has(e.mode)) return false
    }
    // Date range (compare YYYY-MM-DD strings)
    const s = e.date?.start || ""
    const en = e.date?.end || ""
    if (dateFrom && en && en < dateFrom) return false // event ends before from
    if (dateTo && s && s > dateTo) return false // event starts after to
    return true
  }

  // Apply filters
  const olympiadsFiltered = useMemo(() => olympiads.filter(passesFilters), [olympiads, selectedCategories, selectedModes, dateFrom, dateTo])
  const prFiltered = useMemo(() => projects.filter(passesFilters), [projects, selectedCategories, selectedModes, dateFrom, dateTo])
  const hackathonsFiltered = useMemo(() => hackathons.filter(passesFilters), [hackathons, selectedCategories, selectedModes, dateFrom, dateTo])

  // Clamp visible count when class changes
  useEffect(() => {
    setOlShow(Math.min(INITIAL_SHOW, olympiadsFiltered.length))
    setPrShow(Math.min(INITIAL_SHOW, prFiltered.length))
    setHaShow(Math.min(INITIAL_SHOW, hackathonsFiltered.length))
  }, [selectedClass, prFiltered.length, olympiadsFiltered.length, hackathonsFiltered.length])

  const revealSequentially = (
    current: number,
    total: number,
    setter: (n: number) => void
  ) => {
    let i = current
    const int = window.setInterval(() => {
      i += 1
      setter(i)
      if (i >= total) window.clearInterval(int)
    }, 120)
  }
  return (
    <div className="smooth min-h-screen bg-black text-white pb-28">
      {/* Top header */}
      <header className="px-4 pt-6 pb-3">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar icon */}
              <div className="w-10 h-10 rounded-full bg-white border-2 border-black shadow-[0_4px_0_#000] grid place-items-center">
                <User className="text-black size-5" />
              </div>
              <div className="leading-tight">
                <a className="text-lg font-medium text-[var(--color-hero-purple)] underline underline-offset-4">Сәлем!</a>
              </div>
            </div>
            <button
              onClick={() => setFilterOpen(true)}
              aria-label="Сүзгілер"
              className="rounded-full px-4 py-2 bg-neutral-900 border-2 border-black shadow-[0_4px_0_#000] hover:bg-neutral-800 text-white pressable"
            >
              <span className="inline-flex items-center gap-2"><SlidersHorizontal className="size-4" /> Сүзгілер</span>
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="px-4">
        <div className="mx-auto max-w-5xl">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {CLASS_LEVELS.map((cls) => (
            <button
              key={cls}
              onClick={() => {
                setSelectedClass(cls)
                try { localStorage.setItem("userClass", String(cls)); setCookie("userClass", String(cls)) } catch {}
              }}
              className={
                `shrink-0 rounded-full px-4 py-2 border-2 border-black shadow-[0_4px_0_#000] ` +
                (selectedClass === cls
                  ? "bg-[var(--color-brand-lime)] text-black"
                  : "bg-neutral-900 text-white pressable")
              }
            >
              {cls}
            </button>
          ))}
        </div>
        </div>
      </div>

      <main className="px-4 mt-6 space-y-8">
        <div className="mx-auto max-w-5xl space-y-8">
        {/* Olimpiads */}
        {sectionEnabled.ol && (
        <section>
          <h2 className="font-serif text-xl mb-3">Олимпиадалар</h2>
          <hr className="border-neutral-800 mb-4" />
          {/* Mobile: horizontal carousel */}
          <div className="flex md:hidden gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
            {olympiadsFiltered.map((it) => (
              <article
                key={`ol-${it.id}`}
                className={`reveal-card min-w-[260px] snap-start relative overflow-hidden rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-3 ${it.bg} text-black`}
              >
                <button
                  type="button"
                  onClick={() => toggleFav("ol", it.id)}
                  aria-pressed={favOl.has(it.id)}
                  className="btn-heart absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/50 border-2 border-black grid place-items-center transition-colors hover:bg-white"
                >
                  <Heart className={`heart-icon ${favOl.has(it.id) ? "size-4 text-red-600" : "size-4 text-black"}`} fill={favOl.has(it.id) ? "currentColor" : "none"} />
                </button>
                {/* Overlay to open details */}
                <Link href={`/calendar/${it.id}`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${it.title}`}>
                  <span className="sr-only">Ашу</span>
                </Link>
                <h3 className="font-semibold">{it.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 gap-y-1 text-[11px] overflow-hidden">
                  <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Clock className="size-3" /> {it.start}–{it.end}</span>
                  {("category" in it) && <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3 max-w-[180px] truncate"><Tag className="size-3" /> {(it as any).category}</span>}
                  <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Monitor className="size-3" /> {it.mode === 'Offline' ? 'Офлайн' : it.mode === 'Hybrid' ? 'Аралас' : 'Онлайн'}</span>
                </div>
              </article>
            ))}
          </div>
          {/* Desktop: grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
            {olympiadsFiltered.slice(0, olShow).map((it) => (
              <article
                key={`olg-${it.id}`}
                className={`reveal-card relative overflow-hidden rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-3 ${it.bg} text-black`}
              >
                <button
                  type="button"
                  onClick={() => toggleFav("ol", it.id)}
                  aria-pressed={favOl.has(it.id)}
                  className="btn-heart absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/50 border-2 border-black grid place-items-center transition-colors hover:bg-white"
                >
                  <Heart className={`heart-icon ${favOl.has(it.id) ? "size-4 text-red-600" : "size-4 text-black"}`} fill={favOl.has(it.id) ? "currentColor" : "none"} />
                </button>
                {/* Overlay to open details */}
                <Link href={`/calendar/${it.id}`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${it.title}`}>
                  <span className="sr-only">Ашу</span>
                </Link>
                <h3 className="font-semibold">{it.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 gap-y-1 text-[11px]">
                  <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Clock className="size-3" /> {it.start}–{it.end}</span>
                  {("category" in it) && <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3 max-w-[200px] truncate"><Tag className="size-3" /> {(it as any).category}</span>}
                  <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Monitor className="size-3" /> {it.mode === 'Offline' ? 'Офлайн' : it.mode === 'Hybrid' ? 'Аралас' : 'Онлайн'}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden md:flex justify-center mt-4">
            {olShow < olympiadsFiltered.length ? (
              <button
                onClick={() => revealSequentially(olShow, olympiadsFiltered.length, setOlShow)}
                className="rounded-full px-6 py-2 bg-neutral-900 border-2 border-black shadow-[0_4px_0_#000] hover:bg-neutral-800 pressable"
              >
                Көбірек
              </button>
            ) : (
              olympiadsFiltered.length > INITIAL_SHOW && (
                <button
                  onClick={() => setOlShow(INITIAL_SHOW)}
                  className="rounded-full px-6 py-2 bg-neutral-900 border-2 border-black shadow-[0_4px_0_#000] hover:bg-neutral-800 pressable"
                >
                  Жабу
                </button>
              )
            )}
          </div>
        </section>
        )}

        {/* Projects */}
        {sectionEnabled.pr && (
        <section>
          <h2 className="font-serif text-xl mb-3">Жобалар</h2>
          <hr className="border-neutral-800 mb-4" />
          {/* Mobile */}
          <div className="flex md:hidden gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
            {prFiltered.map((it) => (
              <article
                key={`pr-${it.id}`}
                className={`reveal-card min-w-[260px] snap-start relative overflow-hidden rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-3 ${it.bg} text-black`}
              >
                <button
                  type="button"
                  onClick={() => toggleFav("pr", it.id)}
                  aria-pressed={favPr.has(it.id)}
                  className="btn-heart absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/50 border-2 border-black grid place-items-center transition-colors hover:bg-white"
                >
                  <Heart className={`heart-icon ${favPr.has(it.id) ? "size-4 text-red-600" : "size-4 text-black"}`} fill={favPr.has(it.id) ? "currentColor" : "none"} />
                </button>
                {/* Overlay to open details */}
                <Link href={`/calendar/${it.id}`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${it.title}`}>
                  <span className="sr-only">Ашу</span>
                </Link>
                <h3 className="font-semibold">{it.title}</h3>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Clock className="size-3" /> {it.start}–{it.end}</span>
                  {("category" in it) && <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Tag className="size-3" /> {(it as any).category}</span>}
                  <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Monitor className="size-3" /> {it.mode === 'Offline' ? 'Офлайн' : it.mode === 'Hybrid' ? 'Аралас' : 'Онлайн'}</span>
                </div>
              </article>
            ))}
          </div>
          {/* Desktop */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
            {prFiltered.slice(0, prShow).map((it) => (
              <article
                key={`prg-${it.id}`}
                className={`reveal-card relative overflow-hidden rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-3 ${it.bg} text-black`}
              >
                <button
                  type="button"
                  onClick={() => toggleFav("pr", it.id)}
                  aria-pressed={favPr.has(it.id)}
                  className="btn-heart absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/50 border-2 border-black grid place-items-center transition-colors hover:bg-white"
                >
                  <Heart className={`heart-icon ${favPr.has(it.id) ? "size-4 text-red-600" : "size-4 text-black"}`} fill={favPr.has(it.id) ? "currentColor" : "none"} />
                </button>
                {/* Overlay to open details */}
                <Link href={`/calendar/${it.id}`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${it.title}`}>
                  <span className="sr-only">Ашу</span>
                </Link>
                <h3 className="font-semibold">{it.title}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 gap-y-1 text-[11px]">
                  <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Clock className="size-3" /> {it.start}–{it.end}</span>
                  {("category" in it) && <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3 max-w-[200px] truncate"><Tag className="size-3" /> {(it as any).category}</span>}
                  <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Monitor className="size-3" /> {it.mode ?? 'Онлайн'}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden md:flex justify-center mt-4">
            {prShow < prFiltered.length ? (
              <button
                onClick={() => revealSequentially(prShow, prFiltered.length, setPrShow)}
                className="rounded-full px-6 py-2 bg-neutral-900 border-2 border-black shadow-[0_4px_0_#000] hover:bg-neutral-800 pressable"
              >
                Көбірек
              </button>
            ) : (
              prFiltered.length > INITIAL_SHOW && (
                <button
                  onClick={() => setPrShow(INITIAL_SHOW)}
                  className="rounded-full px-6 py-2 bg-neutral-900 border-2 border-black shadow-[0_4px_0_#000] hover:bg-neutral-800 pressable"
                >
                  Жабу
                </button>
              )
            )}
          </div>
        </section>
        )}

  {/* Hackathons */}
  {sectionEnabled.ha && (
  <section>
    <h2 className="font-serif text-xl mb-3">Хакатондар</h2>
    <hr className="border-neutral-800 mb-4" />
    {/* Mobile */}
    <div className="flex md:hidden gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
      {hackathonsFiltered.map((it) => (
        <article
          key={`ha-${it.id}`}
          className={`reveal-card min-w-[260px] snap-start relative rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-3 ${it.bg} text-black`}
        >
          <button
            type="button"
            onClick={() => toggleFav("ha", it.id)}
            aria-pressed={favHa.has(it.id)}
            className="btn-heart absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/50 border-2 border-black grid place-items-center transition-colors hover:bg-white"
          >
            <Heart className={`heart-icon ${favHa.has(it.id) ? "size-4 text-red-600" : "size-4 text-black"}`} fill={favHa.has(it.id) ? "currentColor" : "none"} />
          </button>
          {/* Overlay to open details */}
          <Link href={`/calendar/${it.id}`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${it.title}`}>
            <span className="sr-only">Ашу</span>
          </Link>
          <h3 className="font-semibold">{it.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Clock className="size-3" /> {it.start}–{it.end}</span>
            {("category" in it) && <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Tag className="size-3" /> {(it as any).category}</span>}
            <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Monitor className="size-3" /> {it.mode === 'Offline' ? 'Офлайн' : it.mode === 'Hybrid' ? 'Аралас' : 'Онлайн'}</span>
          </div>
        </article>
      ))}
    </div>
    {/* Desktop */}
    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
      {hackathonsFiltered.slice(0, haShow).map((it) => (
        <article
          key={`hag-${it.id}`}
          className={`reveal-card relative rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-3 ${it.bg} text-black`}
        >
          <button
            type="button"
            onClick={() => toggleFav("ha", it.id)}
            aria-pressed={favHa.has(it.id)}
            className="btn-heart absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/50 border-2 border-black grid place-items-center transition-colors hover:bg-white"
          >
            <Heart className={`heart-icon ${favHa.has(it.id) ? "size-4 text-red-600" : "size-4 text-black"}`} fill={favHa.has(it.id) ? "currentColor" : "none"} />
          </button>
          {/* Overlay to open details */}
          <Link href={`/calendar/${it.id}`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${it.title}`}>
            <span className="sr-only">Ашу</span>
          </Link>
          <h3 className="font-semibold">{it.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 gap-y-1 text-[11px]">
            <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Clock className="size-3" /> {it.start}–{it.end}</span>
            {("category" in it) && <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3 max-w-[200px] truncate"><Tag className="size-3" /> {(it as any).category}</span>}
            <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Monitor className="size-3" /> {it.mode ?? 'Онлайн'}</span>
          </div>
        </article>
      ))}
    </div>
    <div className="hidden md:flex justify-center mt-4">
      {haShow < hackathonsFiltered.length ? (
        <button
          onClick={() => revealSequentially(haShow, hackathonsFiltered.length, setHaShow)}
          className="rounded-full px-6 py-2 bg-neutral-900 border-2 border-black shadow-[0_4px_0_#000] hover:bg-neutral-800 pressable"
        >
          Көбірек
        </button>
      ) : (
        hackathonsFiltered.length > INITIAL_SHOW && (
          <button
            onClick={() => setHaShow(INITIAL_SHOW)}
            className="rounded-full px-6 py-2 bg-neutral-900 border-2 border-black shadow-[0_4px_0_#000] hover:bg-neutral-800 pressable"
          >
            Жабу
          </button>
        )
      )}
    </div>
  </section>
  )}
        </div>
      </main>

      <BottomNav />

      {/* Filters Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="bg-white text-black border-2 border-black rounded-l-3xl">
          <SheetHeader>
            <SheetTitle className="text-xl">Сүзгілер</SheetTitle>
          </SheetHeader>
          <div className="px-4 space-y-6">
            {/* Sections */}
            <div>
              <div className="font-medium mb-2">Бөлімдер</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'ol', label: 'Олимпиадалар' },
                  { key: 'pr', label: 'Жобалар' },
                  { key: 'ha', label: 'Хакатондар' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSectionEnabled((prev) => ({ ...prev, [s.key]: !prev[s.key as 'ol'|'pr'|'ha'] }))}
                    aria-pressed={sectionEnabled[s.key as 'ol'|'pr'|'ha']}
                    className={`rounded-full px-4 py-2 border-2 border-black shadow-[0_4px_0_#000] ${sectionEnabled[s.key as 'ol'|'pr'|'ha'] ? 'bg-[var(--color-brand-lime)] text-black -translate-y-0.5' : 'bg-neutral-200 text-black hover:-translate-y-0.5'} pressable`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modes */}
            <div>
              <div className="font-medium mb-2">Формат</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { k: 'Online', label: 'Онлайн' },
                  { k: 'Offline', label: 'Офлайн' },
                  { k: 'Hybrid', label: 'Аралас' },
                ].map((m) => (
                  <button
                    key={m.k}
                    type="button"
                    onClick={() => setSelectedModes((prev) => {
                      const n = new Set(prev)
                      if (n.has(m.k)) n.delete(m.k); else n.add(m.k)
                      return n
                    })}
                    aria-pressed={selectedModes.has(m.k)}
                    className={`rounded-full px-4 py-2 border-2 border-black shadow-[0_4px_0_#000] ${selectedModes.has(m.k) ? 'bg-[var(--color-brand-lime)] text-black -translate-y-0.5' : 'bg-neutral-200 text-black hover:-translate-y-0.5'} pressable`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="font-medium mb-2">Санаттар</div>
              <div className="max-h-40 overflow-auto no-scrollbar pr-1 flex flex-wrap gap-2">
                {allCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCategories((prev) => {
                      const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n
                    })}
                    aria-pressed={selectedCategories.has(c)}
                    className={`rounded-full px-4 py-2 border-2 border-black shadow-[0_4px_0_#000] ${selectedCategories.has(c) ? 'bg-[var(--color-brand-lime)] text-black -translate-y-0.5' : 'bg-neutral-200 text-black hover:-translate-y-0.5'} pressable`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div>
              <div className="font-medium mb-2">Мерзім</div>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs mb-1">Басталуы</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-full border-2 border-black px-3 py-1" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Аяқталуы</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-full border-2 border-black px-3 py-1" />
                </div>
              </div>
            </div>
          </div>
          <SheetFooter>
            <div className="flex w-full items-center justify-between">
              <button
                onClick={() => { setSelectedCategories(new Set()); setSelectedModes(new Set() as any); setSectionEnabled({ ol: true, pr: true, ha: true }); setDateFrom(""); setDateTo("") }}
                className="rounded-full px-4 py-2 bg-neutral-200 border-2 border-black shadow-[0_4px_0_#000] text-black pressable"
              >
                Тазарту
              </button>
              <button onClick={() => setFilterOpen(false)} className="rounded-full px-4 py-2 bg-yellow-300 border-2 border-black shadow-[0_4px_0_#000] text-black pressable">Қолдану</button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
