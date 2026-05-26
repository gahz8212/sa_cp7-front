"use client"

import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table"
import { TableHeader } from "@tiptap/extension-table"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import CharacterCount from "@tiptap/extension-character-count"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import { cn } from "../../lib/utils"
import { Toolbar } from "./Toolbar"
import type { RichEditorProps, RichEditorHandle } from "./types"

export type { RichEditorHandle }

function extractImageUrls(editor: ReturnType<typeof useEditor>): Set<string> {
  const urls = new Set<string>()
  if (!editor) return urls
  editor.state.doc.descendants((node) => {
    if (node.type.name === "image" && node.attrs.src) {
      urls.add(node.attrs.src as string)
    }
  })
  return urls
}

export const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(function RichEditor({
  value,
  onChange,
  onImageUpload,
  maxLength,
  minHeight = 200,
  maxHeight,
  disabled = false,
  placeholder = "내용을 입력하세요",
  className,
}: RichEditorProps, ref: React.ForwardedRef<RichEditorHandle>) {
  // 에디터 내부에서 발생한 변경인지 추적 (외부 value 동기화 시 불필요한 setContent 방지)
  const isInternalChange = useRef(false)
  // 이 세션에서 추적할 이미지 URL (초기 value img src + 업로드된 URL)
  const trackedUrls = useRef<Set<string>>(new Set())
  // onChange를 ref로 관리 (useEditor 클로저 내에서 최신 함수 참조)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })
  // 디바운스 타이머
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedOnChange = useCallback((html: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      onChangeRef.current?.(html)
    }, 300)
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ inline: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      ...(maxLength !== undefined
        ? [CharacterCount.configure({ limit: maxLength })]
        : [CharacterCount]),
      Placeholder.configure({ placeholder }),
      Typography,
    ],
    content: value ?? "",
    editable: !disabled,
    onUpdate({ editor: e }) {
      isInternalChange.current = true
      debouncedOnChange(e.getHTML())
    },
  })

  // 에디터 마운트 시 초기 value의 img src를 trackedUrls에 등록
  useEffect(() => {
    if (!editor) return
    extractImageUrls(editor).forEach((url) => trackedUrls.current.add(url))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor === null])

  useImperativeHandle(ref, () => ({
    getOrphanedImages: () => {
      if (!editor) return []
      const currentUrls = extractImageUrls(editor)
      return Array.from(trackedUrls.current).filter((url) => !currentUrls.has(url))
    },
  }), [editor])

  // 외부에서 value 변경 시에만 에디터 동기화 (내부 변경은 건너뜀)
  useEffect(() => {
    if (!editor) return
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    if (value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, value])

  // disabled 상태 동기화
  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  const characterCount = editor?.storage.characterCount as
    | { characters: () => number }
    | undefined

  const charCount = characterCount?.characters() ?? 0

  const contentStyle: React.CSSProperties = {
    minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
    ...(maxHeight !== undefined
      ? {
          maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          overflowY: "auto",
        }
      : {}),
  }

  return (
    <div
      className={cn(
        "w-full rounded-md border border-gray-300 bg-white transition-colors",
        "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-0",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {editor && (
        <Toolbar
          editor={editor}
          onImageUpload={onImageUpload}
          onImageUploaded={(url) => trackedUrls.current.add(url)}
          disabled={disabled}
        />
      )}

      <div style={contentStyle} className="overflow-y-auto">
        <EditorContent
          editor={editor}
          className={cn(
            "rich-editor-content px-4 py-3 outline-none text-sm text-gray-900",
            "[&_.tiptap]:outline-none [&_.tiptap]:min-h-full",
            // 제목
            "[&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-3 [&_.tiptap_h1]:mt-4",
            "[&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mb-2 [&_.tiptap_h2]:mt-3",
            "[&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:mb-2 [&_.tiptap_h3]:mt-3",
            // 문단
            "[&_.tiptap_p]:mb-2 [&_.tiptap_p:last-child]:mb-0",
            // 목록
            "[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:mb-2",
            "[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:mb-2",
            "[&_.tiptap_li]:mb-1",
            // 인용문
            "[&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-gray-300 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:text-gray-600 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:my-2",
            // 코드
            "[&_.tiptap_code]:bg-gray-100 [&_.tiptap_code]:px-1 [&_.tiptap_code]:rounded [&_.tiptap_code]:text-sm [&_.tiptap_code]:font-mono",
            "[&_.tiptap_pre]:bg-gray-100 [&_.tiptap_pre]:p-3 [&_.tiptap_pre]:rounded [&_.tiptap_pre]:overflow-x-auto [&_.tiptap_pre]:mb-2",
            // 링크
            "[&_.tiptap_a]:text-blue-600 [&_.tiptap_a]:underline [&_.tiptap_a:hover]:text-blue-800",
            // 이미지
            "[&_.tiptap_img]:max-w-full [&_.tiptap_img]:h-auto [&_.tiptap_img]:rounded [&_.tiptap_img]:my-2",
            // 구분선
            "[&_.tiptap_hr]:border-gray-300 [&_.tiptap_hr]:my-4",
            // 테이블
            "[&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:my-2",
            "[&_.tiptap_th]:border [&_.tiptap_th]:border-gray-300 [&_.tiptap_th]:bg-gray-50 [&_.tiptap_th]:px-3 [&_.tiptap_th]:py-2 [&_.tiptap_th]:text-left [&_.tiptap_th]:font-semibold",
            "[&_.tiptap_td]:border [&_.tiptap_td]:border-gray-300 [&_.tiptap_td]:px-3 [&_.tiptap_td]:py-2",
            // placeholder
            "[&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-gray-400 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0",
          )}
        />
      </div>

      {maxLength !== undefined && (
        <div className="flex justify-end px-3 py-1.5 border-t border-gray-100 text-xs text-gray-400">
          <span className={charCount >= maxLength ? "text-red-500" : ""}>
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
})
