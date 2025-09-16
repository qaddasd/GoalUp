"use client"

import { useEffect } from "react"
// Optional: toast once to inform PWA availability
import { toast } from "@/hooks/use-toast"

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Show a one-time toast that offline is available
          try {
            const k = "pwa_toast_shown"
            if (!localStorage.getItem(k)) {
              toast({
                title: "Офлайн режим қосылды",
                description: "Қосымшаны интернетсіз де шектеулі режимде ашуға болады",
                className:
                  "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
              })
              localStorage.setItem(k, "1")
            }
          } catch {}

          // Handle updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // A new version is available
                toast({
                  title: "Жаңарту дайын",
                  description: "Жаңартуды көру үшін бетті қайта жүктеңіз",
                  className:
                    "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
                })
              }
            })
          })
        })
        .catch(() => {})
    }

    if (document.readyState === "complete") onLoad()
    else window.addEventListener("load", onLoad, { once: true })

    return () => {
      window.removeEventListener("load", onLoad)
    }
  }, [])

  return null
}
