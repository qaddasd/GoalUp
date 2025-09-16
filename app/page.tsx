"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { setCookie } from "@/lib/cookies"
import BrandStep from "@/components/onboarding/BrandStep"
import WelcomeStep from "@/components/onboarding/WelcomeStep"
import LearnStep from "@/components/onboarding/LearnStep"
import SupportStep from "@/components/onboarding/SupportStep"
import AuthChoice from "@/components/onboarding/AuthChoice"
import LoginForm from "@/components/onboarding/LoginForm"
import RegisterForm from "@/components/onboarding/RegisterForm"
import BottomNext from "@/components/onboarding/BottomNext"
import { toast } from "@/hooks/use-toast"

const fullText = "GoalUp//"

const preloadImages = () => {
  const imageUrls = [
    "/images/welcome-new.png",
    "/images/learn-new.png",
    "/images/support-new.png",
    "/images/career-new.png",
  ]

  imageUrls.forEach((url) => {
    const img = new Image()
    img.src = url
  })
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [introPhase, setIntroPhase] = useState<"background" | "typing" | "complete">("background")
  const [typedText, setTypedText] = useState("")
  const [authMode, setAuthMode] = useState<"choice" | "login" | "register">("choice")
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({
    email: "",
    username: "",
    fullName: "",
    class: "",
  })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginShake, setLoginShake] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = (fd.get("email") || "").toString().trim()
    const password = (fd.get("password") || "").toString()

    if (!email || !password) {
      toast({
        title: "Кіру қатесі",
        description: "Эл. пошта мен құпиясөзді енгізіңіз",
        className:
          "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
      })
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoginError("Эл. пошта немесе құпиясөз дұрыс емес")
      setLoginShake(true)
      setTimeout(() => setLoginShake(false), 500)
      toast({
        variant: "destructive",
        title: "Кіру талпынысы сәтсіз",
        description: "Деректерді тексеріңіз",
        className:
          "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
      })
      return
    }

    try {
      const cls = (data.user?.user_metadata as any)?.class
      if (cls) {
        localStorage.setItem("userClass", String(cls))
        setCookie("userClass", String(cls))
      }
    } catch {}

    setLoginError(null)
    setIsAuthenticated(true)
    toast({
      title: "Сәтті кірдіңіз",
      description: "Қош келдіңіз!",
      className:
        "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
    })
    router.push("/home")
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const required = ["email", "username", "fullName", "class", "password", "confirmPassword"]
    const ok = required.every((k) => (fd.get(k) || "").toString().trim())

    if (!ok) {
      toast({
        variant: "destructive",
        title: "Барлық өрістерді толтырыңыз",
        className:
          "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
      })
      return
    }

    const email = (fd.get("email") || "").toString().trim()
    const username = (fd.get("username") || "").toString().trim()
    const fullName = (fd.get("fullName") || "").toString().trim()
    const cls = (fd.get("class") || "").toString().trim()
    const password = (fd.get("password") || "").toString()
    const confirmPassword = (fd.get("confirmPassword") || "").toString()

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Құпиясөз әлсіз",
        description: "Құпиясөз ұзындығы кемінде 6 таңба болу керек",
        className:
          "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
      })
      return
    }
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Құпиясөздер бірдей емес",
        description: "Қайтадан енгізіңіз",
        className:
          "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
      })
      return
    }

    // Supabase sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, fullName, class: cls },
      },
    })

    if (error) {
      toast({
        variant: "destructive",
        title: "Тіркелу сәтсіз",
        description: error.message,
        className:
          "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
      })
      return
    }

    try { localStorage.setItem("userClass", cls); setCookie("userClass", cls) } catch {}

    if (data.session) {
      toast({
        title: "Есептік жазба құрылды",
        description: "Сіз жүйеге кірдіңіз",
        className:
          "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
      })
      router.push("/home")
    } else {
      toast({
        title: "Есептік жазба құрылды",
        description: "Эл. пошта арқылы растаңыз немесе кіріңіз",
        className:
          "border-2 border-black rounded-full bg-white text-black shadow-[0_6px_0_#000]",
      })
      setAuthMode("login")
    }
  }

  const steps = [
    {
      id: "brand",
      background: "bg-[var(--color-brand-lime)]",
      content: <BrandStep typedText={typedText} phase={introPhase} />,
    },
    {
      id: "welcome",
      background: "bg-[var(--color-hero-purple)]",
      content: <WelcomeStep />,
    },
    {
      id: "learn",
      background: "bg-[var(--color-hero-purple)]",
      content: <LearnStep />,
    },
    {
      id: "support",
      background: "bg-[var(--color-accent-yellow)]",
      content: <SupportStep />,
    },
    {
      id: "login",
      background: "bg-[var(--color-hero-purple)]",
      content: (
        <div className="flex flex-col items-center justify-center min-h-screen px-8">
          {authMode === "choice" && (
            <AuthChoice onSignIn={() => setAuthMode("login")} onSignUp={() => setAuthMode("register")} />
          )}

          {authMode === "login" && (
            <LoginForm onSubmit={handleLogin} onBack={() => setAuthMode("choice")} errorText={loginError ?? undefined} shake={loginShake} />
          )}

          {authMode === "register" && (
            <RegisterForm onSubmit={handleRegister} onBack={() => setAuthMode("choice")} />
          )}

          {/* Removed post-login welcome text */}
        </div>
      ),
    },
  ]

  useEffect(() => {
    if (introPhase === "typing") {
      if (typedText.length < fullText.length) {
        const timer = setTimeout(() => {
          setTypedText(fullText.slice(0, typedText.length + 1))
        }, 150) // Speed of typing (150ms per character)

        return () => clearTimeout(timer)
      } else {
        const completeTimer = setTimeout(() => {
          setIntroPhase("complete")
          const nextStepTimer = setTimeout(() => {
            setCurrentStep(1)
          }, 2000)
          return () => clearTimeout(nextStepTimer)
        }, 500)

        return () => clearTimeout(completeTimer)
      }
    }
  }, [introPhase, typedText, fullText])

  useEffect(() => {
    if (currentStep === 0) {
      const backgroundTimer = setTimeout(() => {
        setIntroPhase("typing")
        preloadImages() // Start preloading images when typing begins
      }, 1000)

      return () => {
        clearTimeout(backgroundTimer)
      }
    }
  }, [currentStep])

  useEffect(() => {
    if (currentStep === 0) {
      setIntroPhase("background")
      setTypedText("")
    }
  }, [currentStep])

  // If already authenticated, skip onboarding
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: sessionData }: any) => {
      if (!mounted) return
      if (sessionData?.session) router.replace("/home")
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) router.replace("/home")
    }) as any
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className={`min-h-screen transition-colors duration-700 ease-in-out ${steps[currentStep].background}`}>
      <div key={steps[currentStep].id} className="animate-fade-in">{steps[currentStep].content}</div>

      {/* Fixed Next button for steps 1-3, without movement on press */}
      <BottomNext
        visible={[1, 2, 3].includes(currentStep)}
        onNext={() => setCurrentStep((s) => Math.min(s + 1, steps.length - 1))}
      />

      {/* Progress indicator */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentStep ? "bg-black" : "bg-black/30"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
