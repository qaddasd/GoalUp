"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LoginFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onBack: () => void
  errorText?: string
  shake?: boolean
}

export default function LoginForm({ onSubmit, onBack, errorText, shake }: LoginFormProps) {
  return (
    <div className={`w-full max-w-sm animate-auth-in ${shake ? 'animate-shake' : ''}`}>
      <h2 className="font-serif text-3xl font-bold text-black mb-8 text-center">Кіру</h2>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-black text-sm font-medium mb-2">Эл. пошта</label>
          <Input
            type="text"
            name="email"
            placeholder="example@gmail.com"
            className="w-full py-4 px-4 rounded-full bg-white text-gray-900 placeholder-gray-500 border-2 border-black"
          />
        </div>
        <div>
          <label className="block text-black text-sm font-medium mb-2">Құпиясөз</label>
          <Input
            type="password"
            name="password"
            placeholder="••••••••"
            aria-invalid={!!errorText}
            className="w-full py-4 px-4 rounded-full bg-white text-gray-900 placeholder-gray-500 border-2 border-black"
          />
        </div>
        {errorText && (
          <div className="text-sm text-red-700 bg-red-100 border-2 border-black rounded-full px-4 py-2 animate-pop-in">
            {errorText}
          </div>
        )}
        <Button type="submit" className="w-full bg-yellow-300 hover:bg-yellow-400 text-black font-semibold py-4 rounded-full text-lg mt-8 border-2 border-black shadow-[0_4px_0_#000] transition-all">
          Кіру
        </Button>
      </form>
      <Button onClick={onBack} variant="ghost" className="w-full text-black mt-4">
        Қайту
      </Button>
    </div>
  )
}
