'use client'

import { useRef, useState } from 'react'
import { usePrint, usePdfDownload } from '@cp7/core'
import { Button, Heading, Link, Text, Divider } from '@cp7/ui'

export default function PrintTestPage() {
  const printRef = useRef<HTMLDivElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { handlePrint } = usePrint({
    contentRef: printRef,
    documentTitle: '잔고증명서',
    pageStyle: '@page { size: A4; margin: 10mm; }',
  })

  const { handleDownload, isLoading } = usePdfDownload({
    contentRef: printRef,
    fileName: '잔고증명서',
    orientation: 'portrait',
  })

  const handlePdfDownload = async () => {
    setErrorMessage(null)
    try {
      await handleDownload()
    } catch {
      setErrorMessage('PDF 생성 중 오류가 발생했습니다.')
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <Link href="/test" variant="muted">← 테스트 목록</Link>
      </div>
      <Heading level={1} className="mb-2">
        Print / PDF Test
      </Heading>
      <Text size="sm" className="mb-8 text-gray-500">
        usePrint + usePdfDownload 훅 테스트
      </Text>

      <div className="mb-6 flex gap-3">
        <Button variant="primary" onClick={handlePrint}>
          프린트
        </Button>
        <Button variant="secondary" onClick={handlePdfDownload} disabled={isLoading}>
          {isLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </Button>
      </div>

      {errorMessage && (
        <Text size="sm" className="mb-4 text-red-500">
          {errorMessage}
        </Text>
      )}

      <div ref={printRef} className="space-y-4 rounded-lg border border-gray-200 bg-white p-8">
        <div className="text-center">
          <Heading level={2} className="mb-1">
            잔고증명서
          </Heading>
          <Text size="sm" className="text-gray-500">
            발급일: 2026.05.11
          </Text>
        </div>

        <Divider />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">성명</span>
            <span className="font-medium">홍길동</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">계좌번호</span>
            <span className="font-medium">123-456-789012</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">잔액</span>
            <span className="font-medium">1,000,000원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">기준일</span>
            <span className="font-medium">2026.05.11</span>
          </div>
        </div>

        <Divider />

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-3 py-2 text-left font-medium">날짜</th>
              <th className="border px-3 py-2 text-left font-medium">내용</th>
              <th className="border px-3 py-2 text-right font-medium">금액</th>
              <th className="border px-3 py-2 text-right font-medium">잔액</th>
            </tr>
          </thead>
          <tbody>
            {[
              { date: '2026.05.01', desc: '입금', amount: '+500,000', balance: '1,000,000' },
              { date: '2026.04.25', desc: '출금', amount: '-200,000', balance: '500,000' },
              { date: '2026.04.20', desc: '입금', amount: '+300,000', balance: '700,000' },
              { date: '2026.04.15', desc: '출금', amount: '-100,000', balance: '400,000' },
            ].map((row, i) => (
              <tr key={i}>
                <td className="border px-3 py-2">{row.date}</td>
                <td className="border px-3 py-2">{row.desc}</td>
                <td className="border px-3 py-2 text-right">{row.amount}</td>
                <td className="border px-3 py-2 text-right">{row.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Text size="sm" className="text-center text-gray-400">
          위 내용이 사실임을 증명합니다.
        </Text>
      </div>

      <div className="mt-6 space-y-1 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
        <p>• 프린트 버튼 → ref 영역만 인쇄 다이얼로그 표시</p>
        <p>• PDF 다운로드 → html-to-image 렌더링 후 잔고증명서.pdf 저장</p>
        <p>• PDF 생성 중 버튼 disabled (isLoading)</p>
        <p>• 에러 발생 시 버튼 아래 메시지 표시</p>
      </div>
    </main>
  )
}
