import { createContext, useContext } from "react"
import { AuthProviderTypes } from "./types"

export const AuthProviderContext = createContext<AuthProviderTypes>({
  authChecked: false,
  userInfo: null,
  userLocale: "ko-KR",
  setAccess: () => null,
})

export const useAuthProvider = () => useContext(AuthProviderContext)
