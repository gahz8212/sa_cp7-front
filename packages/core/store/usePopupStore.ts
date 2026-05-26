"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"

export type Variant = "Error" | "success" | "successBg"

export interface GlobalPopupState {
  isStoreOpen: boolean
  storeTitle: string
  storeMessage: string
  storeVariant: Variant
}

export interface GlobalPopupActions {
  showStorePopup: (title: string, message: string, variant?: Variant) => void
  closeStorePopup: () => void
}

const initialState: GlobalPopupState = {
  isStoreOpen: false,
  storeTitle: "",
  storeMessage: "",
  storeVariant: "Error",
}

const devToolsOptions = {
  name: "GlobalPopupStore",
}

export const usePopupStore = create<GlobalPopupState & GlobalPopupActions>()(
  devtools((set) => ({
      ...initialState,
      showStorePopup: (storeTitle, storeMessage, storeVariant = "Error") =>
        set({
          isStoreOpen: true,
          storeTitle,
          storeMessage,
          storeVariant,
        }),
      closeStorePopup: () => set({ ...initialState }),
    }),
    devToolsOptions,
  ),
)
