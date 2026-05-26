"use client"

import React, { useRef, useCallback } from "react"
import type { Editor } from "@tiptap/react"
import { cn } from "../../../lib/utils"

type ToolbarProps = {
  editor: Editor
  onImageUpload?: (file: File) => Promise<string>
  onImageUploaded?: (url: string) => void
  disabled?: boolean
}

type ToolbarButtonProps = {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

const ToolbarButton = ({ onClick, active, disabled, title, children }: ToolbarButtonProps) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => {
      e.preventDefault()
      onClick()
    }}
    className={cn(
      "inline-flex items-center justify-center w-8 h-8 rounded text-sm font-medium transition-colors",
      "hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none",
      active ? "bg-gray-200 text-gray-900" : "text-gray-600",
    )}
  >
    {children}
  </button>
)

const Divider = () => <div className="w-px h-5 bg-gray-200 mx-1" />

export function Toolbar({ editor, onImageUpload, onImageUploaded, disabled }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !onImageUpload) return
      try {
        const url = await onImageUpload(file)
        onImageUploaded?.(url)
        editor.chain().focus().setImage({ src: url }).run()
      } finally {
        e.target.value = ""
      }
    },
    [editor, onImageUpload, onImageUploaded],
  )

  const handleLinkInsert = useCallback(() => {
    const prev = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("링크 URL을 입력하세요", prev ?? "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const handleTableInsert = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
      {/* 텍스트 서식 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        disabled={disabled}
        title="굵게 (Ctrl+B)"
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        disabled={disabled}
        title="기울임 (Ctrl+I)"
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        disabled={disabled}
        title="밑줄 (Ctrl+U)"
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        disabled={disabled}
        title="취소선"
      >
        <span className="line-through">S</span>
      </ToolbarButton>

      <Divider />

      {/* 제목 */}
      {([1, 2, 3] as const).map((level) => (
        <ToolbarButton
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          active={editor.isActive("heading", { level })}
          disabled={disabled}
          title={`제목 ${level}`}
        >
          <span className="text-xs font-bold">H{level}</span>
        </ToolbarButton>
      ))}

      <Divider />

      {/* 목록 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        disabled={disabled}
        title="글머리 기호 목록"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <circle cx="2" cy="4" r="1.5" />
          <rect x="5" y="3" width="9" height="2" rx="1" />
          <circle cx="2" cy="8" r="1.5" />
          <rect x="5" y="7" width="9" height="2" rx="1" />
          <circle cx="2" cy="12" r="1.5" />
          <rect x="5" y="11" width="9" height="2" rx="1" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        disabled={disabled}
        title="번호 매기기 목록"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <text x="1" y="5" fontSize="5" fontWeight="bold">1.</text>
          <rect x="5" y="3" width="9" height="2" rx="1" />
          <text x="1" y="9" fontSize="5" fontWeight="bold">2.</text>
          <rect x="5" y="7" width="9" height="2" rx="1" />
          <text x="1" y="13" fontSize="5" fontWeight="bold">3.</text>
          <rect x="5" y="11" width="9" height="2" rx="1" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* 링크 */}
      <ToolbarButton
        onClick={handleLinkInsert}
        active={editor.isActive("link")}
        disabled={disabled}
        title="링크 삽입"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" />
          <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
        </svg>
      </ToolbarButton>

      {/* 이미지 */}
      {onImageUpload && (
        <>
          <ToolbarButton
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="이미지 삽입"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <rect x="1" y="2" width="14" height="12" rx="2" />
              <circle cx="5.5" cy="5.5" r="1.5" />
              <path d="M1 11l4-4 3 3 2-2 4 4" />
            </svg>
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </>
      )}

      {/* 테이블 */}
      <ToolbarButton
        onClick={handleTableInsert}
        active={editor.isActive("table")}
        disabled={disabled}
        title="테이블 삽입"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <rect x="1" y="1" width="14" height="14" rx="1" />
          <line x1="1" y1="5" x2="15" y2="5" />
          <line x1="1" y1="9" x2="15" y2="9" />
          <line x1="1" y1="13" x2="15" y2="13" />
          <line x1="5" y1="1" x2="5" y2="15" />
          <line x1="10" y1="1" x2="10" y2="15" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* 정렬 */}
      {(["left", "center", "right"] as const).map((align) => (
        <ToolbarButton
          key={align}
          onClick={() => editor.chain().focus().setTextAlign(align).run()}
          active={editor.isActive({ textAlign: align })}
          disabled={disabled}
          title={`${align === "left" ? "왼쪽" : align === "center" ? "가운데" : "오른쪽"} 정렬`}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            {align === "left" && (
              <>
                <rect x="1" y="2" width="14" height="2" rx="1" />
                <rect x="1" y="6" width="10" height="2" rx="1" />
                <rect x="1" y="10" width="14" height="2" rx="1" />
                <rect x="1" y="14" width="8" height="2" rx="1" />
              </>
            )}
            {align === "center" && (
              <>
                <rect x="1" y="2" width="14" height="2" rx="1" />
                <rect x="3" y="6" width="10" height="2" rx="1" />
                <rect x="1" y="10" width="14" height="2" rx="1" />
                <rect x="4" y="14" width="8" height="2" rx="1" />
              </>
            )}
            {align === "right" && (
              <>
                <rect x="1" y="2" width="14" height="2" rx="1" />
                <rect x="5" y="6" width="10" height="2" rx="1" />
                <rect x="1" y="10" width="14" height="2" rx="1" />
                <rect x="7" y="14" width="8" height="2" rx="1" />
              </>
            )}
          </svg>
        </ToolbarButton>
      ))}

      <Divider />

      {/* 형광펜 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        active={editor.isActive("highlight")}
        disabled={disabled}
        title="형광펜"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <rect x="2" y="10" width="12" height="4" rx="1" fill={editor.isActive("highlight") ? "#fef08a" : "#e5e7eb"} />
          <text x="8" y="8" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">A</text>
        </svg>
      </ToolbarButton>

      <Divider />

      {/* 인용문 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        disabled={disabled}
        title="인용문"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path d="M3 4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v2a3 3 0 0 1-3 3V7a1 1 0 0 1 1-1V4zm7 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v2a3 3 0 0 1-3 3V7a1 1 0 0 1 1-1V4z" />
        </svg>
      </ToolbarButton>

      {/* 구분선 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={disabled}
        title="구분선"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <rect x="1" y="7" width="14" height="2" rx="1" />
        </svg>
      </ToolbarButton>

      <Divider />

      {/* 실행 취소 / 다시 실행 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title="실행 취소 (Ctrl+Z)"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path d="M3 7H9a4 4 0 0 1 0 8H5" />
          <path d="M3 7L6 4M3 7l3 3" />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title="다시 실행 (Ctrl+Y)"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path d="M13 7H7a4 4 0 0 0 0 8h4" />
          <path d="M13 7l-3-3M13 7l-3 3" />
        </svg>
      </ToolbarButton>
    </div>
  )
}
