"use client"

import React, { useEffect, useMemo, useState } from "react"
import BottomNav from "@/components/shared/BottomNav"
import Link from "next/link"
import { Search as SearchIcon, Menu, ChevronRight, Tag } from "lucide-react"
import { EVENTS } from "@/lib/events"

export default function SearchPage() {
  const [query, setQuery] = useState<string>("")
  const [allEvents] = useState(() => EVENTS)

  // Initialize query from URL (?q=...) once
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const q = sp.get("q") || ""
      if (q) setQuery(q)
    } catch {}
  }, [])

  // Keep URL in sync with query (no navigation)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      if (query) sp.set("q", query)
      else sp.delete("q")
      const newUrl = `${window.location.pathname}${sp.toString() ? `?${sp.toString()}` : ""}`
      window.history.replaceState({}, "", newUrl)
    } catch {}
  }, [query])

  // categories derived from dataset
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const e of allEvents) if (e.category) set.add(e.category)
    return Array.from(set)
  }, [allEvents])

  const results = useMemo(() => {
    const norm = (str: string) =>
      (str || "")
        .toLocaleLowerCase("ru")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "") // strip diacritics just in case
    const q = norm(query.trim())
    if (!q) return []
    return allEvents.filter((e) => {
      const s = norm(e.section)
      const t = norm(e.title)
      const c = norm(e.category || "")
      const d = norm(e.description || "")
      const w = norm(e.award || "")
      const l = norm(e.link || "")
      return (
        s.includes(q) ||
        t.includes(q) ||
        c.includes(q) ||
        d.includes(q) ||
        w.includes(q) ||
        l.includes(q)
      )
    })
  }, [allEvents, query])

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.toLowerCase().includes(query.toLowerCase())),
    [query, categories]
  )

  return (
    <div className="smooth min-h-screen bg-black text-white pb-28">
      {/* Header/Search */}
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-5xl reveal-card">
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-full bg-neutral-900 border-2 border-black shadow-[0_4px_0_#000] px-3 py-2 flex items-center">
              <SearchIcon className="text-white/70 size-5 mr-2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Іс-шаралар, жобалар, санаттарды іздеу"
                className="flex-1 bg-transparent outline-none placeholder:text-neutral-500"
              />
              <button
                aria-label="Сүзгілер"
                className="ml-2 w-9 h-9 rounded-full bg-neutral-800 border-2 border-black grid place-items-center pressable"
              >
                <Menu className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 mt-6 space-y-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Results */}
          {query.trim().length > 0 && (
            <section className="reveal-card">
              <h2 className="text-[var(--color-brand-lime)] font-medium">Нәтижелер</h2>
              {results.length === 0 ? (
                <p className="text-neutral-400 mt-3">Нәтижелер жоқ</p>
              ) : (
                <ul className="mt-2 divide-y divide-neutral-800">
                  {results.map((item) => (
                    <li key={`${item.section}-${item.id}`} className="relative flex items-center justify-between py-3 hover:bg-neutral-900/60 rounded-xl px-2 -mx-2 transition-colors">
                      <div>
                        <p className="text-[17px] leading-tight">{item.title}</p>
                        <p className="text-xs text-neutral-400 inline-flex items-center gap-2">
                          <span>{item.section}</span>
                          {item.category && (<span className="inline-flex items-center gap-1 text-[10px] rounded-full border px-2 py-0.5"><Tag className="size-3" />{item.category}</span>)}
                        </p>
                      </div>
                      <button aria-label={`Ашу ${item.title}`} className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-black grid place-items-center pressable">
                        <ChevronRight className="size-4" />
                      </button>
                      <Link href={`/calendar/${item.id}`} className="absolute inset-0 z-[5]" aria-label={`Ашу ${item.title}`}>
                        <span className="sr-only">Ашу</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Categories */}
          <section className="reveal-card">
            <h2 className="text-[var(--color-brand-lime)] font-medium">Санаттар</h2>
            <ul className="mt-2 divide-y divide-neutral-800">
              {filteredCategories.slice(0, 6).map((item) => (
                <li key={item} className="flex items-center justify-between py-3 hover:bg-neutral-900/60 rounded-xl px-2 -mx-2 transition-colors">
                  <span className="text-[17px]">{item}</span>
                  <button
                    aria-label={`Ашу ${item}`}
                    onClick={() => setQuery(item)}
                    className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-black grid place-items-center pressable"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button className="mt-2 inline-flex items-center gap-1 text-[var(--color-brand-lime)] pressable">
              <span>Барлығын көрсету</span>
              <ChevronRight className="size-4" />
            </button>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
