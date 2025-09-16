"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search as SearchIcon, Heart, Calendar, User } from "lucide-react"

export default function BottomNav() {
  const pathname = usePathname()

  const btnClass = (active: boolean) =>
    `grid place-items-center size-10 rounded-full border-2 transition-colors pressable ${
      active
        ? "bg-white text-black border-black shadow-[0_3px_0_#000]"
        : "border-transparent hover:bg-white/10"
    }`

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[88%] max-w-md bg-neutral-900/80 backdrop-blur-md text-white rounded-full border-2 border-black ring-1 ring-black/20 shadow-[0_10px_0_#000] px-5 py-2.5 z-50">
      <ul className="flex items-center justify-between">
        <li>
          <Link aria-label="Басты" href="/home" className={btnClass(pathname?.startsWith("/home") ?? false)}>
            <Home className="size-5" />
          </Link>
        </li>
        <li>
          <Link aria-label="Іздеу" href="/search" className={btnClass(pathname?.startsWith("/search") ?? false)}>
            <SearchIcon className="size-5" />
          </Link>
        </li>
        <li>
          <Link aria-label="Күнтізбе" href="/calendar" className={btnClass(pathname?.startsWith("/calendar") ?? false)}>
            <Calendar className="size-5" />
          </Link>
        </li>
        <li>
          <Link aria-label="Таңдаулы" href="/favorites" className={btnClass(pathname?.startsWith("/favorites") ?? false)}>
            <Heart className="size-5" />
          </Link>
        </li>
        <li>
          <Link aria-label="Бейін" href="/profile" className={btnClass(pathname?.startsWith("/profile") ?? false)}>
            <User className="size-5" />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
