"use client"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { PopupContext } from "./context"
import { useTranslation } from "react-i18next"
import { PopupStateType, TostStateType, PopupProviderProps } from "./types"
import { usePopupStore } from "../../store/usePopupStore"

const btnPrimary =
  "inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none cursor-pointer"
const btnOutline =
  "inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none cursor-pointer"

export const PopupProvider = ({ children, alertRenderer }: PopupProviderProps) => {
  const { t } = useTranslation()
  const [popup, setPopup] = useState<PopupStateType | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [status, setStatus] = useState<boolean>(false)

  const [toast, setToast] = useState<TostStateType | null>(null)
  const [isShowToast, setIsShowToast] = useState<boolean>(false)

  const { isStoreOpen, storeTitle, storeMessage, storeVariant, closeStorePopup } = usePopupStore()

  // 팝업 닫기 — 확인(true) / 취소(false)
  const dimProceed = useCallback(() => {
    setStatus(true)
    setIsPopupOpen(false)
  }, [])

  const dimCancel = useCallback(() => {
    setStatus(false)
    setIsPopupOpen(false)
  }, [])

  const onClickProceed = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setStatus(true)
    setIsPopupOpen(false)
  }, [])

  const onClickCancel = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setStatus(false)
    setIsPopupOpen(false)
  }, [])

  const onCloseCallBack = () => {
    if (popup) {
      popup?.resolve(status)
    }
  }

  useEffect(() => {
    if (!isPopupOpen) {
      onCloseCallBack()
    }
  }, [isPopupOpen])

  useEffect(() => {
    if (!isShowToast && toast) {
      toast?.resolve(true)
    }
  }, [isShowToast])

  // ─── Error 계열 ───────────────────────────────────────────────────────────

  const showErrorOnlyText = (title: string, message: string, className?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({ title, message, variant: "Error", className, onDimClick: dimCancel, resolve })
      setIsPopupOpen(true)
    })
  }

  const showErrorSingleButton = (title: string, message: string, btnPrcd: string, className?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({
        title, message, variant: "Error", className,
        actions: <button className={btnPrimary} onClick={onClickProceed}>{btnPrcd}</button>,
        onDimClick: dimProceed,
        resolve,
      })
      setIsPopupOpen(true)
    })
  }

  const showErrorDoubleButton = (title: string, message: string, btnPrcd: string, btnCncl: string, className?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({
        title, message, variant: "Error", className,
        actions: (
          <>
            <button className={btnOutline} onClick={onClickCancel}>{btnCncl}</button>
            <button className={btnPrimary} onClick={onClickProceed}>{btnPrcd}</button>
          </>
        ),
        onDimClick: dimCancel,
        resolve,
      })
      setIsPopupOpen(true)
    })
  }

  // ─── Success 계열 ─────────────────────────────────────────────────────────

  const showSuccessOnlyText = (title: string, message: string, className?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({ title, message, variant: "success", className, onDimClick: dimCancel, resolve })
      setIsPopupOpen(true)
    })
  }

  const showSuccessSingleButton = (title: string, message: string, btnPrcd: string, className?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({
        title, message, variant: "success", className,
        actions: <button className={btnPrimary} onClick={onClickProceed}>{btnPrcd}</button>,
        onDimClick: dimProceed,
        resolve,
      })
      setIsPopupOpen(true)
    })
  }

  const showSuccessDoubleButton = (title: string, message: string, btnPrcd: string, btnCncl: string, className?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({
        title, message, variant: "success", className,
        actions: (
          <>
            <button className={btnOutline} onClick={onClickCancel}>{btnCncl}</button>
            <button className={btnPrimary} onClick={onClickProceed}>{btnPrcd}</button>
          </>
        ),
        onDimClick: dimCancel,
        resolve,
      })
      setIsPopupOpen(true)
    })
  }

  // ─── SuccessBg 계열 ───────────────────────────────────────────────────────

  const showSuccessBgOnlyText = (title: string, message: string, className?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({ title, message, variant: "successBg", className, onDimClick: dimCancel, resolve })
      setIsPopupOpen(true)
    })
  }

  const showSuccessBgSingleButton = (title: string, message: string, btnPrcd: string, className?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({
        title, message, variant: "successBg", className,
        actions: <button className={btnPrimary} onClick={onClickProceed}>{btnPrcd}</button>,
        onDimClick: dimProceed,
        resolve,
      })
      setIsPopupOpen(true)
    })
  }

  const showSuccessBgDoubleButton = (title: string, message: string, btnPrcd: string, btnCncl: string, className?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({
        title, message, variant: "successBg", className,
        actions: (
          <>
            <button className={btnOutline} onClick={onClickCancel}>{btnCncl}</button>
            <button className={btnPrimary} onClick={onClickProceed}>{btnPrcd}</button>
          </>
        ),
        onDimClick: dimCancel,
        resolve,
      })
      setIsPopupOpen(true)
    })
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  const showToast = (message: string, type?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setToast({ message, type: type || "info", resolve })
      setIsShowToast(true)
      setTimeout(() => setIsShowToast(false), 3000)
    })
  }

  const contextValue = useMemo(() => ({
    showErrorOnlyText,
    showErrorSingleButton,
    showErrorDoubleButton,
    showSuccessOnlyText,
    showSuccessSingleButton,
    showSuccessDoubleButton,
    showSuccessBgOnlyText,
    showSuccessBgSingleButton,
    showSuccessBgDoubleButton,
    showToast,
  }), [
    showErrorOnlyText,
    showErrorSingleButton,
    showErrorDoubleButton,
    showSuccessOnlyText,
    showSuccessSingleButton,
    showSuccessDoubleButton,
    showSuccessBgOnlyText,
    showSuccessBgSingleButton,
    showSuccessBgDoubleButton,
    showToast,
  ])

  return (
    <PopupContext.Provider value={contextValue}>
      {isPopupOpen && popup && alertRenderer({
        title: popup.title,
        message: popup.message,
        variant: popup.variant,
        className: popup.className,
        actions: popup.actions,
        onDimClick: popup.onDimClick,
      })}
      {isStoreOpen && alertRenderer({
        title: storeTitle,
        message: storeMessage,
        variant: storeVariant,
        actions: (
          <button className={btnPrimary} onClick={closeStorePopup}>
            {t("확인")}
          </button>
        ),
        onDimClick: closeStorePopup,
      })}
      {isShowToast && (
        // TODO :: toast 컴포넌트 적용 필요
        <></>
      )}
      {children}
    </PopupContext.Provider>
  )
}
