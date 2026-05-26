import { UserInfoTypes } from "@/common/store/useUserStore"
import { LANG_TYPE } from "@cp7/core"
import { Dispatch, SetStateAction } from "react"

export interface AuthProviderTypes {
  authChecked: boolean
  userInfo: UserInfoTypes
  userLocale: LANG_TYPE
  setAccess: Dispatch<SetStateAction<boolean>>
}
