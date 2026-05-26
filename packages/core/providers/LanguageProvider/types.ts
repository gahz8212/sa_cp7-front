import { LANG_TYPE } from "../../types/common"

export type LanguageContextType = {
  userLocale: LANG_TYPE
  setStoreUserLocale: (lang: LANG_TYPE) => void
}
