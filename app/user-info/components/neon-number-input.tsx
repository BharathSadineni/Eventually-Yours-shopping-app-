"use client"

import type React from "react"

interface NeonNumberInputProps {
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  placeholder?: string
  error?: boolean
}

export const NeonNumberInput: React.FC<NeonNumberInputProps> = ({ value, onChange, min, max, placeholder, error }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Allow only numbers and empty string
    if (newValue !== "" && !/^\d+$/.test(newValue)) {
      return
    }

    // Allow typing even if temporarily below min/max - validation happens on blur/submit
    onChange(newValue)
  }

  const handleBlur = () => {
    if (value === "") return

    const numValue = Number(value)
    if (min !== undefined && numValue < min) {
      onChange(min.toString())
    }
    if (max !== undefined && numValue > max) {
      onChange(max.toString())
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`bg-black/30 backdrop-blur-sm text-white transition-all duration-300 border-2 rounded-lg px-4 py-3 placeholder-gray-400 w-full
        ${
          error
            ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            : "border-cyan-400 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.7)]"
        }`}
    />
  )
}
