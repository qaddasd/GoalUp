"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface AuthChoiceProps {
  onSignIn: () => void
  onSignUp: () => void
}

export default function AuthChoice({ onSignIn, onSignUp }: AuthChoiceProps) {
  return (
    <div className="w-full flex flex-col items-center animate-auth-in px-8">
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl md:text-6xl font-bold text-black mb-8">
          Карьераны
          <br />
          бастайық!
        </h2>
      </div>
      <div className="w-80 h-80 mb-12">
        <img src="/images/career-new.png" alt="Иллюстрация начала карьеры" className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button
          onClick={onSignIn}
          className="bg-yellow-300 hover:bg-yellow-400 text-black font-semibold py-4 rounded-full text-lg border-2 border-black shadow-[0_4px_0_#000] transition-all"
          size="lg"
        >
          Кіру
        </Button>
        <Button
          onClick={onSignUp}
          variant="outline"
          className="bg-white hover:bg-gray-50 text-black font-semibold py-4 rounded-full text-lg border-2 border-black shadow-[0_4px_0_#000] transition-all"
          size="lg"
        >
          Тіркелу
        </Button>
      </div>
    </div>
  )
}
