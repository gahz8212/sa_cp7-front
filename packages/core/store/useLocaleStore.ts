"use client"

import { create, StoreApi } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { LANG_TYPE } from "../types/common"

export interface LocaleStateTypes {
  userLocale: LANG_TYPE
  setStoreUserLocale: (lang: LANG_TYPE) => void
}

const devtoolsOptions = {
  name: "LocaleStore",
}

const persistOptions = {
  name: "locale-storage",
  partialize: (state: LocaleStateTypes) => ({
    userLocale: state.userLocale,
  }),
}

type SetState = StoreApi<LocaleStateTypes>["setState"]

const createSetStoreUserLocale = (set: SetState) => (lang: LANG_TYPE) => {
  set({ userLocale: lang })
}

export const useLocaleStore = create<LocaleStateTypes>()(
  devtools(
    persist(
      (set) => ({
        userLocale: (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as LANG_TYPE) || "ko-KR",
        setStoreUserLocale: createSetStoreUserLocale(set),
      }),
      { ...persistOptions },
    ),
    { ...devtoolsOptions },
  ),
)
