"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ExternalLink, ShoppingCart } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  currency: string
  image: string
  buyUrl: string
  category: string
  rating: number
  reasoning?: string
}

const loadingMessages = [
  "Analyzing your preferences...",
  "Searching through millions of products...",
  "Finding the perfect matches...",
  "Curating personalized recommendations...",
  "Almost ready with your results...",
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function ShoppingInput() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [userData, setUserData] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string>("")
  const [aiRecommendations, setAiRecommendations] = useState<Product[]>([])
  const [shoppingInput, setShoppingInput] = useState({
    occasion: "",
    brandsPreferred: "",
    shoppingInput: "",
    budgetMin: "",
    budgetMax: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 6 // Show more products per page

  useEffect(() => {
    const storedData = localStorage.getItem("userData")
    const storedSessionId = localStorage.getItem("sessionId")

    if (storedData) {
      setUserData(JSON.parse(storedData))
    }
    if (storedSessionId) {
      setSessionId(storedSessionId)
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setShoppingInput((prev) => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validate = () => {
    const newErrors: { [key: string]: string } = {}

    if (!shoppingInput.occasion) {
      newErrors.occasion = "Shopping occasion is required"
    }
    if (!shoppingInput.shoppingInput.trim()) {
      newErrors.shoppingInput = "Please describe what you're looking for"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const transformProduct = (p: any, index: number): Product => {
    return {
      id: p.id || `product-${index}`,
      name: p.name || p.title || "Unknown Product",
      price: typeof p.price === "number" ? p.price : Number.parseFloat(p.price) || 0,
      currency: p.currency || getCurrencySymbol(),
      image: p.image || p.image_url || "/placeholder.svg?height=300&width=300",
      buyUrl: p.buyUrl || p.url || "#",
      category: p.category || "General",
      rating: typeof p.rating === "number" ? p.rating : Number.parseFloat(p.rating) || 0,
      reasoning: p.reasoning || "",
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsLoading(true)
    setProducts([])
    setAiRecommendations([])

    let messageIndex = 0
    setLoadingMessage(loadingMessages[messageIndex])

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length
      setLoadingMessage(loadingMessages[messageIndex])
    }, 2000)

    try {
      const response = await fetch(`${API_URL}/api/shopping-recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          shopping_input: shoppingInput,
        }),
      })

      const result = await response.json()
      console.log("Full API Response:", result) // Debug log

      if (result.status === "success") {
        clearInterval(messageInterval)
        setIsLoading(false)

        // Process regular products
        const transformedProducts: Product[] = []
        if (result.products && Array.isArray(result.products)) {
          result.products.forEach((p: any, index: number) => {
            try {
              const transformedProduct = transformProduct(p, index)
              transformedProducts.push(transformedProduct)
            } catch (error) {
              console.error(`Error transforming product ${index}:`, error, p)
            }
          })
        }

        // Process AI recommendations
        const aiProducts: Product[] = []
        if (result.ai_recommendations) {
          try {
            let aiRecsData
            if (typeof result.ai_recommendations === "string") {
              aiRecsData = JSON.parse(result.ai_recommendations)
            } else {
              aiRecsData = result.ai_recommendations
            }

            if (Array.isArray(aiRecsData)) {
              aiRecsData.forEach((p: any, index: number) => {
                try {
                  const transformedProduct = transformProduct(p, index + 1000) // Offset IDs
                  aiProducts.push(transformedProduct)
                } catch (error) {
                  console.error(`Error transforming AI recommendation ${index}:`, error, p)
                }
              })
            }
          } catch (error) {
            console.error("Error parsing AI recommendations:", error)
          }
        }

        console.log("Transformed Products:", transformedProducts) // Debug log
        console.log("AI Products:", aiProducts) // Debug log

        setProducts(transformedProducts)
        setAiRecommendations(aiProducts)
        setCurrentPage(1)
      } else {
        throw new Error(result.message || "Failed to get recommendations")
      }
    } catch (error) {
      console.error("Error getting recommendations:", error)
      clearInterval(messageInterval)
      setIsLoading(false)
      alert("Failed to get product recommendations. Please try again.")
    }
  }

  const getCurrencySymbol = () => {
    return userData?.location
      ? userData.location === "United Kingdom"
        ? "£"
        : userData.location === "Japan"
          ? "¥"
          : "$"
      : "$"
  }

  // Combine all products and remove duplicates based on product name and price
  const allProducts = [...products, ...aiRecommendations].filter((product, index, self) => 
    index === self.findIndex(p => p.name === product.name && p.price === product.price)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative">
      {/* Enhanced Neon Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Corner Neon Glows */}
        <div
          className="absolute top-0 left-0 w-64 h-64 bg-pink-500 rounded-full opacity-40 blur-3xl animate-pulse"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-0 right-0 w-64 h-64 bg-violet-500 rounded-full opacity-40 blur-3xl animate-pulse"
          style={{ animationDuration: "3.5s" }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400 rounded-full opacity-40 blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400 rounded-full opacity-40 blur-3xl animate-pulse"
          style={{ animationDuration: "2.5s" }}
        ></div>

        {/* Floating Neon Shapes */}
        <div
          className="absolute top-1/3 left-1/4 w-32 h-32 border-2 border-pink-500 rotate-45 animate-pulse opacity-50 shadow-[0_0_15px_rgba(236,72,153,0.8)]"
          style={{ animationDuration: "2.2s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/3 w-28 h-28 border-2 border-cyan-400 rotate-12 animate-pulse opacity-50 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
          style={{ animationDuration: "2.8s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/4 w-20 h-20 border-2 border-violet-500 opacity-50 animate-spin shadow-[0_0_10px_rgba(139,92,246,0.7)]"
          style={{ animationDuration: "25s" }}
        ></div>
        <div
          className="absolute top-1/6 right-1/5 w-24 h-24 border-2 border-cyan-400 rotate-6 animate-pulse opacity-40 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
          style={{ animationDuration: "3.2s" }}
        ></div>
        <div
          className="absolute bottom-1/5 left-1/4 w-30 h-30 border-2 border-pink-500 rotate-30 animate-pulse opacity-40 shadow-[0_0_14px_rgba(236,72,153,0.7)]"
          style={{ animationDuration: "2.3s" }}
        ></div>
        <div
          className="absolute top-1/4 right-1/2 w-18 h-18 border-2 border-yellow-400 rotate-90 animate-pulse opacity-30 shadow-[0_0_8px_rgba(250,204,21,0.7)]"
          style={{ animationDuration: "3.7s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-white drop-shadow-[0_0_25px_rgba(236,72,153,0.8)] font-['Orbitron',_monospace]">
          Enter Your Shopping Input
        </h1>

        {userData && (
          <div className="mb-8 p-6 border-2 border-cyan-400 bg-black/30 backdrop-blur-sm rounded-lg shadow-[0_0_20px_rgba(56,189,248,0.3)]">
            <p className="text-cyan-400 text-center text-lg">
              Welcome! Shopping for:{" "}
              <span className="text-pink-400 font-semibold drop-shadow-[0_0_10px_rgba(236,72,153,0.6)]">
                {userData.categories?.join(", ") || "Various categories"}
              </span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 mb-12">
          <div className="space-y-6">
            {/* Shopping Occasion */}
            <div className="space-y-3">
              <Label className="text-white font-medium text-lg">
                Shopping Occasion <span className="text-pink-500">*</span>
              </Label>
              <Select value={shoppingInput.occasion} onValueChange={(value) => handleInputChange("occasion", value)}>
                <SelectTrigger
                  className={`bg-black/30 backdrop-blur-sm border-2 text-white transition-all duration-300 rounded-lg px-4 py-3 ${
                    errors.occasion
                      ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                      : "border-cyan-400 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.7)]"
                  }`}
                >
                  <SelectValue placeholder="Select an occasion" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-2 border-cyan-400 rounded-lg">
                  <SelectItem
                    value="birthday"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    Birthday Gift
                  </SelectItem>
                  <SelectItem
                    value="personal"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    Personal Use
                  </SelectItem>
                  <SelectItem
                    value="holiday"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    Holiday Gift
                  </SelectItem>
                  <SelectItem
                    value="anniversary"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    Anniversary
                  </SelectItem>
                  <SelectItem
                    value="upgrade"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    Upgrade/Replace
                  </SelectItem>
                  <SelectItem
                    value="new-hobby"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    New Hobby
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.occasion && (
                <p className="text-red-400 text-sm mt-2 font-semibold drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
                  {errors.occasion}
                </p>
              )}
            </div>

            {/* Brands Preferred */}
            <div className="space-y-3">
              <Label className="text-white font-medium text-lg">Brands Preferred</Label>
              <Input
                value={shoppingInput.brandsPreferred}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("brandsPreferred", e.target.value)
                }
                className="bg-black/30 backdrop-blur-sm text-white border-2 border-cyan-400 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.7)] transition-all duration-300 rounded-lg px-4 py-3 placeholder-gray-400"
                placeholder="Enter preferred brands (optional)"
              />
            </div>

            {/* Shopping Input */}
            <div className="space-y-3">
              <Label className="text-white font-medium text-lg">
                What are you looking for? <span className="text-pink-500">*</span>
              </Label>
              <p className="text-sm italic text-gray-400 mb-2">
                You can enter this in any language and the AI will help you find products.
              </p>
              <Textarea
                value={shoppingInput.shoppingInput}
                onChange={(e) => handleInputChange("shoppingInput", e.target.value)}
                className={`bg-black/30 backdrop-blur-sm text-white min-h-[200px] transition-all duration-300 border-2 rounded-lg px-4 py-3 placeholder-gray-400 resize-none ${
                  errors.shoppingInput
                    ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    : "border-cyan-400 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.7)]"
                }`}
                placeholder="Describe your shopping needs in detail..."
              />
              {errors.shoppingInput && (
                <p className="text-red-400 text-sm mt-2 font-semibold drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
                  {errors.shoppingInput}
                </p>
              )}
            </div>
          </div>

          {/* Enhanced Submit Button */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400 rounded-lg blur-sm opacity-75 animate-pulse"></div>
              <Button
                type="submit"
                disabled={isLoading}
                className="relative px-12 py-4 text-lg font-bold uppercase tracking-wider bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400 text-white border-2 border-transparent hover:shadow-[0_0_40px_rgba(236,72,153,0.8)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg backdrop-blur-sm font-['Orbitron',_monospace]"
                style={{
                  background:
                    "linear-gradient(45deg, rgba(236,72,153,0.9), rgba(139,92,246,0.9), rgba(56,189,248,0.9))",
                  boxShadow: "0 0 30px rgba(236,72,153,0.6), inset 0 0 30px rgba(255,255,255,0.1)",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finding products...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Enhanced Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block p-8 border-2 border-pink-500 bg-black/50 backdrop-blur-sm rounded-lg shadow-[0_0_30px_rgba(236,72,153,0.5)]">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <Loader2 className="relative w-16 h-16 text-white animate-spin mx-auto mb-4" />
              </div>
              <p className="text-xl text-white font-medium animate-pulse drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] font-['Orbitron',_monospace]">
                {loadingMessage}
              </p>
              <div className="mt-4 w-64 h-1 bg-gray-700 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 rounded-full animate-pulse"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Product Results */}
        {allProducts.length > 0 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.8)] font-['Orbitron',_monospace]">
                Recommended Products
              </h2>
              <p className="text-cyan-400 text-lg">Found {allProducts.length} products matching your preferences</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProducts.map((product, index) => (
                <ProductTile key={`${product.id}-${index}`} product={product} />
              ))}
            </div>
          </div>
        )}

        
      </div>
    </div>
  )
}

// Enhanced ProductTile component with neon styling
function ProductTile({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false)

  // Generate enhanced star rating display
  const rating = product.rating || 0
  const stars = Array(5)
    .fill(0)
    .map((_, index) => {
      const starValue = index + 1
      const fillPercentage = Math.min(Math.max((rating - index) * 100, 0), 100)

      return (
        <div key={index} className="relative w-5 h-5">
          <svg className="absolute w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.39 2.462a1 1 0 00-.364 1.118l1.287 3.974c.3.922-.755 1.688-1.54 1.118l-3.39-2.462a1 1 0 00-1.175 0l-3.39 2.462c-.784.57-1.838-.196-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.045 9.4c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
          </svg>
          <svg
            className="absolute w-5 h-5 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]"
            fill="currentColor"
            viewBox="0 0 20 20"
            style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.39 2.462a1 1 0 00-.364 1.118l1.287 3.974c.3.922-.755 1.688-1.54 1.118l-3.39-2.462a1 1 0 00-1.175 0l-3.39 2.462c-.784.57-1.838-.196-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.045 9.4c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
          </svg>
        </div>
      )
    })

  return (
    <div
      className="border-2 border-cyan-400 bg-black/30 backdrop-blur-sm p-6 hover:border-pink-500 hover:shadow-[0_0_25px_rgba(236,72,153,0.4)] transition-all duration-300 group rounded-lg flex flex-col relative overflow-hidden"
      tabIndex={0}
      aria-label={`Product: ${product.name}`}
    >
      {/* Subtle background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Image with enhanced styling */}
      <div className="aspect-square mb-4 overflow-hidden rounded-lg relative bg-gradient-to-br from-pink-500/10 to-cyan-400/10 border border-gray-700 group-hover:border-pink-400 transition-colors duration-300">
        <img
          src={product.image || "/placeholder.svg?height=300&width=300"}
          alt={product.name || "Product Image"}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 relative z-10"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=300&width=300"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="space-y-4 flex-grow flex flex-col relative z-10">
        {/* Product Name with enhanced styling */}
        <h3 className="text-lg font-semibold text-white group-hover:text-pink-300 transition-colors duration-300 line-clamp-2 min-h-[3.5rem] drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
          {product.name || "Product Name Unavailable"}
        </h3>

        <div className="flex items-center justify-between">
          {/* Enhanced Price Display */}
          <span className="text-2xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)] group-hover:text-cyan-300 transition-colors duration-300">
            {product.price > 0 ? `${product.currency}${product.price.toFixed(2)}` : "Price unavailable"}
          </span>

          {/* Enhanced Rating stars */}
          <div className="flex items-center space-x-1" aria-label={`Rating: ${product.rating || 0} out of 5 stars`}>
            {stars}
          </div>
        </div>

        {/* Enhanced Reasoning section */}
        {product.reasoning && (
          <div className="relative">
            <p
              className={`text-sm text-gray-300 leading-relaxed transition-all duration-300 ease-in-out ${
                expanded ? "line-clamp-none max-h-full" : "line-clamp-3 max-h-[4.5rem] relative overflow-hidden"
              }`}
              aria-expanded={expanded}
            >
              {product.reasoning}
              {!expanded && product.reasoning.length > 150 && (
                <span className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></span>
              )}
            </p>
            {product.reasoning.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-pink-400 font-semibold text-sm hover:text-pink-300 focus:outline-none transition-colors duration-200 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]"
                aria-label={expanded ? "See less reasoning" : "See more reasoning"}
              >
                {expanded ? "See less" : "See more"}
              </button>
            )}
          </div>
        )}

        {/* Enhanced Buy button */}
        <div className="relative mt-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-400 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
          <Button
            onClick={() => window.open(product.buyUrl, "_blank")}
            className="relative w-full bg-gradient-to-r from-pink-500 to-cyan-400 text-white border-2 border-transparent hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] transition-all duration-300 hover:scale-[1.02] font-medium backdrop-blur-sm"
            style={{
              background: "linear-gradient(45deg, rgba(236,72,153,0.8), rgba(56,189,248,0.8))",
              boxShadow: "0 0 15px rgba(236,72,153,0.4), inset 0 0 15px rgba(255,255,255,0.1)",
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  )
}