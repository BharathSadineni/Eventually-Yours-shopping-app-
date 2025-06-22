"use client";

import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

type Language = "en" | "zh" | "es" | "hi" | "ar" | "bn" | "pt" | "ru" | "ja" | "de" | "te";

const languages = [
  { code: "en", label: "English" },
  { code: "zh", label: "Chinese" },
  { code: "es", label: "Spanish" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "bn", label: "Bengali" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "de", label: "German" },
  { code: "te", label: "Telugu" },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative inline-block text-left">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-black text-white border border-cyan-400 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        aria-label="Select Language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
