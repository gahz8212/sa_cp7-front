"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SessionTimerContext } from "./context"
import { usePopup } from "../PopupProvider/context"
import type { SessionTimerProviderProps } from "./types"

const DEFAULT_WARNING_BEFORE = 5 * 60 * 1000 // 5분
const TICK_INTERVAL = 1000 // 1초

const DEFAULT_TEXTS = {
  warningTitle: "세션 만료 예정",
  warningMessage: "세션이 곧 만료됩니다. 계속 사용하시겠습니까?",
  warningConfirm: "확인",
  warningCancel: "취소",
  expiredTitle: "세션 만료",
  expiredMessage: "세션이 만료되었습니다. 다시 로그인해주세요.",
  expiredConfirm: "확인",
}

export function SessionTimerProvider({
  children,
  sessionTimeout,
  warningBefore = DEFAULT_WARNING_BEFORE,
  onRefreshToken,
  onLogout,
  channelName = "auth",
  enabled = true,
  texts,
}: SessionTimerProviderProps) {
  const t = { ...DEFAULT_TEXTS, ...texts }
  const [remainingTime, setRemainingTime] = useState(sessionTimeout)

  // 마지막 활동 시각 (Date 기반으로 남은 시간 계산 — 초기화 시 setState 불필요)
  const lastActivityRef = useRef(0)
  // 경고/만료 팝업 중복 방지
  const isWarningShownRef = useRef(false)
  const isExpiredShownRef = useRef(false)

  // 최신 콜백 ref (stale closure 방지)
  const onRefreshTokenRef = useRef(onRefreshToken)
  const onLogoutRef = useRef(onLogout)
  useEffect(() => { onRefreshTokenRef.current = onRefreshToken }, [onRefreshToken])
  useEffect(() => { onLogoutRef.current = onLogout }, [onLogout])

  const { showErrorDoubleButton, showErrorSingleButton } = usePopup()

  // 타이머 리셋 (클릭·토큰 갱신·탭 동기화 시 호출)
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    isWarningShownRef.current = false
    isExpiredShownRef.current = false
    setRemainingTime(sessionTimeout)
  }, [sessionTimeout])

  // 만료 팝업
  const showExpiredPopup = useCallback(async () => {
    await showErrorSingleButton(t.expiredTitle, t.expiredMessage, t.expiredConfirm)
    onLogoutRef.current()
  }, [showErrorSingleButton, t.expiredTitle, t.expiredMessage, t.expiredConfirm])

  // 경고 팝업: 확인 → 토큰 갱신 + 리셋 / 취소 → 로그아웃
  const showWarningPopup = useCallback(async () => {
    const confirmed = await showErrorDoubleButton(
      t.warningTitle,
      t.warningMessage,
      t.warningConfirm,
      t.warningCancel,
    )
    if (confirmed) {
      try {
        await onRefreshTokenRef.current()
        resetTimer()
      } catch {
        onLogoutRef.current()
      }
    } else {
      onLogoutRef.current()
    }
  }, [showErrorDoubleButton, resetTimer, t.warningTitle, t.warningMessage, t.warningConfirm, t.warningCancel])

  // setInterval 콜백에서 최신 버전 참조하기 위한 ref
  const showExpiredPopupRef = useRef(showExpiredPopup)
  const showWarningPopupRef = useRef(showWarningPopup)
  useEffect(() => { showExpiredPopupRef.current = showExpiredPopup }, [showExpiredPopup])
  useEffect(() => { showWarningPopupRef.current = showWarningPopup }, [showWarningPopup])

  // 타이머 틱 + 클릭 리스너 (setInterval 콜백에서 팝업 트리거 — effect 본문에서 setState 없음)
  useEffect(() => {
    if (!enabled) return

    // 초기화: ref만 리셋 (setState 불필요)
    lastActivityRef.current = Date.now()
    isWarningShownRef.current = false
    isExpiredShownRef.current = false

    const handleClick = () => {
      if (isWarningShownRef.current || isExpiredShownRef.current) return
      lastActivityRef.current = Date.now()
    }

    document.addEventListener("click", handleClick)

    const tick = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = Math.max(sessionTimeout - elapsed, 0)

      setRemainingTime(remaining)

      if (remaining <= 0 && !isExpiredShownRef.current) {
        isExpiredShownRef.current = true
        showExpiredPopupRef.current()
      } else if (remaining <= warningBefore && !isWarningShownRef.current) {
        isWarningShownRef.current = true
        showWarningPopupRef.current()
      }
    }, TICK_INTERVAL)

    return () => {
      document.removeEventListener("click", handleClick)
      clearInterval(tick)
    }
  }, [enabled, sessionTimeout, warningBefore])

  // 다른 탭 동기화
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return

    const channel = new BroadcastChannel(channelName)
    channel.onmessage = (e: MessageEvent<{ type: string }>) => {
      if (e.data.type === "token_refreshed") resetTimer()
      if (e.data.type === "logout") onLogoutRef.current()
    }

    return () => channel.close()
  }, [enabled, channelName, resetTimer])

  const contextValue = useMemo(() => ({ remainingTime }), [remainingTime])

  return (
    <SessionTimerContext.Provider value={contextValue}>
      {children}
    </SessionTimerContext.Provider>
  )
}
