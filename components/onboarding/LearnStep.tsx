import React from "react"

export default function LearnStep() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8">
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl md:text-6xl font-bold text-black mb-8">
          Үйреніп,
          <br />
          машықтан
        </h2>
      </div>
      <div className="w-80 h-80 mb-12">
        <img src="/images/learn-new.png" alt="Үйрену және тәжірибе иллюстрациясы" className="w-full h-full object-contain" />
      </div>
    </div>
  )
}
