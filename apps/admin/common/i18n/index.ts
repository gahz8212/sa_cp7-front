import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import enTranslation from "@/public/locale/en-US.json"
import koTranslation from "@/public/locale/ko-KR.json"

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "ko-KR": { translation: koTranslation },
      "en-US": { translation: enTranslation },
    },
    lng: "ko-KR",
    fallbackLng: "ko-KR",
    initAsync: false,
    supportedLngs: ["ko-KR", "en-US"],
    // debug: process.env.NODE_ENV === "development",
    debug: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  })
  .then(() => console.log("i18n initialized"))

export default i18n
