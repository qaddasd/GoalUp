"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface BottomNextProps {
  onNext: () => void
  visible: boolean
}

export default function BottomNext({ onNext, visible }: BottomNextProps) {
  if (!visible) return null
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2">
      <Button
        onClick={onNext}
        className="bg-transparent text-black font-semibold py-3 px-10 rounded-full text-lg border-2 border-black shadow-[0_4px_0_#000] transition-all pressable"
      >
        Келесі
      </Button>
    </div>
  )
}
