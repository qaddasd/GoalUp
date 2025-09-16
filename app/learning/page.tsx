import BottomNav from "@/components/shared/BottomNav"
import { BookOpen, FlaskConical } from "lucide-react"

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <header className="px-4 pt-6 pb-4">
        <h1 className="font-serif text-3xl text-center">My learning</h1>
      </header>

      <main className="px-4 space-y-6">
        <section>
          <h2 className="text-lg mb-3">Подробнее</h2>
          <div className="rounded-2xl border-2 border-black shadow-[0_6px_0_#000] overflow-hidden">
            <div className="w-full h-40 bg-white/60 grid place-items-center text-black">
              <BookOpen className="size-12" />
            </div>
            <div className="h-1 bg-yellow-300" />
          </div>
        </section>

        <section>
          <div className="rounded-2xl border-2 border-black shadow-[0_6px_0_#000] h-36 bg-neutral-800/60 grid place-items-center">
            <FlaskConical className="size-10 text-white/90" />
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
