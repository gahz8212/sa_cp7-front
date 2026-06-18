"use client"
// 업로드 파일 선택
import { useRef } from "react"
import { Heading, Button, Text } from "@cp7/ui"
import { useExcelStore } from "../../../common/store/useExcelStore"

export function UploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { file, fileInfo, isUploading, uploadProgress, setFile, handleUpload } = useExcelStore()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
  }

  return (
    <div className="w-1/5 border-r pr-6 flex flex-col gap-4">
      <Heading level={2}>엑셀 파일 업로드</Heading>
      <input ref={fileInputRef} type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      <div className="flex gap-2">
        <Button onClick={handleUpload} disabled={!file}>
          화면 출력
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setFile(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }}
        >
          취소
        </Button>
      </div>
      {fileInfo && (
        <div className="bg-gray-100 p-4 rounded flex flex-col gap-3">
          <div>
            <Text className="text-sm font-semibold">파일 정보</Text>
            <Text className="text-xs text-gray-500 truncate">{fileInfo.name}</Text>
            <Text className="text-xs text-gray-500">{(fileInfo.size / 1024).toFixed(2)} KB</Text>
          </div>

          {isUploading && (
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <Text className="text-xs font-medium text-blue-700">업로드 중...</Text>
                <Text className="text-xs font-medium text-blue-700">{uploadProgress}%</Text>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
