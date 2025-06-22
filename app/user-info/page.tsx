"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Download, Loader2 } from "lucide-react"
import { NeonNumberInput } from "./components/neon-number-input"

const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Japan",
  "Australia",
  "Brazil",
  "India",
  "China",
  "Mexico",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Austria",
  "Belgium",
  "Portugal",
  "Ireland",
  "New Zealand",
  "South Korea",
  "Singapore",
  "Thailand",
  "Malaysia",
  "Philippines",
  "Indonesia",
  "Vietnam",
  "South Africa",
  "Egypt",
  "Nigeria",
  "Kenya",
  "Morocco",
  "Argentina",
  "Chile",
  "Colombia",
  "Peru",
  "Venezuela",
  "Ecuador",
  "Uruguay",
  "Paraguay",
  "Bolivia",
  "Costa Rica",
  "Panama",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
]

const productCategories = [
  "Art & Decor",
  "Automotive & Accessories",
  "Baby & Maternity",
  "Bags & Accessories",
  "Beauty & Personal Care",
  "Books & Stationery",
  "Cleaning & Household Supplies",
  "DIY & Crafts",
  "Eco-Friendly Living",
  "Electronics",
  "Fashion & Apparel",
  "Footwear",
  "Gaming & Entertainment",
  "Garden & Outdoor",
  "Grocery & Gourmet Food",
  "Health & Wellness",
  "Home & Kitchen",
  "Jewelry & Watches",
  "Luxury & Designer Goods",
  "Music & Instruments",
  "Office & Work Essentials",
  "Pet Supplies",
  "Smart Home Devices",
  "Sports & Fitness",
  "Sustainable Products",
  "Tech Accessories",
  "Tools & Home Improvement",
  "Toys & Kids",
  "Travel & Luggage",
  "Vintage & Collectibles",
]

const currencyMap: { [key: string]: string } = {
  "United States": "$",
  Canada: "C$",
  "United Kingdom": "£",
  Germany: "€",
  France: "€",
  Japan: "¥",
  Australia: "A$",
  Brazil: "R$",
  India: "₹",
  China: "¥",
  Mexico: "$",
  Italy: "€",
  Spain: "€",
  Netherlands: "€",
  Sweden: "kr",
  Norway: "kr",
  Denmark: "kr",
  Finland: "€",
  Switzerland: "CHF",
  Austria: "€",
  Belgium: "€",
  Portugal: "€",
  Ireland: "€",
  "New Zealand": "NZ$",
  "South Korea": "₩",
  Singapore: "S$",
  Thailand: "฿",
  Malaysia: "RM",
  Philippines: "₱",
  Indonesia: "Rp",
  Vietnam: "₫",
  "South Africa": "R",
  Egypt: "E£",
  Nigeria: "₦",
  Kenya: "KSh",
  Morocco: "MAD",
  Argentina: "$",
  Chile: "$",
  Colombia: "$",
  Peru: "S/",
  Venezuela: "Bs",
  Ecuador: "$",
  Uruguay: "$",
  Paraguay: "₲",
  Bolivia: "Bs",
  "Costa Rica": "₡",
  Panama: "$",
  Guatemala: "Q",
  Honduras: "L",
  "El Salvador": "$",
  Nicaragua: "C$",
}

