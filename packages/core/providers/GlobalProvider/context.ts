import { createContext, useContext } from "react"
import { GlobalContextType } from "./types"

export const GlobalContext = createContext<GlobalContextType>({
  isBrowser: false,
  startPageTransition: () => {
    console.error("startPageTransition이 호출")
  },
})

export const useGlobalContext = () => {
  const context = useContext(GlobalContext)
  return context || null
}
