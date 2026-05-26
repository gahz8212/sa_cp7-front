"use client"

import { ReactNode, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLocaleStore } from "../../store/useLocaleStore"
import { LanguageContext } from "./context"
import { useGlobalContext } from "../GlobalProvider/context"
import { LANG_TYPE } from "../../types/common"

export const LanguageProvider = ({ children, initLang = "ko-KR" }: { children: ReactNode; initLang?: LANG_TYPE }) => {
  const { isBrowser } = useGlobalContext()
  const { i18n } = useTranslation()
  const userLocale = useLocaleStore((state) => state.userLocale)
  const setStoreUserLocale = useLocaleStore((state) => state.setStoreUserLocale)

  useEffect(() => {
    i18n.changeLanguage(userLocale).catch(() => {
      console.error("Failed to change language")
    })
  }, [i18n, userLocale])

  return <LanguageContext.Provider value={{ userLocale, setStoreUserLocale }}>{children}</LanguageContext.Provider>
}
