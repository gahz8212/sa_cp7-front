"use client"
import { ReactNode, Suspense } from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "@/common/i18n"
import { LanguageProvider, GlobalProvider, QueryProvider, PopupProvider } from "@cp7/core"
import { Alert } from "@cp7/ui"
import { AuthProvider } from "@/components/providers/AuthProvider"

export default function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <QueryProvider>
        <LanguageProvider initLang="ko-KR">
          <I18nextProvider i18n={i18n}>
            <PopupProvider alertRenderer={(props) => <Alert {...props} />}>
              <GlobalProvider>
                <AuthProvider>{children}</AuthProvider>
              </GlobalProvider>
            </PopupProvider>
          </I18nextProvider>
        </LanguageProvider>
      </QueryProvider>
    </Suspense>
  )
}
