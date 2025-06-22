import en from "../locales/en.json";

const translations: Record<string, Record<string, string>> = {
  en,
};

// Simple cache to store translations
const translationCache: Record<string, string> = {};

// Function to call a free translation API (e.g., LibreTranslate) for dynamic translation
export async function fetchTranslation(text: string, targetLang: string): Promise<string> {
  if (targetLang === "en") return text;

  const cacheKey = text + "_" + targetLang;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: targetLang,
        format: "text",
      }),
    });
    const data = await response.json();
    if (data && data.translatedText) {
      translationCache[cacheKey] = data.translatedText;
      return data.translatedText;
    }
  } catch (error) {
    console.error("Translation API error:", error);
  }
  // Fallback to original text if translation fails
  return text;
}

// Translate function that returns a Promise<string> for async translation
export async function translate(language: string, key: string): Promise<string> {
  const langTranslations = translations[language];
  if (langTranslations && langTranslations[key]) {
    return langTranslations[key];
  }
  // If no static translation, fallback to dynamic translation
  const englishText = translations["en"][key] || key;
  if (language === "en") {
    return englishText;
  }
  return await fetchTranslation(englishText, language);
}
