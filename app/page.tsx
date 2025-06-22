"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const categories = [
{ icon: "🎨", label: "Art" },
{ icon: "🚗", label: "Auto" },
{ icon: "📚", label: "Books" },
{ icon: "🍳", label: "Cooking" },
{ icon: "📱", label: "Electronics" },
{ icon: "👕", label: "Fashion" },
{ icon: "🏋️", label: "Fitness" },
{ icon: "🎮", label: "Gaming" },
{ icon: "🏠", label: "Home" },
{ icon: "🎵", label: "Music" },
{ icon: "🌱", label: "Plants" },
{ icon: "🧘", label: "Wellness" },
]

const animatedPhrases = [
  "From Art Supplies to Automotives",
  "From Cooking to Cleaning",
  "From Fitness to Fashion",
  "From Gaming to Sleeping",
  "From Gardening to Gadgets",
]

const ctaTexts = [
  "Let's Begin",
  "Get Started",
  "Start Shopping",
  "Begin Your Journey",
  "Explore Now",
  "Kick Off",
  "Dive In",
  "Start Now",
  "Let's Go",
  "Ready, Set, Shop",
]

export default function Landing() {
  const router = useRouter()
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [ctaText, setCtaText] = useState(ctaTexts[0])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    setCtaText(ctaTexts[Math.floor(Math.random() * ctaTexts.length)])

    // Optional backend health-check
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? ""
    if (apiBase) {
      fetch(`${apiBase}/api/health`)
        .then((res) => res.ok && res.json())
        .then((data) => {
          if (data) console.log("Backend connected:", data)
        })
        .catch(() => {
          console.info("Backend not reachable – continuing in frontend-only mode")
        })
    }

    // Animated subtitle rotation
    const phraseInterval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % animatedPhrases.length)
    }, 3500)

    // Auto-slide carousel
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % (categories.length - 3))
    }, 4000)

    return () => {
      clearInterval(phraseInterval)
      clearInterval(slideInterval)
    }
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % (categories.length - 3))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + (categories.length - 3)) % (categories.length - 3))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden relative">
      {/* Enhanced Neon Background with Corner Glows */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Corner Neon Glows with Pulsing Animation */}
        <div
          className="absolute top-0 left-0 w-64 h-64 bg-pink-500 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-0 right-0 w-64 h-64 bg-violet-500 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ animationDuration: "3.5s" }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ animationDuration: "2.5s" }}
        ></div>

        {/* Floating Neon Geometric Shapes */}
        <div
          className="absolute top-1/4 left-1/4 w-40 h-40 border-2 border-pink-500 rotate-45 animate-pulse opacity-30 shadow-[0_0_20px_rgba(236,72,153,0.5)]"
          style={{ animationDuration: "2s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-32 h-32 border-2 border-cyan-400 rotate-12 animate-pulse opacity-30 shadow-[0_0_15px_rgba(56,189,248,0.5)]"
          style={{ animationDuration: "2.8s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-violet-500 opacity-15 animate-spin shadow-[0_0_25px_rgba(139,92,246,0.3)]"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute top-1/6 right-1/5 w-28 h-28 border-2 border-cyan-400 rotate-6 animate-pulse opacity-25 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
          style={{ animationDuration: "3.2s" }}
        ></div>
        <div
          className="absolute bottom-1/5 left-1/4 w-36 h-36 border-2 border-pink-500 rotate-30 animate-pulse opacity-25 shadow-[0_0_18px_rgba(236,72,153,0.4)]"
          style={{ animationDuration: "2.3s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/2 w-24 h-24 border-2 border-yellow-400 rotate-90 animate-pulse opacity-20 shadow-[0_0_10px_rgba(250,204,21,0.4)]"
          style={{ animationDuration: "3.7s" }}
        ></div>
      </div>

      {/* Main Content */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-4 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        {/* Enhanced Main Title with 3D Neon Effect */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-4 tracking-wide font-['Orbitron',_monospace]">
          <span className="text-white drop-shadow-[0_0_20px_rgba(236,72,153,0.8)] shadow-[0_0_40px_rgba(139,92,246,0.6)]">
            Your Shopping Assistant
          </span>
        </h1>

        {/* Enhanced Subtitle */}
        <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-cyan-400 mb-6 tracking-wider drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
          For all your needs.
        </h2>

        {/* Enhanced Animated Mini Subtitle with Glow Effects */}
        <div className="h-8 mb-12 flex items-center">
          <p
            className="text-lg md:text-xl text-pink-400 font-medium animate-pulse drop-shadow-[0_0_15px_rgba(236,72,153,1)] transition-all duration-500 transform hover:scale-105"
            style={{
              textShadow: "0 0 10px rgba(236,72,153,0.8), 0 0 20px rgba(139,92,246,0.6), 0 0 30px rgba(236,72,153,0.4)",
              animationDuration: "2s",
            }}
          >
            {animatedPhrases[currentPhrase]}
          </p>
        </div>

        {/* Enhanced Icon Carousel */}
        <div className="w-full max-w-2xl mb-12">
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 25}%)` }}
            >
              {categories.map((category, index) => (
                <div key={index} className="flex-shrink-0 w-1/4 px-2">
                  <div className="flex flex-col items-center p-4 border-2 border-cyan-400 bg-black/30 backdrop-blur-sm hover:border-pink-500 transition-all duration-300 hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:bg-pink-500/10 group rounded-lg">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    <span className="text-sm text-white font-medium group-hover:text-pink-300 transition-colors duration-300">
                      {category.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-black/80 border-2 border-cyan-400 p-3 hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.7)] transition-all duration-300 rounded-lg backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-black/80 border-2 border-cyan-400 p-3 hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.7)] transition-all duration-300 rounded-lg backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Enhanced Slide Indicators */}
          <div className="flex justify-center mt-6 space-x-3">
            {Array.from({ length: categories.length - 3 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-4 h-4 border-2 transition-all duration-300 rounded-full ${
                  currentSlide === index
                    ? "bg-pink-500 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)] scale-125"
                    : "border-cyan-400 hover:border-pink-500 hover:shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Enhanced CTA Button with Rotating Gradient Border */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400 rounded-lg blur-sm opacity-75 animate-pulse"></div>
          <Button
            onClick={() => router.push("/user-info")}
            className="relative px-12 py-4 text-lg font-bold uppercase tracking-wider bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400 text-white border-2 border-transparent hover:shadow-[0_0_40px_rgba(236,72,153,0.8)] hover:scale-105 transition-all duration-300 rounded-lg backdrop-blur-sm font-['Orbitron',_monospace]"
            style={{
              background: "linear-gradient(45deg, rgba(236,72,153,0.9), rgba(139,92,246,0.9), rgba(56,189,248,0.9))",
              boxShadow: "0 0 30px rgba(236,72,153,0.6), inset 0 0 30px rgba(255,255,255,0.1)",
            }}
          >
            {ctaText}
          </Button>
        </div>
      </div>
    </div>
  )
}
