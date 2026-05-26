import { createContext, useContext } from "react"
import { PopupContextType } from "./types"

export const PopupContext = createContext<PopupContextType>({
  showErrorOnlyText: () => new Promise(() => false),
  showErrorSingleButton: () => new Promise(() => false),
  showErrorDoubleButton: () => new Promise(() => false),
  showSuccessOnlyText: () => new Promise(() => false),
  showSuccessSingleButton: () => new Promise(() => false),
  showSuccessDoubleButton: () => new Promise(() => false),
  showSuccessBgOnlyText: () => new Promise(() => false),
  showSuccessBgSingleButton: () => new Promise(() => false),
  showSuccessBgDoubleButton: () => new Promise(() => false),
  showToast: () => new Promise(() => false),
})

export const usePopup = () => {
  const context = useContext(PopupContext)
  if (!context) {
    throw new Error("usePopup은 PopupProvider 내부에서만 사용 가능합니다.")
  }
  return context
}
