import React from "react"

export type BrandPhase = "background" | "typing" | "complete"

interface BrandStepProps {
  typedText: string
  phase: BrandPhase
}

export default function BrandStep({ typedText, phase }: BrandStepProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {(phase === "typing" || phase === "complete") && (
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-black text-center">
          {typedText}
          {phase === "typing" && <span className="animate-pulse">|</span>}
        </h1>
      )}
    </div>
  )
}
