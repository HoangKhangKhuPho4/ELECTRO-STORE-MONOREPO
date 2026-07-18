import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi.json";
import en from "./locales/en.json";

const STORAGE_KEY = "electro_lang";

const savedLang = localStorage.getItem(STORAGE_KEY);
const browserLang = navigator.language?.toLowerCase().startsWith("en") ? "en" : "vi";
const initialLang = savedLang === "en" || savedLang === "vi" ? savedLang : browserLang;

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: "vi",
  interpolation: { escapeValue: false },
});

document.documentElement.lang = initialLang;

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  document.documentElement.lang = lng;
});

export default i18n;
