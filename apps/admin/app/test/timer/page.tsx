'use client'

import { useState } from 'react'
import { SessionTimerProvider, useSessionTimer } from '@cp7/core'
import { Button, Heading, Link, Text } from '@cp7/ui'

const SESSION_TIMEOUT = 60_000 // 1분
const WARNING_BEFORE = 30_000 // 30초

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function TimerStatus() {
  const { remainingTime } = useSessionTimer()
  const isWarning = remainingTime > 0 && remainingTime <= WARNING_BEFORE

  return (
    <div className="mt-6 rounded-lg border p-6 text-center">
      <Text size="sm" className="mb-2 text-gray-500">
        남은 세션 시간
      </Text>
      <p className={`text-5xl font-bold tabular-nums ${isWarning ? 'text-red-500' : 'text-gray-800'}`}>
        {formatTime(remainingTime)}
      </p>
      {isWarning && (
        <Text size="sm" className="mt-2 text-red-400">
          경고 구간 진입 (30초 이하)
        </Text>
      )}
    </div>
  )
}

export default function TimerTestPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleRefreshToken = async (): Promise<void> => {
    console.log('[TimerTest] onRefreshToken called — mock success')
  }

  const handleLogout = (): void => {
    console.log('[TimerTest] onLogout called')
    setIsLoggedIn(false)
  }

  return (
    <SessionTimerProvider
      sessionTimeout={SESSION_TIMEOUT}
      warningBefore={WARNING_BEFORE}
      onRefreshToken={handleRefreshToken}
      onLogout={handleLogout}
      enabled={isLoggedIn}
      channelName="auth-test"
    >
      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="mb-6">
          <Link href="/test" variant="muted">← 테스트 목록</Link>
        </div>
        <Heading level={1} className="mb-2">
          Session Timer Test
        </Heading>
        <Text size="sm" className="mb-8 text-gray-500">
          sessionTimeout: 1분 / warningBefore: 30초
        </Text>

        <div className="flex gap-3">
          <Button variant="primary" onClick={() => setIsLoggedIn(true)} disabled={isLoggedIn}>
            로그인 (타이머 시작)
          </Button>
          <Button variant="danger" onClick={handleLogout} disabled={!isLoggedIn}>
            로그아웃 (타이머 종료)
          </Button>
        </div>

        <TimerStatus />

        <div className="mt-6 space-y-1 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p>• 로그인 버튼 클릭 → 타이머 시작</p>
          <p>• 30초 경과 후 경고 팝업 표시</p>
          <p>• 팝업 확인 → mock refreshToken 호출 + 타이머 리셋</p>
          <p>• 팝업 취소 또는 1분 경과 → 로그아웃</p>
          <p>• 화면 클릭 시 타이머 리셋 (팝업 중 제외)</p>
        </div>
      </main>
    </SessionTimerProvider>
  )
}
