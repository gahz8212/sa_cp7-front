"use client"
// 구조 해석
import { Heading, Button, Text, cn } from "@cp7/ui"
import { useExcelStore } from "../../../common/store/useExcelStore"

function MappingTable({ matrix, title }: { matrix: string[][]; title: string }) {
  if (!matrix || matrix.length === 0) return null
  const colCount = matrix.length
  const rowCount = matrix[0].length
  const visited = Array.from({ length: rowCount }, () => Array(colCount).fill(false))

  return (
    <div className="mt-6 first:mt-0">
      <Text weight="bold" className="mb-2 block text-blue-800">
        {title}
      </Text>
      <div className="overflow-x-auto border-2 border-blue-200 rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {Array.from({ length: rowCount }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: colCount }).map((_, c) => {
                  if (visited[r][c]) return null
                  const value = matrix[c][r]

                  // Calculate rowSpan
                  let rowSpan = 1
                  if (value !== "") {
                    for (let j = r + 1; j < rowCount; j++) {
                      if (matrix[c][j] === "") {
                        rowSpan++
                        visited[j][c] = true
                      } else {
                        break
                      }
                    }
                  }

                  return (
                    <td
                      key={c}
                      rowSpan={rowSpan}
                      className={cn(
                        "border border-blue-100 p-2 text-center align-middle min-w-[80px]",
                        value === "" ? "bg-gray-50" : "bg-white font-medium",
                      )}
                    >
                      {value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function MappingResult() {
  const { mappingResult, setMappingResult } = useExcelStore()

  if (!mappingResult) return null

  return (
    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex justify-between items-center mb-6 border-b border-blue-200 pb-4">
        <Heading level={3} className="text-blue-900">
          구조 해석 결과
        </Heading>
        <Button variant="outline" size="sm" onClick={() => setMappingResult(null)}>
          결과 닫기
        </Button>
      </div>
      <div className="space-y-8">
        <MappingTable matrix={mappingResult.headersMatrix} title="📋 헤더 영역 (Headers)" />
        <MappingTable matrix={mappingResult.dataMatrix} title="📊 데이터 영역 (Data Samples)" />
        {mappingResult.etcMatrix.length > 0 && (
          <MappingTable matrix={mappingResult.etcMatrix} title="📎 기타 정보 (Etc Info)" />
        )}
      </div>
    </div>
  )
}
