import React from "react"

export default function SupportStep() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8">
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl md:text-6xl font-bold text-black mb-8">
          Жаңа
          <br />
          карьераңызда
          <br />
          қолдау алыңыз
        </h2>
      </div>
      <div className="w-80 h-80 mb-12">
        <img src="/images/support-new.png" alt="Карьераға қолдау иллюстрациясы" className="w-full h-full object-contain" />
      </div>
    </div>
  )
}
