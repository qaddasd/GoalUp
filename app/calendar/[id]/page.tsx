"use client"

import BottomNav from "@/components/shared/BottomNav"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Clock, Monitor, CheckCircle2, CalendarDays, Heart, ExternalLink, Bell } from "lucide-react"
import { getEventById, decorate, sectionShort } from "@/lib/events"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  const params = useParams<{ id: string | string[] }>()
  const search = useSearchParams()
  const refFrom = (search?.get("ref") || "").toString()
  const event = useMemo(() => {
    const sid = Array.isArray(params?.id) ? params.id[0] : params?.id
    const num = Number(sid)
    if (!Number.isFinite(num)) return undefined
    const base = getEventById(num)
    return base ? decorate(base) : undefined
  }, [params])

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

  // For header chip: show date range nicely
  const dateLabel = useMemo(() => {
    if (!event) return ""
    const s = new Date(event.date.start)
    const e = new Date(event.date.end)
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    return `${fmt(s)} – ${fmt(e)}`
  }, [event])

  const modeLabel = (m?: string) => (m === "Offline" ? "Офлайн" : m === "Hybrid" ? "Аралас" : "Онлайн")

  // Favorites state for section-like (heart) and notifications
  const [isFav, setIsFav] = useState(false)
  const [notifyOn, setNotifyOn] = useState(false)
  const [notifSupported, setNotifSupported] = useState(true)
  const [notifDenied, setNotifDenied] = useState(false)
  useEffect(() => {
    if (!event) return
    try {
      const secKey = `fav_${sectionShort(event.section as any)}`
      const rawSec = JSON.parse(localStorage.getItem(secKey) || "[]")
      const secArr: number[] = (Array.isArray(rawSec) ? rawSec : []).map((x: any) => Number(x)).filter((n) => Number.isFinite(n))
      setIsFav(secArr.includes(event.id))
    } catch {}
  }, [event])

  // Detect Notification support/permission
  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'Notification' in window
    setNotifSupported(supported)
    if (supported) setNotifDenied(Notification.permission === 'denied')
  }, [])

  const toggleFav = () => {
    if (!event) return
    try {
      const secKey = `fav_${sectionShort(event.section as any)}`
      const rawSec = JSON.parse(localStorage.getItem(secKey) || "[]")
      let secArr: number[] = Array.isArray(rawSec) ? rawSec : []
      const exists = secArr.includes(event.id)
      secArr = exists ? secArr.filter((x) => x !== event.id) : [...secArr, event.id]
      localStorage.setItem(secKey, JSON.stringify(secArr))
      setIsFav(!exists)
    } catch {}
  }

  // Helpers to add to external calendars
  const pad2 = (n: number) => String(n).padStart(2, "0")
  const ymd = (d: Date) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`
  const ymdTHMS = (d: Date) => `${ymd(d)}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`
  const withTime = (iso: string, hhmm?: string) => {
    const [h, m] = (hhmm || "10:00").split(":").map((x) => Number(x) || 0)
    const [Y, M, D] = iso.split("-").map((x) => Number(x))
    return new Date(Y, (M || 1) - 1, D || 1, h, m, 0)
  }
  const ensureFavCal = () => {
    if (!event) return
    try {
      const raw = JSON.parse(localStorage.getItem("fav_cal") || "[]")
      const arr: number[] = Array.isArray(raw) ? raw : []
      let changed = false
      if (!arr.includes(event.id)) { arr.push(event.id); changed = true }
      if (changed) {
        localStorage.setItem("fav_cal", JSON.stringify(arr))
      }
    } catch {}
  }

  // Ask permission synchronously on click to avoid browser blocking in useEffect
  const ensureNotifPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) return false
    if (Notification.permission === "granted") return true
    if (Notification.permission === "denied") return false
    try {
      const p = await Notification.requestPermission()
      return p === "granted"
    } catch {
      return false
    }
  }
  const icsContent = () => {
    if (!event) return ""
    const ds = withTime(event.date.start, event.start)
    const de = withTime(event.date.end, event.end)
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//GoalUp//Calendar 1.0//EN",
      "BEGIN:VEVENT",
      `UID:goalup-${event.id}@goalup` ,
      `DTSTAMP:${ymdTHMS(new Date())}Z`,
      `DTSTART:${ymdTHMS(ds)}`,
      `DTEND:${ymdTHMS(de)}`,
      `SUMMARY:${event.title.replace(/\r?\n/g, " ")}`,
      `DESCRIPTION:${(event.description || "").replace(/\r?\n/g, " ")} ${(event.link || "")}`,
      event.link ? `URL:${event.link}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean)
    return lines.join("\r\n")
  }
  const downloadIcs = () => {
    if (!event) return
    ensureFavCal()
    const blob = new Blob([icsContent()], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `goalup-${event.id}.ics`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  const googleUrl = () => {
    if (!event) return "#"
    const ds = withTime(event.date.start, event.start)
    const de = withTime(event.date.end, event.end)
    const dates = `${ymdTHMS(ds)}/${ymdTHMS(de)}`
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates,
      details: `${event.description || ""}${event.link ? "\n" + event.link : ""}`,
      location: event.mode || "Online",
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  // Lightweight in-app notifications (works while app/tab is open)
  useEffect(() => {
    if (!event) return
    try {
      const saved = localStorage.getItem(`notif_${event.id}`)
      setNotifyOn(saved === "1")
    } catch {}
  }, [event])
  useEffect(() => {
    if (!event || !notifyOn) return
    if (!("Notification" in window)) return
    const ask = async () => {
      let perm = Notification.permission
      if (perm === "default") {
        perm = await Notification.requestPermission()
      }
      if (perm !== "granted") return
      const schedule = (title: string, when: Date) => {
        const ms = when.getTime() - Date.now()
        if (ms <= 0 || ms > 2147483647) return // skip past or too far
        window.setTimeout(() => {
          try { new Notification(title, { body: event.title }) } catch {}
        }, ms)
      }
      const start = withTime(event.date.start, event.start)
      const end = withTime(event.date.end, event.end)
      const d1 = new Date(start.getTime() - 24 * 60 * 60 * 1000) // за 1 день до старта
      const d2 = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000) // за 3 дня до дедлайна
      schedule("Скоро начало события", d1)
      schedule("Скоро окончание события", d2)
    }
    ask()
    try { localStorage.setItem(`notif_${event.id}`, notifyOn ? "1" : "0") } catch {}
  }, [event, notifyOn])

  if (!event) {
    return (
      <div className="smooth min-h-screen bg-black text-white grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-serif">Загрузка…</div>
          <div className="mt-2 text-neutral-400">Если страница не загрузилась, вернитесь в календарь и попробуйте снова.</div>
          <div className="mt-4">
            <Link href={refFrom === 'profile' ? '/profile' : '/calendar'} className="inline-flex rounded-full px-5 py-2 bg-neutral-900 border-2 border-black shadow-[0_4px_0_#000] hover:bg-neutral-800">{refFrom === 'profile' ? 'Профильге қайту' : 'Күнтізбеге оралу'}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="smooth min-h-screen bg-black text-white pb-28">
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <Link href={refFrom === 'profile' ? '/profile' : '/calendar'} className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-black grid place-items-center shadow-[0_4px_0_#000] hover:bg-neutral-800 transition pressable" aria-label={refFrom === 'profile' ? 'Профильге қайту' : 'Күнтізбеге қайту'}>
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="font-serif text-2xl md:text-3xl">Іс-шара туралы</h1>
        </div>
      </header>

      <main className="px-4 mt-5">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-6 items-start">
          {/* Left: Visual card */}
          <section className={`${event.bg} relative overflow-hidden rounded-3xl border-2 border-black shadow-[0_8px_0_#000] p-6 text-black reveal-card`}>
            {/* Heart toggle */}
            <button
              type="button"
              onClick={toggleFav}
              aria-pressed={isFav}
              className="btn-heart absolute right-4 top-4 w-10 h-10 rounded-full bg-white/70 border-2 border-black grid place-items-center text-black hover:bg-white transition"
            >
              <Heart className={`heart-icon ${isFav ? "size-5 text-red-600" : "size-5"}`} fill={isFav ? "currentColor" : "none"} />
            </button>
            <svg aria-hidden width="240" height="240" viewBox="0 0 200 200" className="absolute -right-12 -bottom-12 opacity-70"><path fill={event.deco} d="M55-61.6c18.2-24.2 58.2-23.1 76.5 1.1 18.3 24.2 9.6 69.7-15.7 90.5-25.3 20.8-66.1 17-86.6-6.8C9.7-0.6 36.8-37.4 55-61.6z" /></svg>
            <h2 className="font-semibold text-2xl md:text-3xl">{event.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-3 py-1">
                <CalendarDays className="size-4" /> {dateLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-3 py-1">
                <Clock className="size-4" /> {event.start}–{event.end}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/70 px-3 py-1">
                <Monitor className="size-4" /> {modeLabel(event.mode)}
              </span>
            </div>

            <div className="mt-6">
              <p className="text-black/80">{event.description}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 items-center">
              {event.link && (
                <a href={event.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-2 bg-black text-white border-2 border-black shadow-[0_4px_0_#000] hover:-translate-y-0.5 transition pressable">
                  Ашу <ExternalLink className="size-4" />
                </a>
              )}
              <button onClick={downloadIcs} className="rounded-full px-5 py-2 bg-white text-black border-2 border-black shadow-[0_4px_0_#000] hover:-translate-y-0.5 transition pressable">
                Күнтізбеге қосу (.ics)
              </button>
              <a href={googleUrl()} onClick={ensureFavCal} target="_blank" className="rounded-full px-5 py-2 bg-white text-black border-2 border-black shadow-[0_4px_0_#000] hover:-translate-y-0.5 transition pressable">
                Google Күнтізбе
              </a>
              <button
                onClick={async () => {
                  const ok = await ensureNotifPermission()
                  setNotifDenied(!ok)
                  if (!ok) return
                  setNotifyOn((prev) => {
                    const next = !prev
                    if (next) ensureFavCal() // добавляем в "Календарь" при включении напоминаний
                    return next
                  })
                }}
                disabled={!notifSupported || notifDenied}
                title={!notifSupported ? 'Браузер хабарландыруларды қолдамайды' : notifDenied ? 'Хабарландыруға рұқсат берілмеген' : ''}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 border-2 border-black shadow-[0_4px_0_#000] ${notifyOn ? "bg-black text-white" : "bg-white text-black"} ${(!notifSupported || notifDenied) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Bell className="size-4" /> {notifyOn ? "Хабарлау" : "Еске салу"}
              </button>
            </div>
          </section>

          {/* Right: Reminders / Checklist */}
          <section className="rounded-3xl border-2 border-black bg-neutral-900 shadow-[0_8px_0_#000] p-6 space-y-4">
            <h3 className="font-serif text-xl">Пайдалы қадамдар</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 rounded-2xl border-2 border-black bg-black/40 p-3">
                <CheckCircle2 className="mt-0.5 size-5 text-[var(--color-brand-lime)]" />
                <div>
                  <p className="font-medium">Сайтта тіркеліңіз</p>
                  <p className="text-sm text-neutral-300">Сілтеме арқылы өтіңіз және өтінім беріңіз. Дедлайндарды тексеріңіз.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border-2 border-black bg-black/40 p-3">
                <CheckCircle2 className="mt-0.5 size-5 text-[var(--color-brand-lime)]" />
                <div>
                  <p className="font-medium">Регламентпен танысыңыз</p>
                  <p className="text-sm text-neutral-300">Формат, секциялар, бағалау талаптары. Материалдарды дайындаңыз.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border-2 border-black bg-black/40 p-3">
                <CheckCircle2 className="mt-0.5 size-5 text-[var(--color-brand-lime)]" />
                <div>
                  <p className="font-medium">Жұмысты жинақтаңыз</p>
                  <p className="text-sm text-neutral-300">Тезис/постер/презентация, видео және растайтын құжаттар.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border-2 border-black bg-black/40 p-3">
                <CheckCircle2 className="mt-0.5 size-5 text-[var(--color-brand-lime)]" />
                <div>
                  <p className="font-medium">Дедлайнға дейін жіберіңіз</p>
                  <p className="text-sm text-neutral-300">Жіберу сәтті өткенін және растау хаттары келгенін тексеріңіз.</p>
                </div>
              </li>
            </ul>
            <div className="pt-2 text-sm text-neutral-400">
              <span>Санат: {"category" in event ? (event as any).category : "—"}</span>
              {event.award && <div className="mt-2">Сыйлықтар: {event.award}</div>}
              <div className="mt-3 text-xs opacity-70">Жүйелік еске салғыштар сіздің күнтізбеңізден келеді. Жоғарыдағы түймелер Google Күнтізбеге немесе .ics файлға қосады.</div>
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
