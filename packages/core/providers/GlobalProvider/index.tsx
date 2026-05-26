"use client"

import { useState, ReactNode, useTransition } from "react"
import { GlobalContext } from "./context"
import { useLoadingStore } from "../../store/useLoadingStore"

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [isBrowser] = useState<boolean>(typeof window !== "undefined")

  const [isNavigating, startPageTransition] = useTransition()

  const isApiLoading = useLoadingStore((state) => state.loadingCount > 0)

  const isShowTotalLoading = isNavigating || isApiLoading

  return (
    <GlobalContext.Provider value={{ isBrowser, startPageTransition }}>
      {/* TODO :: LoadingMol 위치, isShowTotalLoading props 넘겨서 제어 */}
      {children}
    </GlobalContext.Provider>
  )
}
