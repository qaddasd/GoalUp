"use client"

import BottomNav from "@/components/shared/BottomNav"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Heart, Clock, Monitor, CalendarDays, Tag, ArrowRight, Trash2 } from "lucide-react"
import { getEventById, decorate } from "@/lib/events"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { setCookie } from "@/lib/cookies"

type HomeFavItem = ReturnType<typeof decorate>

const sectionLabel = (s: string) => (s === "Olimpiads" ? "Олимпиадалар" : s === "Projects" ? "Жобалар" : s === "Hackathons" ? "Хакатондар" : s)
const modeLabel = (m?: string) => (m === "Offline" ? "Офлайн" : m === "Hybrid" ? "Аралас" : "Онлайн")

export default function Page() {
  // Sets of favorite ids
  const [favOl, setFavOl] = useState<Set<number>>(new Set())
  const [favPr, setFavPr] = useState<Set<number>>(new Set())
  const [favHa, setFavHa] = useState<Set<number>>(new Set())
  const [favCal, setFavCal] = useState<Set<number>>(new Set())
  const [delOpen, setDelOpen] = useState(false)
  const [delTarget, setDelTarget] = useState<null | { kind: 'home' | 'cal', id: number, section?: 'ol' | 'pr' | 'ha' }>(null)

  useEffect(() => {
    try {
      const o = JSON.parse(localStorage.getItem("fav_ol") || "[]")
      const p = JSON.parse(localStorage.getItem("fav_pr") || "[]")
      const h = JSON.parse(localStorage.getItem("fav_ha") || "[]")
      const c = JSON.parse(localStorage.getItem("fav_cal") || "[]")
      const toNums = (arr: any) => (Array.isArray(arr) ? arr : []).map((x) => Number(x)).filter((n) => Number.isFinite(n))
      setFavOl(new Set(toNums(o)))
      setFavPr(new Set(toNums(p)))
      setFavHa(new Set(toNums(h)))
      setFavCal(new Set(toNums(c)))
    } catch {}
  }, [])

  const homeItems: HomeFavItem[] = useMemo(() => {
    const out: HomeFavItem[] = []
    const pushIf = (id: number) => {
      const ev = getEventById(id)
      if (ev) out.push(decorate(ev))
    }
    favOl.forEach(pushIf)
    favPr.forEach(pushIf)
    favHa.forEach(pushIf)
    return out
  }, [favOl, favPr, favHa])

  const calItems = useMemo(() => {
    const out: Array<ReturnType<typeof decorate>> = []
    favCal.forEach((id) => {
      const ev = getEventById(id)
      if (ev) out.push(decorate(ev))
    })
    return out
  }, [favCal])

  const removeHome = (section: "ol" | "pr" | "ha", id: number) => {
    if (section === "ol") {
      const next = new Set(favOl); next.delete(id)
      setFavOl(next); try { localStorage.setItem("fav_ol", JSON.stringify([...next])) } catch {}
    } else if (section === "pr") {
      const next = new Set(favPr); next.delete(id)
      setFavPr(next); try { localStorage.setItem("fav_pr", JSON.stringify([...next])) } catch {}
    } else {
      const next = new Set(favHa); next.delete(id)
      setFavHa(next); try { localStorage.setItem("fav_ha", JSON.stringify([...next])) } catch {}
    }
  }

  const removeCal = (id: number) => {
    const next = new Set(favCal); next.delete(id)
    setFavCal(next); try { localStorage.setItem("fav_cal", JSON.stringify([...next])) } catch {}
  }

  const removePortfolioEdit = (id: number) => {
    try {
      const raw = localStorage.getItem('portfolio_edits')
      if (!raw) return
      const obj = JSON.parse(raw) || {}
      if (obj && typeof obj === 'object' && obj[String(id)]) {
        delete obj[String(id)]
        localStorage.setItem('portfolio_edits', JSON.stringify(obj))
        setCookie('portfolio_edits', JSON.stringify(obj))
      }
    } catch {}
  }

  const confirmDelete = () => {
    if (!delTarget) return
    const { kind, id, section } = delTarget
    if (kind === 'home') {
      if (section === 'ol') removeHome('ol', id)
      else if (section === 'pr') removeHome('pr', id)
      else removeHome('ha', id)
    } else {
      removeCal(id)
    }
    removePortfolioEdit(id)
    setDelOpen(false)
    setDelTarget(null)
    toast({ title: "Жойылды", description: "Іс-шара деректері жойылды (тек сізде)", className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]" })
  }

  const formatRange = (startISO: string, endISO: string) => {
    const s = new Date(startISO); const e = new Date(endISO)
    const f = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    return `${f(s)} – ${f(e)}`
  }

  return (
    <div className="smooth min-h-screen bg-black text-white pb-28">
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <h1 className="font-serif text-3xl">Таңдаулы</h1>
        </div>
      </header>

      <main className="px-4 mt-4 space-y-10">
        {/* Home items */}
        <section className="mx-auto max-w-5xl">
          <h2 className="text-lg mb-2">Элементтер</h2>
          <hr className="border-neutral-800 mb-4" />
          {homeItems.length === 0 ? (
            <p className="text-neutral-400">Таңдаулы элементтер жоқ.</p>
          ) : (
            <ul className="grid md:grid-cols-2 gap-4">
              {homeItems.map((ev, idx) => (
                <li key={`${ev.section}-${ev.id}-${idx}`} className={`reveal-card relative overflow-hidden rounded-2xl border-2 border-black ${ev.bg} shadow-[0_6px_0_#000] p-4 text-black`}>
                  {/* Overlay link to calendar event */}
                  <Link href={`/calendar/${ev.id}`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${ev.title}`}>
                    <span className="sr-only">Ашу</span>
                  </Link>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-3 py-1 text-xs">
                        <Tag className="size-3" /> {sectionLabel(ev.section as any)}
                      </div>
                      <h3 className="mt-2 font-semibold break-words pr-12">{ev.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {"category" in ev && (
                          <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-3 py-1 max-w-[200px] truncate">
                            <Tag className="size-3" /> {(ev as any).category}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-3 py-1">
                          <Monitor className="size-3" /> {modeLabel(ev.mode)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Таңдаулыдан алып тастау"
                        onClick={() => removeHome(ev.section === "Olimpiads" ? "ol" : ev.section === "Projects" ? "pr" : "ha", ev.id)}
                        className="btn-heart z-10 w-9 h-9 rounded-full bg-white/70 border-2 border-black grid place-items-center hover:bg-white pressable"
                      >
                        <Heart className="heart-icon size-4 text-red-600" fill="currentColor" />
                      </button>
                      <button
                        aria-label="Жою"
                        onClick={(e) => { e.preventDefault(); setDelTarget({ kind: 'home', id: ev.id, section: ev.section === "Olimpiads" ? 'ol' : ev.section === "Projects" ? 'pr' : 'ha' }); setDelOpen(true) }}
                        className="z-10 w-9 h-9 rounded-full bg-white/70 border-2 border-black grid place-items-center text-black hover:bg-white pressable"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-black/60 border-2 border-black grid place-items-center text-white pointer-events-none">
                    <ArrowRight className="size-4" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Calendar items */}
        <section className="mx-auto max-w-5xl">
          <h2 className="text-lg mb-2">Күнтізбе</h2>
          <hr className="border-neutral-800 mb-4" />
          {calItems.length === 0 ? (
            <p className="text-neutral-400">Күнтізбе таңдаулылары жоқ.</p>
          ) : (
            <div className="space-y-4">
              {calItems.map((ev) => (
                <article key={ev.id} className={`reveal-card ${ev.bg} relative overflow-hidden rounded-2xl md:rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-4 text-black`}>
                  <h3 className="font-semibold text-xl">{ev.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-3 py-1">
                      <CalendarDays className="size-4" /> {formatRange(ev.date.start, ev.date.end)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-3 py-1">
                      <Clock className="size-4" /> {ev.start}–{ev.end}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-3 py-1">
                      <Monitor className="size-4" /> {modeLabel(ev.mode)}
                    </span>
                  </div>

                  <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                    <button
                      aria-label="Таңдаулыдан алып тастау"
                      onClick={() => removeCal(ev.id as number)}
                      className="btn-heart w-9 h-9 rounded-full bg-white/70 border-2 border-black grid place-items-center text-black hover:bg-white pressable"
                    >
                      <Heart className="heart-icon size-4 text-red-600" fill="currentColor" />
                    </button>
                    <button
                      aria-label="Жою"
                      onClick={(e) => { e.preventDefault(); setDelTarget({ kind: 'cal', id: ev.id as number }); setDelOpen(true) }}
                      className="w-9 h-9 rounded-full bg-white/70 border-2 border-black grid place-items-center text-black hover:bg-white pressable"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <Link href={`/calendar/${ev.id}`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${ev.title}`}>
                    <span className="sr-only">Ашу</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />

      {/* Delete confirm dialog */}
      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent className="bg-white text-black border-2 border-black rounded-3xl p-6 shadow-[0_8px_0_#000]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Іс-шараны жою</DialogTitle>
          </DialogHeader>
          <p className="mt-2">Барлық деректерді жойғыңыз келе ме? Бұл іс-шара тек сіздің базаңыздан жойылады.</p>
          <DialogFooter className="mt-6">
            <button type="button" className="rounded-full px-4 py-2 border-2 border-black bg-neutral-200 text-black hover:-translate-y-0.5" onClick={() => setDelOpen(false)}>Бас тарту</button>
            <button type="button" className="rounded-full px-4 py-2 border-2 border-black bg-red-500 text-white hover:-translate-y-0.5" onClick={confirmDelete}>Жою</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
