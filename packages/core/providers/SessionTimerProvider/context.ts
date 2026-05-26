import { createContext, useContext } from "react"
import type { SessionTimerContextValue } from "./types"

export const SessionTimerContext = createContext<SessionTimerContextValue>({
  remainingTime: 0,
})

export const useSessionTimer = (): SessionTimerContextValue => {
  return useContext(SessionTimerContext)
}
