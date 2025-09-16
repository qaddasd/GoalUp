"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"

interface RegisterFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

export default function RegisterForm({ onSubmit, onBack }: RegisterFormProps) {
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  return (
    <div className="w-full max-w-sm animate-auth-in">
      <h2 className="font-serif text-3xl font-bold text-black mb-8 text-center">
        Есептік
        <br />
        жазба құру
      </h2>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-black text-sm font-medium mb-2">Эл. пошта</label>
          <input
            type="email"
            name="email"
            placeholder="example@gmail.com"
            className="w-full py-4 px-4 rounded-full bg-white text-gray-900 placeholder-gray-500 border-2 border-black"
          />
        </div>
        <div>
          <label className="block text-black text-sm font-medium mb-2">Пайдаланушы аты</label>
          <input
            type="text"
            name="username"
            placeholder="лақап атыңыз"
            className="w-full py-4 px-4 rounded-full bg-white text-gray-900 placeholder-gray-500 border-2 border-black"
          />
        </div>
        <div>
          <label className="block text-black text-sm font-medium mb-2">Толық аты-жөні</label>
          <input
            type="text"
            name="fullName"
            placeholder="Иван Иванов"
            className="w-full py-4 px-4 rounded-full bg-white text-gray-900 placeholder-gray-500 border-2 border-black"
          />
        </div>
        <div>
          <label className="block text-black text-sm font-medium mb-2">Құпиясөз</label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            className="w-full py-4 px-4 rounded-full bg-white text-gray-900 placeholder-gray-500 border-2 border-black"
          />
        </div>
        <div>
          <label className="block text-black text-sm font-medium mb-2">Құпиясөзді қайталау</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            className="w-full py-4 px-4 rounded-full bg-white text-gray-900 placeholder-gray-500 border-2 border-black"
          />
        </div>
        <div>
          <label className="block text-black text-sm font-medium mb-2">Сынып</label>
          {/* Keep value in form submission */}
          <input type="hidden" name="class" value={selectedClass ?? ""} />
          <div className="reveal-card flex flex-wrap gap-2">
            {[7, 8, 9, 10, 11, 12].map((cls) => (
              <button
                key={cls}
                type="button"
                aria-pressed={selectedClass === cls}
                onClick={() => setSelectedClass(cls)}
                className={
                  `rounded-full px-4 py-2 border-2 border-black shadow-[0_4px_0_#000] transition-all duration-200 ` +
                  (selectedClass === cls
                    ? "bg-[var(--color-brand-lime)] text-black -translate-y-0.5"
                    : "bg-neutral-900 text-white hover:-translate-y-0.5")
                }
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full bg-yellow-300 hover:bg-yellow-400 text-black font-semibold py-4 rounded-full text-lg mt-8 border-2 border-black shadow-[0_4px_0_#000] transition-all">
          Есептік жазба құру
        </Button>
      </form>
      <Button onClick={onBack} variant="ghost" className="w-full text-black mt-4">Қайту</Button>
    </div>
  )
}
