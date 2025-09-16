import { NextResponse } from "next/server"

// Build a solid Kazakh prompt from provided user and items
function buildPrompt(input: any): string {
  const user = input?.user || {}
  const items = Array.isArray(input?.items) ? input.items : []
  const name = user.fullName || user.username || (user.email ? String(user.email).split("@")[0] : "Пайдаланушы")
  const cls = user.class ? `Сыныбы: ${user.class}` : ""
  const teacher = user.teacher ? `Сынып жетекшісі: ${user.teacher}` : ""
  const email = user.email ? `Email: ${user.email}` : ""
  const intro = `Мен туралы қысқаша емес, мазмұнды портфолио (CV) құрастыр: ${name}. ${cls}. ${teacher}. ${email}. Тіл: қазақша. Кәсіби, бірақ түсінікті стиль.`

  const itemsPart = items.length
    ? `\nМына іс-шараларға қатыстым (атауы – мерзімі – формат/санат – жетістік/жоба):\n- ` +
      items
        .map((e: any) => {
          const parts = [
            e.title || e.contest || "",
            e.dateRange || e.date || "",
            e.mode || e.category || "",
            e.place || e.project || "",
          ].filter(Boolean)
          return parts.join(" — ")
        })
        .join("\n- ")
    : ""

  const request = `\nТалаптар:\n- Тақырыпша: Портфолио / CV\n- Бөлімдер: Қысқаша мәлімет (2–3 сөйлем), Негізгі дағдылар (8–12 маркер), Жобалар/Жетістіктер, Байланыс\n- Әрбір іс-шара/жоба үшін бөлек блок бер:\n  • Атауы және мерзімі\n  • Рөлі/орны, жоба атауы\n  • Қысқаша сипаттама (3–5 сөйлем) — мақсат, не істелді, нәтижесі\n  • Нақты әрекеттер (3–6 маркер): қандай міндеттер атқарылды\n  • Нәтижелер/жетістіктер (мүмкін болса сандармен) және алған орын\n  • Қолданған дағдылар\n  • Сілтеме бар болса\n- Тізімдер маркерлі болсын («•»)\n- Мерзім мен жетістіктерді нақты көрсет\n- Соңында қысқа қорытынды (1–2 сөйлем)\n`

  return [intro, itemsPart, request].filter(Boolean).join("\n\n").trim()
}

export async function POST(req: Request) {
  try {
    const input = await req.json().catch(() => ({}))
    const prompt: string = input?.prompt && String(input.prompt).trim().length > 0 ? input.prompt : buildPrompt(input)

    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
      // @ts-ignore
      cache: "no-store",
    })

    if (!res.ok || !res.body) {
      return NextResponse.json({ error: "Қызмет қол жетімді емес", status: res.status }, { status: 500 })
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let raw = ""
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      raw += decoder.decode(value, { stream: true })
    }
    // Try to parse SSE format and collect only content
    let clean = ""
    try {
      const lines = raw.split(/\r?\n/)
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data:")) continue
        const payload = trimmed.slice(5).trim()
        if (!payload || payload === "[DONE]") continue
        try {
          const json = JSON.parse(payload)
          const choice = json?.choices?.[0]
          const deltaContent = choice?.delta?.content
          const messageContent = choice?.message?.content
          const content = deltaContent ?? messageContent ?? json?.content ?? ""
          if (typeof content === "string") clean += content
        } catch {
          // Not JSON; treat as plain chunk
          clean += payload
        }
      }
    } catch {
      clean = raw
    }

    const text = (clean || raw).trim()
    return NextResponse.json({ text, usedPrompt: prompt })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Жүйелік қате" }, { status: 500 })
  }
}
