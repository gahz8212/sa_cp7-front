"use client"

import { useState, useRef } from "react"
import { Heading, Text, Divider, Link, RichEditor, type RichEditorHandle } from "@cp7/ui"

export default function EditorTestPage() {
  const [value, setValue] = useState("<p>안녕하세요. <strong>공지사항</strong>을 입력해보세요.</p>")
  const [limitValue, setLimitValue] = useState("")
  const [orphans, setOrphans] = useState<string[]>([])
  const editorRef = useRef<RichEditorHandle>(null)

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <Link href="/test" variant="muted">← 테스트 목록</Link>
      </div>
      <Heading level={1} className="mb-8">
        UI Kit — Organisms / RichEditor
      </Heading>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">기본 (getOrphanedImages 테스트)</h2>
        <RichEditor
          ref={editorRef}
          value={value}
          onChange={setValue}
          placeholder="공지사항 내용을 입력하세요"
          minHeight={300}
          onImageUpload={async (file) => {
            console.log("file:", file)
            return "https://naverpa-phinf.pstatic.net/MjAyNjA0MjBfMjc1/MDAxNzc2NjU1MTM3NTI0.2fxvHCgls86C4e73Yo5j3gxLxHosOwdSMwCTrdluxlcg.9b6L0wk6njh2iIsN_5NWs6mwYRkOnlTIR2quPIvUQT4g.JPEG/205_342x228_177665513750911399611240520950695.jpg"
          }}
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setOrphans(editorRef.current?.getOrphanedImages() ?? [])}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            저장 (getOrphanedImages 확인)
          </button>
        </div>
        {orphans.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="font-medium text-yellow-800 mb-1">삭제 필요 이미지 ({orphans.length}개)</p>
            {orphans.map((url) => (
              <p key={url} className="text-yellow-700 text-xs break-all">{url}</p>
            ))}
          </div>
        )}
        {orphans.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">저장 버튼 클릭 시 삭제 대상 이미지가 여기에 표시됩니다.</p>
        )}
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer">HTML 출력값 보기</summary>
          <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all">
            {value}
          </pre>
        </details>
      </section>

      <Divider />

      <section className="mb-12 mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">
          글자 수 제한 (maxLength=200)
        </h2>
        <RichEditor
          value={limitValue}
          onChange={setLimitValue}
          maxLength={200}
          minHeight={150}
          placeholder="최대 200자까지 입력 가능합니다"
        />
      </section>

      <Divider />

      <section className="mb-12 mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">
          최대 높이 + 스크롤 (maxHeight=200)
        </h2>
        <RichEditor
          value={value}
          onChange={setValue}
          minHeight={100}
          maxHeight={200}
          placeholder="내용이 길어지면 내부 스크롤이 생깁니다"
        />
      </section>

      <Divider />

      <section className="mb-12 mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-800 border-b pb-2">disabled</h2>
        <RichEditor value="<p>비활성화된 에디터입니다. 편집할 수 없습니다.</p>" disabled />
      </section>

      <section className="mb-8">
        <Text size="sm" className="text-gray-400">
          ←{" "}
          <a href="/test/select" className="underline">
            Select (/test/select)
          </a>
        </Text>
      </section>
    </main>
  )
}
