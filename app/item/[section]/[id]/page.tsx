"use client"

import BottomNav from "@/components/shared/BottomNav"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Heart, Tag, Star, Clock, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

const BG_POOL = [
  "bg-[var(--color-brand-lime)]",
  "bg-[var(--color-accent-yellow)]",
  "bg-[#CDBBFF]",
  "bg-[#FF8E6E]",
  "bg-[var(--color-accent-orange,#FFA573)]",
]

const SECTION_LABEL: Record<"ol" | "pr" | "ha", string> = {
  ol: "Olimpiads",
  pr: "Projects",
  ha: "Hackathons",
}

export default function Page() {
  const router = useRouter()
  const { section, id } = useParams<{ section: string; id: string }>()

  const sKey = useMemo(() => (section === "ol" || section === "pr" || section === "ha" ? section : null), [section])
  const itemId = useMemo(() => {
    const n = Number(id)
    return Number.isFinite(n) ? n : -1
  }, [id])

  // Title lookup from localStorage datasets written by Home page
  const [title, setTitle] = useState<string>("")
  useEffect(() => {
    if (!sKey || itemId < 0) return
    try {
      const dataKey = sKey === "ol" ? "events_ol" : sKey === "pr" ? "events_pr" : "events_ha"
      const raw = JSON.parse(localStorage.getItem(dataKey) || "[]") as Array<{ id: number; title: string }>
      const found = Array.isArray(raw) ? raw.find((x) => x.id === itemId) : undefined
      setTitle(found?.title || `Item #${itemId}`)
    } catch {
      setTitle(`Item #${itemId}`)
    }
  }, [sKey, itemId])

  // Favorite state for this item in its section
  const [isFav, setIsFav] = useState(false)
  useEffect(() => {
    if (!sKey || itemId < 0) return
    try {
      const favKey = `fav_${sKey}`
      const raw = JSON.parse(localStorage.getItem(favKey) || "[]") as number[]
      setIsFav(Array.isArray(raw) ? raw.includes(itemId) : false)
    } catch {}
  }, [sKey, itemId])

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

  const toggleFav = () => {
    if (!sKey || itemId < 0) return
    try {
      const favKey = `fav_${sKey}`
      const raw = JSON.parse(localStorage.getItem(favKey) || "[]") as number[]
      const arr = Array.isArray(raw) ? raw : []
      const exists = arr.includes(itemId)
      const next = exists ? arr.filter((x) => x !== itemId) : [...arr, itemId]
      localStorage.setItem(favKey, JSON.stringify(next))
      setIsFav(!exists)
    } catch {}
  }

  // Stable background choice based on id/section
  const bgClass = useMemo(() => {
    const idxBase = (Math.abs(itemId) + (sKey ? sKey.charCodeAt(0) : 0)) % BG_POOL.length
    return BG_POOL[idxBase]
  }, [itemId, sKey])

  if (!sKey || itemId < 0) return (
    <div className="smooth min-h-screen bg-black text-white pb-28">
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-black grid place-items-center shadow-[0_4px_0_#000] hover:bg-neutral-800 transition">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-serif text-2xl md:text-3xl">Item</h1>
        </div>
      </header>
      <main className="px-4 mt-5">
        <div className="mx-auto max-w-3xl rounded-2xl border-2 border-black bg-neutral-900 p-6">Invalid item.</div>
      </main>
      <BottomNav />
    </div>
  )

  return (
    <div className="smooth min-h-screen bg-black text-white pb-28">
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-black grid place-items-center shadow-[0_4px_0_#000] hover:bg-neutral-800 transition">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-serif text-2xl md:text-3xl">{SECTION_LABEL[sKey]} item</h1>
        </div>
      </header>

      <main className="px-4 mt-5">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-6 items-start">
          {/* Left: Visual card-like summary */}
          <section className={`${bgClass} relative overflow-hidden rounded-3xl border-2 border-black shadow-[0_8px_0_#000] p-6 text-black reveal-card`}>
            {/* Heart toggle */}
            <button
              type="button"
              onClick={toggleFav}
              aria-pressed={isFav}
              className="btn-heart absolute right-4 top-4 w-10 h-10 rounded-full bg-white/70 border-2 border-black grid place-items-center text-black hover:bg-white transition"
            >
              <Heart className={`heart-icon ${isFav ? "size-5 text-red-600" : "size-5"}`} fill={isFav ? "currentColor" : "none"} />
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/80 px-3 py-1 text-xs">
              <Tag className="size-3" /> {SECTION_LABEL[sKey]}
            </div>
            <h2 className="mt-3 font-semibold text-2xl md:text-3xl">{title}</h2>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center justify-center h-7 w-24 rounded-full bg-black text-white gap-1"><Star className="size-3" /> 4.7</span>
              <span className="inline-flex items-center justify-center h-7 w-28 rounded-full bg-black text-white gap-1"><Clock className="size-3" /> 24 Hours</span>
              <span className="inline-flex items-center justify-center h-7 w-28 rounded-full bg-black text-white gap-1"><Users className="size-3" /> 12k People</span>
            </div>

            <div className="mt-6">
              <p className="text-black/80">
                Короткое описание выбранного элемента. Здесь может быть информация о содержимом, задачах или ожидаемых результатах. Текст — заглушка для демонстрации стиля.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="rounded-full px-5 py-2 bg-black text-white border-2 border-black shadow-[0_4px_0_#000] hover:-translate-y-0.5 transition">
                Open / Apply
              </button>
              <button className="rounded-full px-5 py-2 bg-white text-black border-2 border-black shadow-[0_4px_0_#000] hover:-translate-y-0.5 transition">
                Share
              </button>
            </div>
          </section>

          {/* Right: Placeholder details/tasks */}
          <section className="rounded-3xl border-2 border-black bg-neutral-900 shadow-[0_8px_0_#000] p-6 space-y-4 reveal-card">
            <h3 className="font-serif text-xl">Details</h3>
            <ul className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl border-2 border-black bg-black/40 p-3">
                  <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-white text-black border border-black text-[10px]">{i + 1}</span>
                  <div>
                    <p className="font-medium">Пункт {i + 1}</p>
                    <p className="text-sm text-neutral-300">Подробности по пункту — текст-заглушка для единообразия интерфейса.</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
