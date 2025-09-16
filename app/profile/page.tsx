"use client"

import React, { useEffect, useState } from "react"
import BottomNav from "@/components/shared/BottomNav"
import Link from "next/link"
import { Settings, FileText, Download, LogOut, Clock, Monitor, Tag, ExternalLink, Trash2, Check, Wand2 } from "lucide-react"
import { decorate, getEventById } from "@/lib/events"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { setCookie, getCookie } from "@/lib/cookies"

const LIME = "var(--color-brand-lime)"

export default function ProfilePage() {
  const [tab, setTab] = useState<"stats" | "portfolio">("stats")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [portfolio, setPortfolio] = useState<any[]>([])
  const router = useRouter()

  // Profile state
  const [displayName, setDisplayName] = useState<string>("User")
  const [email, setEmail] = useState<string>("")
  const [editOpen, setEditOpen] = useState(false)
  const [editUsername, setEditUsername] = useState("")
  const [editFullName, setEditFullName] = useState("")
  const [editTeacher, setEditTeacher] = useState("")
  const [editClass, setEditClass] = useState<number | null>(null)
  const CLASS_LEVELS = [7, 8, 9, 10, 11, 12]
  const [aboutOpen, setAboutOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  // Custom portfolio (user-added contests)
  type CustomItem = {
    id: string
    contest: string
    project: string
    place: string
    desc: string
    date: string // YYYY-MM-DD
    cls: string
    url: string
  }
  const [customOpen, setCustomOpen] = useState(false)
  const [customItems, setCustomItems] = useState<CustomItem[]>([])
  const [cpContest, setCpContest] = useState("")
  const [cpProject, setCpProject] = useState("")
  const [cpPlace, setCpPlace] = useState("")
  const [cpDesc, setCpDesc] = useState("")
  const [cpDate, setCpDate] = useState("")
  const [cpClass, setCpClass] = useState("")
  const [cpUrl, setCpUrl] = useState("")

  // Generation & docs
  type DocItem = { id: string; createdAt: number; title: string; text: string; usedPrompt?: string }
  const [docs, setDocs] = useState<DocItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [genStage, setGenStage] = useState<"idle" | "thinking" | "idea" | "done">("idle")
  const latestDoc = docs[0]

  // Edits for saved portfolio events (from calendar)
  type EventEdit = { project?: string; place?: string; desc?: string; url?: string }
  const [portfolioEdits, setPortfolioEdits] = useState<Record<string, EventEdit>>({})
  const [eventEditOpen, setEventEditOpen] = useState(false)
  const [eventEditTarget, setEventEditTarget] = useState<any | null>(null)
  const [evProject, setEvProject] = useState("")
  const [evPlace, setEvPlace] = useState("")
  const [evDesc, setEvDesc] = useState("")
  const [evUrl, setEvUrl] = useState("")

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("fav_cal") || "[]")
      const ids: number[] = (Array.isArray(raw) ? raw : [])
        .map((x: any) => Number(x))
        .filter((n) => Number.isFinite(n))
      const items = ids
        .map((id) => getEventById(id))
        .filter((e): e is NonNullable<ReturnType<typeof getEventById>> => !!e)
        .map((e) => decorate(e))
      setPortfolio(items)
    } catch {}
  }, [])

  // Load custom portfolio from storage/cookie
  useEffect(() => {
    try {
      const local = localStorage.getItem("custom_portfolio")
      if (local) {
        const arr = JSON.parse(local)
        if (Array.isArray(arr)) setCustomItems(arr)
      } else {
        const ck = getCookie("custom_portfolio")
        if (ck) {
          const arr = JSON.parse(ck)
          if (Array.isArray(arr)) setCustomItems(arr)
        }
      }
    } catch {}
    // Default class from saved
    try {
      const cls = localStorage.getItem("userClass") || ""
      if (cls) setCpClass(cls)
    } catch {}
  }, [])

  // Persist custom items
  useEffect(() => {
    try {
      localStorage.setItem("custom_portfolio", JSON.stringify(customItems))
      setCookie("custom_portfolio", JSON.stringify(customItems))
    } catch {}
  }, [customItems])

  // Load docs history
  useEffect(() => {
    try {
      const raw = localStorage.getItem("portfolio_docs")
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setDocs(arr)
      }
    } catch {}
  }, [])

  // Persist docs history
  useEffect(() => {
    try {
      localStorage.setItem("portfolio_docs", JSON.stringify(docs))
      // Store lightweight meta copy in cookies (titles only) to meet cookie size limits
      const meta = docs.map((d) => ({ id: d.id, title: d.title, createdAt: d.createdAt }))
      setCookie("portfolio_docs_meta", JSON.stringify(meta))
    } catch {}
  }, [docs])

  // Load and persist portfolio edits
  useEffect(() => {
    try {
      const raw = localStorage.getItem("portfolio_edits")
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj && typeof obj === 'object') setPortfolioEdits(obj)
      }
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem("portfolio_edits", JSON.stringify(portfolioEdits))
      // Also mirror edits to cookies for persistence across some environments
      setCookie("portfolio_edits", JSON.stringify(portfolioEdits))
    } catch {}
  }, [portfolioEdits])

  const buildAIInput = () => {
    const user = {
      fullName: editFullName,
      username: editUsername,
      class: editClass,
      email,
      teacher: editTeacher,
    }
    const items = [
      ...portfolio.map((it) => {
        const ed = portfolioEdits[String(it.id)] || {}
        return {
          title: it.title,
          dateRange: `${it.start}–${it.end}`,
          mode: it.mode,
          category: (it as any).category,
          place: ed.place,
          project: ed.project,
          desc: ed.desc,
          url: ed.url,
        }
      }),
      ...customItems.map((ci) => ({
        title: ci.contest,
        date: ci.date,
        place: ci.place,
        project: ci.project,
        desc: ci.desc,
        url: ci.url,
      }))
    ]
    return { user, items }
  }

  const generatePortfolio = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setGenStage("thinking")
    try {
      const body = buildAIInput()
      const res = await fetch("/api/generate-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Қызмет уақытша қол жетімді емес")
      const data = await res.json()
      const text: string = String(data?.text || "")
      const usedPrompt: string = String(data?.usedPrompt || "")
      setGenStage("idea")
      // brief pause for UX
      await new Promise((r) => setTimeout(r, 800))
      setGenStage("done")
      const item: DocItem = { id: String(Date.now()), createdAt: Date.now(), title: `Портфолио — ${editFullName || editUsername || (email ? email.split("@")[0] : "User")}`, text, usedPrompt }
      setDocs((prev) => [item, ...prev])
      // Open the generated portfolio
      await openPdfFromText(text, item.title)
    } catch (e: any) {
      toast({ variant: "destructive", title: "Қате", description: e?.message || "Генерация сәтсіз" , className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]" })
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenStage("idle"), 600)
    }
  }

  async function getJsPDF(): Promise<any | null> {
    // Already loaded?
    const w: any = window as any
    if (w.jspdf?.jsPDF) return w.jspdf.jsPDF
    // Inject CDN script
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script")
      s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error("jsPDF жүктелмеді"))
      document.head.appendChild(s)
    })
    return (window as any).jspdf?.jsPDF || null
  }

  async function getPdfMake(): Promise<any | null> {
    const w: any = window as any
    if (w.pdfMake?.createPdf) return w.pdfMake
    // Load pdfmake core
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script")
      s.src = "https://cdn.jsdelivr.net/npm/pdfmake@0.2.9/build/pdfmake.min.js"
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error("pdfmake жүктелмеді"))
      document.head.appendChild(s)
    })
    // Load default VFS fonts (Roboto with Cyrillic support)
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script")
      s.src = "https://cdn.jsdelivr.net/npm/pdfmake@0.2.9/build/vfs_fonts.js"
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error("pdfmake vfs жүктелмеді"))
      document.head.appendChild(s)
    })
    return (window as any).pdfMake || null
  }

  function buildDocDefinition(text: string, title: string) {
    // Normalize bullets/newlines and split into blocks
    const pretty = String(text)
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s*[-*]\s+/gm, "• ")

    const lines = pretty.split(/\n/)
    const content: any[] = [{ text: title, style: "header", margin: [0, 0, 0, 12] }]
    let ul: string[] = []
    const flushUl = () => {
      if (ul.length) { content.push({ ul: ul.slice(), margin: [0, 0, 0, 8] }); ul = [] }
    }
    for (const ln of lines) {
      const t = ln.trim()
      if (!t) { flushUl(); content.push({ text: "", margin: [0, 4, 0, 4] }); continue }
      if (t.startsWith("• ")) { ul.push(t.replace(/^•\s+/, "")); continue }
      flushUl()
      content.push({ text: t, margin: [0, 0, 0, 6] })
    }
    flushUl()
    return {
      pageSize: "A4",
      pageMargins: [40, 40, 40, 40],
      defaultStyle: { font: "Roboto", fontSize: 11, lineHeight: 1.25 },
      styles: { header: { fontSize: 18, bold: true } },
      content,
    }
  }

  let pdfFontReady = false
  let pdfFontName = 'Helvetica'
  async function ensurePdfFont(doc: any) {
    if (pdfFontReady) { try { doc.setFont(pdfFontName, 'normal') } catch {} return }
    const toBase64 = (buf: ArrayBuffer) => {
      const bytes = new Uint8Array(buf)
      const chunk = 0x8000
      let binary = ''
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any)
      }
      return btoa(binary)
    }
    const fontCandidates = [
      {
        name: 'DejaVuSans',
        reg: 'https://cdn.jsdelivr.net/gh/dejavu-fonts/dejavu-fonts-ttf@v2.37/ttf/DejaVuSans.ttf',
        bold: 'https://cdn.jsdelivr.net/gh/dejavu-fonts/dejavu-fonts-ttf@v2.37/ttf/DejaVuSans-Bold.ttf',
      },
      {
        name: 'NotoSans',
        reg: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans-Regular.ttf',
        bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans-Bold.ttf',
      },
      {
        name: 'Roboto',
        reg: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto-Regular.ttf',
        bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto-Bold.ttf',
      },
    ]
    for (const f of fontCandidates) {
      try {
        const [regBuf, boldBuf] = await Promise.all([
          fetch(f.reg, { cache: 'no-store' }).then(r => r.arrayBuffer()),
          fetch(f.bold, { cache: 'no-store' }).then(r => r.arrayBuffer()),
        ])
        doc.addFileToVFS(`${f.name}-Regular.ttf`, toBase64(regBuf))
        doc.addFont(`${f.name}-Regular.ttf`, f.name, 'normal')
        doc.addFileToVFS(`${f.name}-Bold.ttf`, toBase64(boldBuf))
        doc.addFont(`${f.name}-Bold.ttf`, f.name, 'bold')
        doc.setFont(f.name, 'normal')
        pdfFontName = f.name
        pdfFontReady = true
        return
      } catch (e) {
        // try next font
        continue
      }
    }
    // If all failed, continue with default, but Cyrillic may not render
    pdfFontReady = true
    pdfFontName = 'Helvetica'
  }

  async function openPdfFromText(text: string, title: string) {
    try {
      // Prefer pdfmake for Unicode safety
      const pdfMake = await getPdfMake()
      if (pdfMake?.createPdf) {
        const def = buildDocDefinition(text, title)
        await new Promise<void>((resolve) => {
          pdfMake.createPdf(def).getBlob((blob: Blob) => {
            const url = URL.createObjectURL(blob)
            window.open(url, "_blank")
            resolve()
          })
        })
        return "pdfmake"
      }
      // Fallback to jsPDF if pdfmake unavailable
      const JsPDF = await getJsPDF()
      if (!JsPDF) throw new Error("PDF кітапханасы қол жетімсіз")
      const doc = new JsPDF({ unit: "pt", format: "a4" })
      await ensurePdfFont(doc)
      const margin = 40
      const maxWidth = 515
      const pretty = String(text)
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\s*[-*]\s+/gm, "• ")
      // @ts-ignore
      const lines = doc.splitTextToSize ? doc.splitTextToSize(pretty, maxWidth) : pretty.split(/\n/)
      let y = margin
      doc.setFont(pdfFontName, "bold")
      doc.setFontSize(16)
      doc.text(title, margin, y)
      y += 24
      doc.setFont(pdfFontName, "normal")
      doc.setFontSize(12)
      ;(Array.isArray(lines) ? lines : [String(lines)]).forEach((ln: string) => {
        if (y > 800) { doc.addPage(); y = margin }
        doc.text(ln, margin, y)
        y += 18
      })
      const blob = doc.output("blob")
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      return url
    } catch (e: any) {
      // Fallback: open plain text
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      toast({ title: "Ескерту", description: e?.message || "PDF жасау мүмкін болмады. Қазірше TXT ашылды.", className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]" })
      return url
    }
  }

  async function downloadLatest() {
    if (!latestDoc) {
      toast({ title: "Құжат жоқ", description: "Алдымен құрастырыңыз", className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]" })
      return
    }
    try {
      const pdfMake = await getPdfMake()
      if (pdfMake?.createPdf) {
        const def = buildDocDefinition(latestDoc.text, latestDoc.title)
        pdfMake.createPdf(def).download(`${latestDoc.title}.pdf`)
        return
      }
      // Fallback to jsPDF
      const JsPDF = await getJsPDF()
      if (!JsPDF) throw new Error("PDF кітапханасы қол жетімсіз")
      const doc = new JsPDF({ unit: "pt", format: "a4" })
      await ensurePdfFont(doc)
      const margin = 40
      const maxWidth = 515
      const pretty = String(latestDoc.text)
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\s*[-*]\s+/gm, "• ")
      // @ts-ignore
      const lines = doc.splitTextToSize ? doc.splitTextToSize(pretty, maxWidth) : pretty.split(/\n/)
      let y = margin
      doc.setFont(pdfFontName, "bold")
      doc.setFontSize(16)
      doc.text(latestDoc.title, margin, y)
      y += 24
      doc.setFont(pdfFontName, "normal")
      doc.setFontSize(12)
      ;(Array.isArray(lines) ? lines : [String(lines)]).forEach((ln: string) => {
        if (y > 800) { doc.addPage(); y = margin }
        doc.text(ln, margin, y)
        y += 18
      })
      doc.save(`${latestDoc.title}.pdf`)
    } catch (e: any) {
      const blob = new Blob([latestDoc.text], { type: "text/plain;charset=utf-8" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${latestDoc.title}.txt`
      a.click()
      toast({ title: "Ескерту", description: e?.message || "PDF жасау мүмкін болмады. Қазір TXT жүктелді.", className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]" })
    }
  }

  // Load user profile from Supabase
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }: any) => {
      if (error) return
      const user = data?.user
      if (!user) return
      setEmail(user.email || "")
      const meta = (user.user_metadata || {}) as any
      const username = meta?.username || ""
      const fullName = meta?.fullName || ""
      const teacher = meta?.teacher || ""
      const clsRaw = meta?.class
      const clsNum = Number.parseInt(String(clsRaw ?? ""), 10)
      if (Number.isFinite(clsNum)) setEditClass(clsNum)
      setEditUsername(username)
      setEditFullName(fullName)
      setEditTeacher(teacher)
      const name = fullName || username || (user.email ? user.email.split("@")[0] : "User")
      setDisplayName(name)
    })
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    try { localStorage.removeItem("userClass") } catch {}
    toast({ title: "Сіз сәтті шықтыңыз", description: "Қайта кіргіңіз келсе, логин арқылы өтіңіз.", className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]" })
    setTimeout(() => router.replace("/"), 300)
  }

  return (
    <div className="smooth min-h-screen bg-black text-white pb-28">
      {/* Header */}
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-5xl grid grid-cols-3 items-center">
          <div className="justify-self-start">
            <button onClick={() => setSettingsOpen((p) => !p)} aria-label="Settings" aria-expanded={settingsOpen} className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-black grid place-items-center shadow-[0_4px_0_#000] hover:bg-neutral-800">
              <Settings className="size-5" />
            </button>
          </div>
          <h1 className="justify-self-center font-serif text-2xl">Менің бейінім</h1>
          <div className="justify-self-end w-10 h-10" aria-hidden />
        </div>
      </header>

      <main className="px-4 mt-5">
        <div className={`mx-auto max-w-5xl ${tab === "stats" ? "" : "grid md:grid-cols-[340px,1fr]"} gap-6 items-start`}>
          {/* Left column: avatar & identity */}
          <section className="reveal-card rounded-3xl border-2 border-black bg-neutral-900 shadow-[0_8px_0_#000] p-6 flex flex-col items-center">
            <div className="relative w-36 h-36 rounded-full border-[6px] border-black" style={{ boxShadow: "0 6px 0 #000", background: "white", outline: `6px solid ${LIME}`, outlineOffset: "-6px" }}>
              {/* Eyes (simple svg) */}
              <svg width="144" height="144" viewBox="0 0 144 144" className="absolute inset-0">
                <ellipse cx="56" cy="72" rx="16" ry="22" fill="#000" />
                <ellipse cx="92" cy="72" rx="16" ry="22" fill="#000" />
                {/* lashes */}
                <path d="M40 58 l-8 -8" stroke="#000" strokeWidth="4" strokeLinecap="round" />
                <path d="M48 54 l-6 -10" stroke="#000" strokeWidth="4" strokeLinecap="round" />
                <path d="M104 54 l6 -10" stroke="#000" strokeWidth="4" strokeLinecap="round" />
                <path d="M112 58 l8 -8" stroke="#000" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-3 text-lg" style={{ color: "var(--color-hero-purple)" }}>{displayName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {editClass != null && (
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/80 px-3 py-1 text-black">Сынып: {editClass}</span>
              )}
              {editTeacher && (
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/80 px-3 py-1 text-black">Сынып жетекшісі: {editTeacher}</span>
              )}
            </div>

            {/* Segmented control */}
            <div className="mt-5 w-full rounded-full border-2 border-black bg-neutral-950 p-1 flex gap-1 shadow-[0_4px_0_#000]">
              <button onClick={() => setTab("stats")} className={`flex-1 rounded-full px-4 py-2 border-2 border-black text-sm pressable ${tab === "stats" ? "bg-[var(--color-brand-lime)] text-black" : "bg-transparent text-white"}`}>Статистика</button>
              <button onClick={() => setTab("portfolio")} className={`flex-1 rounded-full px-4 py-2 border-2 border-black text-sm pressable ${tab === "portfolio" ? "bg-[var(--color-brand-lime)] text-black" : "bg-transparent text-white"}`}>Портфолио</button>
            </div>

            {/* CV Card */}
            {tab === "stats" && (
              <div className="mt-5 w-full rounded-3xl border-2 border-black bg-neutral-950 p-4 shadow-[0_6px_0_#000] reveal-card relative overflow-hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl border-2 border-black grid place-items-center text-black" style={{ background: LIME }}>
                      <FileText className="size-6" />
                    </div>
                    <div>
                      <p className="font-medium">CV_User.pdf</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={generatePortfolio} disabled={isGenerating} className={`w-10 h-10 rounded-full ${isGenerating ? 'bg-yellow-300/70' : 'bg-white'} text-black border-2 border-black grid place-items-center hover:-translate-y-0.5 transition`} aria-label="Құрастыру">
                      <Wand2 className="size-5" />
                    </button>
                    <button onClick={downloadLatest} className="w-10 h-10 rounded-full bg-white text-black border-2 border-black grid place-items-center hover:-translate-y-0.5 transition" aria-label="Жүктеп алу">
                      <Download className="size-5" />
                    </button>
                  </div>
                </div>
                {/* Docs history */}
                {docs.length > 0 && (
                  <div className="mt-4 bg-neutral-900/60 border-2 border-black rounded-2xl p-3">
                    <p className="text-sm mb-2">Құжаттар тарихы</p>
                    <ul className="space-y-2 max-h-60 overflow-auto no-scrollbar pr-1">
                      {docs.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm truncate">{d.title}</p>
                            <p className="text-xs text-neutral-400">{new Date(d.createdAt).toLocaleString()}</p>
                          </div>
                          <button onClick={async () => await openPdfFromText(d.text, d.title)} className="rounded-full px-3 py-1 bg-white text-black border-2 border-black text-xs">Ашу</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Settings panel — opens after clicking gear */}
            {settingsOpen && (
              <div className="mt-5 w-full rounded-3xl border-2 border-black bg-neutral-950 p-2 shadow-[0_6px_0_#000]">
                <ul className="divide-y divide-neutral-800">
                  <li className="py-3 px-2 flex items-center justify-between">
                    <button onClick={() => setEditOpen(true)} className="w-full text-left flex items-center justify-between pressable">
                      <span>Бейінді өңдеу</span>
                      <span className="text-neutral-500">›</span>
                    </button>
                  </li>
                  <li className="py-3 px-2 flex items-center justify-between">
                    <button onClick={() => window.open('https://t.me/qynon', '_blank', 'noopener')} className="w-full text-left flex items-center justify-between pressable">
                      <span>Қолдау</span>
                      <span className="text-neutral-500">›</span>
                    </button>
                  </li>
                  <li className="py-3 px-2 flex items-center justify-between">
                    <button onClick={() => setAboutOpen(true)} className="w-full text-left flex items-center justify-between pressable">
                      <span>Қосымша туралы</span>
                      <span className="text-neutral-500">›</span>
                    </button>
                  </li>
                  <li className="py-3 px-2 flex items-center justify-center">
                    <button onClick={() => setLogoutOpen(true)} className="inline-flex items-center text-neutral-400 hover:text-white pressable">
                      <LogOut className="size-4 mr-2" /> Шығу
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </section>

          {/* Right column: Portfolio content */}
          {tab === "portfolio" && (
            <section className="space-y-6">
              <div className="reveal-card rounded-3xl border-2 border-black bg-neutral-900 shadow-[0_8px_0_#000] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl">Портфолио</h3>
                  <button onClick={() => setCustomOpen(true)} className="rounded-full px-4 py-2 bg-yellow-300 text-black border-2 border-black shadow-[0_4px_0_#000] pressable">Жазба қосу</button>
                </div>
                {customItems.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {customItems.map((ci) => (
                      <article key={ci.id} className="relative overflow-hidden rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-4 bg-neutral-950 text-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs text-black">
                              <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/80 px-3 py-1">{ci.place || "Қатысушы"}</span>
                              <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/80 px-3 py-1">Сынып: {ci.cls}</span>
                              <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/80 px-3 py-1"><Clock className="size-3" /> {ci.date}</span>
                            </div>
                            <h4 className="mt-2 font-semibold text-white break-words">{ci.contest}</h4>
                            {ci.project && <p className="text-sm text-neutral-300 mt-1">Жоба: {ci.project}</p>}
                            {ci.desc && <p className="text-sm text-neutral-300 mt-2 whitespace-pre-wrap">{ci.desc}</p>}
                            {ci.url && (
                              <a href={ci.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-[var(--color-brand-lime)] underline">
                                Сайтқа өту <ExternalLink className="size-4" />
                              </a>
                            )}
                          </div>
                          <button
                            aria-label="Жою"
                            onClick={() => setCustomItems((prev) => prev.filter((x) => x.id !== ci.id))}
                            className="w-9 h-9 rounded-full bg-white/80 text-black border-2 border-black grid place-items-center hover:bg-white"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                {portfolio.length > 0 ? (
                  <div className="mt-4 space-y-4">
                  {portfolio.map((it) => {
                    const ed = portfolioEdits[String(it.id)] || {}
                    return (
                      <article
                        key={it.id}
                        className={`relative overflow-hidden rounded-3xl border-2 border-black shadow-[0_6px_0_#000] p-4 ${it.bg} text-black`}
                      >
                        <Link href={`/calendar/${it.id}?ref=profile`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${it.title}`}>
                          <span className="sr-only">Ашу</span>
                        </Link>
                        <button
                          className="absolute top-3 right-3 z-10 rounded-full px-3 py-1 bg-white/90 text-black border-2 border-black text-xs hover:-translate-y-0.5 pressable"
                          onClick={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            setEventEditTarget(it)
                            setEvProject(ed.project || "")
                            setEvPlace(ed.place || "")
                            setEvDesc(ed.desc || "")
                            setEvUrl(ed.url || "")
                            setEventEditOpen(true)
                          }}
                        >
                          Өңдеу
                        </button>
                        <h4 className="font-semibold pr-20">{it.title}</h4>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Clock className="size-3" /> {it.start}–{it.end}</span>
                          {"category" in it && <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3 max-w-[180px] truncate"><Tag className="size-3" /> {(it as any).category}</span>}
                          <span className="inline-flex items-center justify-center h-7 rounded-full bg-black text-white gap-1 px-3"><Monitor className="size-3" /> {it.mode === 'Offline' ? 'Офлайн' : it.mode === 'Hybrid' ? 'Аралас' : 'Онлайн'}</span>
                        </div>
                        {Boolean(ed.project || ed.place || ed.desc || ed.url) && (
                          <div className="mt-3 bg-white/70 rounded-2xl border-2 border-black p-3 text-sm text-black space-y-1">
                            {ed.project && <p><span className="font-medium">Жоба:</span> {ed.project}</p>}
                            {ed.place && <p><span className="font-medium">Орын:</span> {ed.place}</p>}
                            {ed.desc && <p className="whitespace-pre-wrap"><span className="font-medium">Сипаттама:</span> {ed.desc}</p>}
                            {ed.url && <a className="underline" href={ed.url} target="_blank" rel="noreferrer">Сілтеме</a>}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
                ) : (
                  <p className="mt-2 text-neutral-400">Әзірге іс-шаралар жоқ. Күнтізбеде іс-шара қосыңыз немесе еске салғыштарды қосыңыз — олар осында көрінеді.</p>
                )}
              </div>
            </section>
          )}
          </div>
        </main>

      <BottomNav />

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white text-black border-2 border-black rounded-3xl p-6 shadow-[0_8px_0_#000]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Бейінді өңдеу</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const updatedData: any = {
                username: editUsername,
                fullName: editFullName,
                teacher: editTeacher,
              }
              if (editClass != null) updatedData.class = editClass
              const { error } = await supabase.auth.updateUser({ data: updatedData })
              if (error) {
                toast({
                  variant: "destructive",
                  title: "Сақтау сәтсіз",
                  description: error.message,
                  className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
                })
                return
              }
              // sync local storage, cookies and UI name
              try {
                if (editClass != null) {
                  localStorage.setItem("userClass", String(editClass))
                  setCookie("userClass", String(editClass))
                }
                if (editTeacher) {
                  setCookie("teacher", editTeacher)
                }
              } catch {}
              setDisplayName(editFullName || editUsername || (email ? email.split("@")[0] : "User"))
              toast({
                title: "Сақталды",
                description: "Бейін жаңартылды",
                className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
              })
              setEditOpen(false)
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Email</label>
                <Input value={email} disabled className="bg-white text-black border-2 border-black rounded-full" />
              </div>
              <div>
                <label className="block mb-1 text-sm">Username</label>
                <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="your nickname" className="bg-white text-black border-2 border-black rounded-full" />
              </div>
              <div>
                <label className="block mb-1 text-sm">Full name</label>
                <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Иван Иванов" className="bg-white text-black border-2 border-black rounded-full" />
              </div>
              <div>
                <label className="block mb-1 text-sm">Сынып жетекшісі</label>
                <Input value={editTeacher} onChange={(e) => setEditTeacher(e.target.value)} placeholder="Мысалы: Айгүл Апай" className="bg-white text-black border-2 border-black rounded-full" />
              </div>
              <div>
                <label className="block mb-2 text-sm">Class</label>
                <div className="flex flex-wrap gap-2">
                  {CLASS_LEVELS.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setEditClass(cls)}
                      aria-pressed={editClass === cls}
                      className={`rounded-full px-4 py-2 border-2 border-black shadow-[0_4px_0_#000] ${editClass === cls ? 'bg-[var(--color-brand-lime)] text-black -translate-y-0.5' : 'bg-neutral-200 text-black hover:-translate-y-0.5'}`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" className="rounded-full border-2 border-black" onClick={() => setEditOpen(false)}>Бас тарту</Button>
              <Button type="submit" className="rounded-full border-2 border-black bg-yellow-300 text-black hover:bg-yellow-400">Сақтау</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logout Confirm Dialog */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="bg-white text-black border-2 border-black rounded-3xl p-6 shadow-[0_8px_0_#000]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Аккаунттан шығу</DialogTitle>
          </DialogHeader>
          <p className="mt-2">Шығуды растайсыз ба? Сіз жүйеден шығасыз, бірақ кез келген уақытта қайта кіре аласыз.</p>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" className="rounded-full border-2 border-black" onClick={() => setLogoutOpen(false)}>Бас тарту</Button>
            <Button type="button" className="rounded-full border-2 border-black bg-red-500 text-white hover:-translate-y-0.5" onClick={handleLogout}>Шығу</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Saved Event Dialog */}
      <Dialog open={eventEditOpen} onOpenChange={(o) => { setEventEditOpen(o); if (!o) { setEventEditTarget(null) } }}>
        <DialogContent className="bg-white text-black border-2 border-black rounded-3xl p-6 shadow-[0_8px_0_#000]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Іс-шараны өңдеу</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!eventEditTarget) { setEventEditOpen(false); return }
              const id = String(eventEditTarget.id)
              const entry = {
                project: evProject.trim() || undefined,
                place: evPlace.trim() || undefined,
                desc: evDesc.trim() || undefined,
                url: evUrl.trim() || undefined,
              }
              setPortfolioEdits((prev) => ({ ...prev, [id]: entry }))
              setEventEditOpen(false)
              toast({ title: "Сақталды", description: "Өзгерістер қолданылды", className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]" })
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Жоба атауы</label>
                <Input value={evProject} onChange={(e) => setEvProject(e.target.value)} placeholder="Мысалы: Smart Garden" className="bg-white text-black border-2 border-black rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-sm">Орын</label>
                  <Input value={evPlace} onChange={(e) => setEvPlace(e.target.value)} placeholder="I орын / II / III / Қатысушы" className="bg-white text-black border-2 border-black rounded-full" />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Сілтеме</label>
                  <Input value={evUrl} onChange={(e) => setEvUrl(e.target.value)} placeholder="https://..." className="bg-white text-black border-2 border-black rounded-full" />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm">Сипаттама</label>
                <textarea value={evDesc} onChange={(e) => setEvDesc(e.target.value)} rows={4} className="w-full rounded-2xl border-2 border-black px-3 py-2 bg-white text-black" placeholder="Қысқаша не істедіңіз, қандай нәтижеге жеттіңіз" />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" className="rounded-full border-2 border-black" onClick={() => setEventEditOpen(false)}>Бас тарту</Button>
              <Button type="submit" className="rounded-full border-2 border-black bg-yellow-300 text-black hover:bg-yellow-400">Сақтау</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* About Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="bg-white text-black border-2 border-black rounded-3xl p-6 shadow-[0_8px_0_#000]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Қосымша туралы</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>CareerUp — оқушылар мен студенттерге арналған мүмкіндіктерді (олимпиада, жоба, хакатон) бір жерге жинайтын қосымша.</p>
            <p>Сұрақтар бойынша Telegram: <a className="underline" href="https://t.me/qynon" target="_blank" rel="noreferrer noopener">@qynon</a></p>
            <p className="text-sm text-neutral-500">v1.0 • © {new Date().getFullYear()}</p>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" className="rounded-full border-2 border-black bg-yellow-300 text-black hover:bg-yellow-400" onClick={() => setAboutOpen(false)}>Жабу</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-screen Generation Overlay */}
      {genStage !== 'idle' && (
        <div className="fixed inset-0 z-[100] grid place-items-center animate-pop-in">
          <div className={`absolute inset-0 fog-layer fog-bg ${genStage === 'done' ? 'animate-fog-out-adv' : 'animate-fog-in-adv animate-yellow-pulse'} bg-yellow-300/60`} />
          <div className="relative z-10 flex flex-col items-center gap-3 animate-pop-in">
            {genStage === 'thinking' && (
              <>
                <img src="/images/GoalUp Иконка - Думает-Photoroom.png" alt="Ойлануда" className="w-28 h-28 animate-pop-in animate-bob object-contain icon-no-frame icon-crop" />
                <p className="text-black font-medium bg-white/80 rounded-full px-4 py-1 border-2 border-black">Мен құрастырып жатырмын…</p>
              </>
            )}
            {genStage === 'idea' && (
              <>
                <img src="/images/GoalUp Иконка - Идея-Photoroom.png" alt="Идея" className="w-28 h-28 animate-pop-in object-contain icon-no-frame icon-crop" style={{ animationDelay: '120ms' }} />
                <p className="text-black font-medium bg-white/80 rounded-full px-4 py-1 border-2 border-black">Мен ойластырдым!</p>
              </>
            )}
            {genStage === 'done' && (
              <>
                <div className="w-20 h-20 rounded-full bg-white grid place-items-center shadow-[0_6px_0_#000] animate-pop-in" style={{ animationDelay: '150ms' }}><Check className="size-10 text-green-600" /></div>
                <p className="text-black font-medium bg-white/80 rounded-full px-4 py-1 border-2 border-black">Дайын</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Portfolio Item */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="bg-white text-black border-2 border-black rounded-3xl p-6 shadow-[0_8px_0_#000]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Портфолиоға жазба қосу</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!cpContest.trim() || !cpProject.trim() || !cpPlace.trim() || !cpDate.trim()) {
                toast({ variant: "destructive", title: "Барлық міндетті өрістерді толтырыңыз", className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]" })
                return
              }
              const item: CustomItem = {
                id: String(Date.now()),
                contest: cpContest.trim(),
                project: cpProject.trim(),
                place: cpPlace.trim(),
                desc: cpDesc.trim(),
                date: cpDate,
                cls: cpClass || (editClass ? String(editClass) : ""),
                url: cpUrl.trim(),
              }
              setCustomItems((prev) => [item, ...prev])
              setCustomOpen(false)
              setCpContest(""); setCpProject(""); setCpPlace(""); setCpDesc(""); setCpDate(""); setCpUrl("")
              toast({ title: "Сақталды", description: "Жазба портфолиоға қосылды", className: "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]" })
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm">Конкурс атауы</label>
                <Input value={cpContest} onChange={(e) => setCpContest(e.target.value)} placeholder="Мысалы: Жас ғалымдар конкурсы" className="bg-white text-black border-2 border-black rounded-full" />
              </div>
              <div>
                <label className="block mb-1 text-sm">Жоба атауы</label>
                <Input value={cpProject} onChange={(e) => setCpProject(e.target.value)} placeholder="Сіздің жобаңыз" className="bg-white text-black border-2 border-black rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-sm">Орын</label>
                  <Input value={cpPlace} onChange={(e) => setCpPlace(e.target.value)} placeholder="I орын / II / III / Қатысушы" className="bg-white text-black border-2 border-black rounded-full" />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Сынып</label>
                  <Input value={cpClass} onChange={(e) => setCpClass(e.target.value)} placeholder="9" className="bg-white text-black border-2 border-black rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-sm">Күні</label>
                  <Input type="date" value={cpDate} onChange={(e) => setCpDate(e.target.value)} className="bg-white text-black border-2 border-black rounded-full" />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Сайт</label>
                  <Input value={cpUrl} onChange={(e) => setCpUrl(e.target.value)} placeholder="https://..." className="bg-white text-black border-2 border-black rounded-full" />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm">Сипаттама</label>
                <textarea value={cpDesc} onChange={(e) => setCpDesc(e.target.value)} rows={4} className="w-full rounded-2xl border-2 border-black px-3 py-2 bg-white text-black" placeholder="Қысқаша сипаттама" />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" className="rounded-full border-2 border-black" onClick={() => setCustomOpen(false)}>Бас тарту</Button>
              <Button type="submit" className="rounded-full border-2 border-black bg-yellow-300 text-black hover:bg-yellow-400">Қосу</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

