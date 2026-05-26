import { createContext, useContext } from "react"
import { LanguageContextType } from "./types"
import { LANG_TYPE } from "../../types/common"

export const LanguageContext = createContext<LanguageContextType>({
  userLocale: "ko-KR",
  setStoreUserLocale: (lang: LANG_TYPE) => {},
})

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  return context
}