const loadingMessages = [
  "Crunching your preferences...",
  "Tailoring your shopping experience...",
  "Analyzing your style...",
  "Preparing personalized recommendations...",
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export default function UserInfo() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [formData, setFormData] = useState({
    location: "",
    age: "",
    gender: "",
    categories: [] as string[],
    interests: "",
    budgetMin: "",
    budgetMax: "",
  })

  const [showExportPopup, setShowExportPopup] = useState(false)
  const [popupAnimation, setPopupAnimation] = useState("")

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
    // Clear category error when user selects
    if (errors.categories) {
      setErrors((prev) => ({ ...prev, categories: "" }))
    }
  }

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validate = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.location) {
      newErrors.location = "Location is required"
    }
    if (!formData.age) {
      newErrors.age = "Age is required"
    } else {
      const ageNum = Number.parseInt(formData.age)
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        newErrors.age = "Age must be between 13 and 120"
      }
    }
    if (!formData.gender) {
      newErrors.gender = "Gender is required"
    }
    if (formData.categories.length === 0) {
      newErrors.categories = "Please select at least one category"
    }
    if (!formData.interests) {
      newErrors.interests = "Interests and hobbies are required"
    }

    const minBudget = Number.parseFloat(formData.budgetMin)
    const maxBudget = Number.parseFloat(formData.budgetMax)
    if (isNaN(minBudget) || minBudget <= 0) {
      newErrors.budgetMin = "Minimum budget must be greater than 0"
    }
    if (isNaN(maxBudget) || maxBudget <= 0) {
      newErrors.budgetMax = "Maximum budget must be greater than 0"
    }
    if (!newErrors.budgetMin && !newErrors.budgetMax && minBudget > maxBudget) {
      newErrors.budgetMin = "Minimum budget cannot be greater than maximum budget"
      newErrors.budgetMax = "Maximum budget cannot be less than minimum budget"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsLoading(true)

    let messageIndex = 0
    setLoadingMessage(loadingMessages[messageIndex])

    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length
      setLoadingMessage(loadingMessages[messageIndex])
    }, 1500)

    try {
      const response = await fetch(`${API_URL}/api/user-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.status === "success") {
        localStorage.setItem("sessionId", result.session_id)
        localStorage.setItem("userData", JSON.stringify(formData))

        clearInterval(messageInterval)
        setIsLoading(false)

        // Show the export popup instead of navigating immediately
        setPopupAnimation("animate-in")
        setShowExportPopup(true)
      } else {
        throw new Error(result.message || "Failed to store user information")
      }
    } catch (error) {
      console.error("Error submitting user info:", error)
      clearInterval(messageInterval)
      setIsLoading(false)
      alert("Failed to submit user information. Please try again.")
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          setFormData(data)
        } catch (error) {
          alert("Invalid file format")
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "user-preferences.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePopupExport = () => {
    const dataStr = JSON.stringify(formData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "user-preferences.json"
    link.click()
    URL.revokeObjectURL(url)

    // Show success message and close popup
    alert("User data exported successfully!")
    handleClosePopup()
  }

  const handleClosePopup = () => {
    setPopupAnimation("animate-out")
    setTimeout(() => {
      setShowExportPopup(false)
      setPopupAnimation("")
      router.push("/shopping-input")
    }, 300)
  }

  const handleContinueWithoutImport = () => {
    handleClosePopup()
  }

  const getCurrencySymbol = () => {
    return currencyMap[formData.location] || "$"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Loading Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-400 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <Loader2 className="relative w-20 h-20 text-white animate-spin mx-auto mb-6" />
          </div>
          <p className="text-2xl text-white font-medium animate-pulse drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] font-['Orbitron',_monospace]">
            {loadingMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-auto">
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-100px) scale(0.8);
          }
        }
      `}</style>
      {/* Enhanced Neon Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Corner Neon Glows */}
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

        {/* Floating Neon Shapes */}
        <div
          className="absolute top-1/4 right-1/4 w-32 h-32 border-2 border-cyan-400 rotate-45 animate-pulse opacity-25 shadow-[0_0_15px_rgba(56,189,248,0.5)]"
          style={{ animationDuration: "2.2s" }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/3 w-24 h-24 border-2 border-pink-500 rotate-12 animate-pulse opacity-25 shadow-[0_0_12px_rgba(236,72,153,0.5)]"
          style={{ animationDuration: "2.8s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-violet-500 opacity-15 animate-spin shadow-[0_0_20px_rgba(139,92,246,0.3)]"
          style={{ animationDuration: "30s" }}
        ></div>
        <div
          className="absolute top-1/6 left-1/5 w-28 h-28 border-2 border-pink-500 rotate-6 animate-pulse opacity-20 shadow-[0_0_14px_rgba(236,72,153,0.4)]"
          style={{ animationDuration: "3.1s" }}
        ></div>
        <div
          className="absolute bottom-1/5 right-1/4 w-36 h-36 border-2 border-cyan-400 rotate-30 animate-pulse opacity-20 shadow-[0_0_16px_rgba(56,189,248,0.4)]"
          style={{ animationDuration: "2.6s" }}
        ></div>
        <div
          className="absolute top-1/3 left-1/2 w-20 h-20 border-2 border-yellow-400 rotate-90 animate-pulse opacity-15 shadow-[0_0_10px_rgba(250,204,21,0.4)]"
          style={{ animationDuration: "3.4s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-white drop-shadow-[0_0_25px_rgba(236,72,153,0.8)] font-['Orbitron',_monospace]">
          Enter User Information
        </h1>

        {/* Enhanced Import/Export Buttons */}
        <div className="flex justify-center gap-6 mb-8">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-cyan-400/20 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.7)] transition-all duration-300 backdrop-blur-sm px-6 py-3"
          >
            <Upload className="w-5 h-5 mr-2" />
            Import Data
          </Button>
          <Button
            onClick={handleExport}
            className="bg-pink-500/20 border-2 border-pink-500 text-pink-500 hover:bg-pink-500/30 hover:shadow-[0_0_20px_rgba(236,72,153,0.7)] transition-all duration-300 backdrop-blur-sm px-6 py-3"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Data
          </Button>
          <input ref={fileInputRef} type="file" accept=".json,.csv" onChange={handleImport} className="hidden" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Location */}
            <div className="space-y-3">
              <Label className="text-white font-medium text-lg">
                Location <span className="text-pink-500">*</span>
              </Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger
                  className={`bg-black/30 backdrop-blur-sm border-2 text-white transition-all duration-300 rounded-lg px-4 py-3 ${
                    errors.location
                      ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                      : "border-cyan-400 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.7)]"
                  }`}
                >
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-2 border-cyan-400 rounded-lg">
                  {countries.map((country) => (
                    <SelectItem
                      key={country}
                      value={country}
                      className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white transition-colors duration-200"
                    >
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location && (
                <p className="text-red-400 text-sm mt-2 font-semibold drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
                  {errors.location}
                </p>
              )}
            </div>

            {/* Age */}
            <div className="space-y-3">
              <Label className="text-white font-medium text-lg">
                Age <span className="text-pink-500">*</span>
              </Label>
              <NeonNumberInput
                value={formData.age}
                onChange={(val) => handleInputChange("age", val)}
                min={13}
                max={120}
                placeholder="Enter your age"
                error={!!errors.age}
              />
              {errors.age && (
                <p className="text-red-400 text-sm mt-2 font-semibold drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
                  {errors.age}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-3">
              <Label className="text-white font-medium text-lg">
                Gender <span className="text-pink-500">*</span>
              </Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger
                  className={`bg-black/30 backdrop-blur-sm border-2 text-white transition-all duration-300 rounded-lg px-4 py-3 ${
                    errors.gender
                      ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                      : "border-cyan-400 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.7)]"
                  }`}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-sm border-2 border-cyan-400 rounded-lg">
                  <SelectItem
                    value="male"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    Male
                  </SelectItem>
                  <SelectItem
                    value="female"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    Female
                  </SelectItem>
                  <SelectItem
                    value="other"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    Other
                  </SelectItem>
                  <SelectItem
                    value="prefer-not-to-say"
                    className="text-white hover:bg-cyan-500/30 focus:bg-cyan-500/30 hover:text-white focus:text-white"
                  >
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-red-400 text-sm mt-2 font-semibold drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
                  {errors.gender}
                </p>
              )}
            </div>

            {/* Budget Range */}
            <div className="space-y-3">
              <Label className="text-white font-medium text-lg">
                Budget Range ({getCurrencySymbol()}) <span className="text-pink-500">*</span>
              </Label>
              <div className="flex gap-3">
                <div className="flex flex-col w-full">
                  <NeonNumberInput
                    value={formData.budgetMin}
                    onChange={(val) => handleInputChange("budgetMin", val)}
                    min={0}
                    placeholder="Min"
                    error={!!errors.budgetMin}
                  />
                  {errors.budgetMin && (
                    <p className="text-red-400 text-xs mt-1 font-semibold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                      {errors.budgetMin}
                    </p>
                  )}
                </div>
                <div className="flex flex-col w-full">
                  <NeonNumberInput
                    value={formData.budgetMax}
                    onChange={(val) => handleInputChange("budgetMax", val)}
                    min={0}
                    placeholder="Max"
                    error={!!errors.budgetMax}
                  />
                  {errors.budgetMax && (
                    <p className="text-red-400 text-xs mt-1 font-semibold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                      {errors.budgetMax}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Categories */}
          <div className="space-y-4">
            <Label className="text-white font-medium text-lg">
              Favourite Product Categories <span className="text-pink-500">*</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  className={`p-4 text-sm border-2 transition-all duration-300 rounded-lg backdrop-blur-sm font-medium ${
                    formData.categories.includes(category)
                      ? "bg-pink-500/30 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)] scale-105"
                      : "bg-black/30 border-cyan-400 text-cyan-400 hover:border-pink-500 hover:text-white hover:bg-pink-500/10 hover:shadow-[0_0_10px_rgba(236,72,153,0.4)]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {errors.categories && (
              <p className="text-red-400 text-sm mt-2 font-semibold drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
                {errors.categories}
              </p>
            )}
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <Label className="text-white font-medium text-lg">
              Interests and Hobbies <span className="text-pink-500">*</span>
            </Label>
            <Textarea
              value={formData.interests}
              onChange={(e) => handleInputChange("interests", e.target.value)}
              className={`bg-black/30 backdrop-blur-sm text-white min-h-[120px] transition-all duration-300 border-2 rounded-lg px-4 py-3 placeholder-gray-400 resize-none ${
                errors.interests
                  ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  : "border-cyan-400 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.7)]"
              }`}
              placeholder="Tell us about your interests, hobbies, and what you're passionate about..."
            />
            {errors.interests && (
              <p className="text-red-400 text-sm mt-2 font-semibold drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
                {errors.interests}
              </p>
            )}
          </div>

          {/* Enhanced Submit Button */}
          <div className="flex justify-center pt-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400 rounded-lg blur-sm opacity-75 animate-pulse"></div>
              <Button
                type="submit"
                className="relative px-12 py-4 text-lg font-bold uppercase tracking-wider bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400 text-white border-2 border-transparent hover:shadow-[0_0_40px_rgba(236,72,153,0.8)] hover:scale-105 transition-all duration-300 rounded-lg backdrop-blur-sm font-['Orbitron',_monospace]"
                style={{
                  background:
                    "linear-gradient(45deg, rgba(236,72,153,0.9), rgba(139,92,246,0.9), rgba(56,189,248,0.9))",
                  boxShadow: "0 0 30px rgba(236,72,153,0.6), inset 0 0 30px rgba(255,255,255,0.1)",
                }}
              >
                Continue to Shopping
              </Button>
            </div>
          </div>
        </form>

        {/* Export Popup Modal */}
        {showExportPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div
              className={`relative bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-cyan-400 rounded-2xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(56,189,248,0.8)] ${
                popupAnimation === "animate-in"
                  ? "animate-[slideDown_0.3s_ease-out_forwards]"
                  : popupAnimation === "animate-out"
                    ? "animate-[slideUp_0.3s_ease-in_forwards]"
                    : ""
              }`}
              style={{
                boxShadow: "0 0 50px rgba(56,189,248,0.8), inset 0 0 30px rgba(255,255,255,0.1)",
              }}
            >
              {/* Neon Background Effects */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute top-0 left-0 w-32 h-32 bg-pink-500 rounded-full opacity-20 blur-2xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-400 rounded-full opacity-20 blur-2xl animate-pulse"></div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClosePopup}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200 hover:bg-red-500/20 rounded-full border border-gray-600 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]"
              >
                <span className="text-lg font-bold">×</span>
              </button>

              <div className="relative z-10 text-center">
                <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] font-['Orbitron',_monospace]">
                  Export User Information
                </h2>

                <p className="text-gray-300 mb-6 leading-relaxed">
                  Save your preferences for future use! Export your user information to quickly fill out forms next
                  time.
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-400 rounded-lg blur-sm opacity-50"></div>
                    <Button
                      onClick={handlePopupExport}
                      className="relative w-full bg-gradient-to-r from-pink-500 to-cyan-400 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-[0_0_25px_rgba(236,72,153,0.8)] hover:scale-105 transition-all duration-300 border-2 border-transparent"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Export User Data
                    </Button>
                  </div>

                  <Button
                    onClick={handleClosePopup}
                    className="w-full bg-black/30 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 hover:text-white hover:shadow-[0_0_20px_rgba(56,189,248,0.6)] transition-all duration-300 py-3 px-6 rounded-lg backdrop-blur-sm"
                  >
                    Continue Without Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
