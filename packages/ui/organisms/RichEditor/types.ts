export type RichEditorProps = {
  value?: string
  onChange?: (html: string) => void
  onImageUpload?: (file: File) => Promise<string>
  maxLength?: number
  minHeight?: number | string
  maxHeight?: number | string
  disabled?: boolean
  placeholder?: string
  className?: string
}

export type RichEditorHandle = {
  getOrphanedImages: () => string[]
}
