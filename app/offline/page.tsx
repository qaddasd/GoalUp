export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black text-white grid place-items-center p-6">
      <div className="max-w-lg text-center">
        <h1 className="font-serif text-3xl">Офлайн режим</h1>
        <p className="mt-3 text-neutral-300">
          Қазір интернет байланысы жоқ сияқты. Кейбір беттер мен деректер қолжетімсіз болуы мүмкін,
          бірақ кэште сақталған бөліктерді қарауға болады. Байланыс қалпына келген соң парақты
          қайта жүктеңіз.
        </p>
        <a
          href="/"
          className="inline-flex mt-6 rounded-full px-5 py-2 bg-white text-black border-2 border-black shadow-[0_4px_0_#000] hover:-translate-y-0.5 transition"
        >
          Басты бетке оралу
        </a>
      </div>
    </div>
  )
}
