import BottomNav from "@/components/shared/BottomNav"

export default function Page() {
  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <header className="px-4 pt-6 pb-4">
        <h1 className="font-serif text-3xl text-center">Career</h1>
      </header>

      <main className="px-4">
        <h2 className="text-lg mb-3">Items</h2>
        <div className="space-y-4">
          {[
            { title: "UX Designer", location: "California, USA", bg: "bg-[#cbb6ff]" },
            { title: "QA Engineer", location: "New York, USA", bg: "bg-[#ffeaa8]" },
            { title: "Junior UI Designer", location: "London, UK", bg: "bg-[#c4c8ff]" },
          ].map((job, i) => (
            <article key={i} className={`rounded-2xl border-2 border-black shadow-[0_6px_0_#000] p-4 text-black ${job.bg}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm opacity-80">We’re hiring for {job.title}</p>
                </div>
                <span className="text-sm">{job.location}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <span className="rounded-full border-2 border-black px-2 py-0.5 text-xs bg-white">Full-time</span>
                <span className="rounded-full border-2 border-black px-2 py-0.5 text-xs bg-white">Middle</span>
              </div>
            </article>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
