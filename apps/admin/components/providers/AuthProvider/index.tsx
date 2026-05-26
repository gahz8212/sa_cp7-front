"use client"

import { ReactNode, useCallback, useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AuthProviderContext } from "./context"
import { useUserStore } from "@/common/store/useUserStore"
import { useLocaleStore, usePopup, SessionTimerProvider } from "@cp7/core"
import { useTranslation } from "react-i18next"
import { refreshToken, logout } from "@/common/api/apiClient"

const SESSION_TIMEOUT = Number(process.env.NEXT_PUBLIC_SESSION_TIMEOUT) || 60 * 60 * 1000

// TODO :: AuthProvider 구현필요
export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [access, setAccess] = useState<boolean>(true)

  const [authChecked] = useState(false)

  const userInfo = useUserStore((state) => state.userInfo)
  const userLocale = useLocaleStore((state) => state.userLocale)

  const { showErrorSingleButton } = usePopup()

  // 접근권한 없는경우 처리
  const handleUnauthorizedAccess = useCallback(async () => {
    await showErrorSingleButton(
      "",
      t(
        "Access Denied. You do not have the required permissions for this page. Please contact your administrator.",
      ),
      t("Confirm"),
    )

    // TODO :: 대시보드 추가 이후 이동 페이지 결정 필요
    router.back()
  }, [showErrorSingleButton, t, router])

  // 화면 접근제어
  useEffect(() => {
    if (!access) {
      handleUnauthorizedAccess().then(() => setAccess(true))
    }
  }, [access, handleUnauthorizedAccess])

  const contextValue = useMemo(
    () => ({ authChecked, userInfo, userLocale, setAccess }),
    [authChecked, userInfo, userLocale, setAccess],
  )

  return (
    <AuthProviderContext.Provider value={contextValue}>
      <SessionTimerProvider
        sessionTimeout={SESSION_TIMEOUT}
        onRefreshToken={refreshToken}
        onLogout={logout}
        enabled={!!userInfo}
        texts={{
          warningTitle: t("세션 만료 예정"),
          warningMessage: t("세션이 곧 만료됩니다. 계속 사용하시겠습니까?"),
          warningConfirm: t("확인"),
          warningCancel: t("취소"),
          expiredTitle: t("세션 만료"),
          expiredMessage: t("세션이 만료되었습니다. 다시 로그인해주세요."),
          expiredConfirm: t("확인"),
        }}
      >
        {children}
      </SessionTimerProvider>
    </AuthProviderContext.Provider>
  )
}
