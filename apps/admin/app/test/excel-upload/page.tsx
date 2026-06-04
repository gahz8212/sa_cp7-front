"use client";

import { useState } from "react";
import { Heading, Button, Text } from "@cp7/ui";
import axios from "axios";

export default function ExcelUploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [data, setData] = useState<any>(null); // 받아온 데이터
  const [page, setPage] = useState(1); // 현재 페이지

  // Selection States
  type SelectionMode = 'HEADER' | 'DATA' | null;
  const [mode, setMode] = useState<SelectionMode>(null);
  const [selectedHeaderRows, setSelectedHeaderRows] = useState<number[]>([]);
  const [selectedSampleRows, setSelectedSampleRows] = useState<number[]>([]);

  // Mapping Result State (Structured Data)
  const [mappingResult, setMappingResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileInfo({ name: selectedFile.name, size: selectedFile.size });
      setData(null);
      setPage(1);
      setSelectedHeaderRows([]);
      setSelectedSampleRows([]);
      setMode(null);
      setMappingResult(null);
    }
  };

  const handleUpload = async (targetPage = 1) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("rowNo", "0");
      formData.append("sheetNo", "0");
      formData.append("page", targetPage.toString());
      formData.append("size", "20");

      const response = await axios.post("/api/common/upload-excel", formData);

      if (response.data) {
        setData(response.data);
        setPage(targetPage);
        setMappingResult(null);
      }
    } catch (error: any) {
      console.error("Upload failed", error);
      alert(`업로드 실패: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRowClick = (rowIndex: number) => {
    if (mode === 'HEADER') {
      setSelectedHeaderRows(prev =>
        prev.includes(rowIndex) ? prev.filter(r => r !== rowIndex) : [...prev, rowIndex].sort((a, b) => a - b)
      );
    } else if (mode === 'DATA') {
      setSelectedSampleRows(prev =>
        prev.includes(rowIndex) ? prev.filter(r => r !== rowIndex) : [...prev, rowIndex].sort((a, b) => a - b)
      );
    }
  };

  const handleReset = () => {
    if (mode === 'HEADER') setSelectedHeaderRows([]);
    else if (mode === 'DATA') setSelectedSampleRows([]);
  };

  // Updated structure analysis logic
  const buildStructure = (rows: any[]) => {
    if (rows.length === 0) return [];
    const colCount = rows[0].length;
    const result = [];

    for (let col = 0; col < colCount; col++) {
      const colValues = rows.map(row => row[col] || "");
      const cleanValues = colValues.filter(val => val && String(val).trim() !== "");

      if (cleanValues.length === 1) {
        result.push(cleanValues[0]);
      } else if (cleanValues.length > 1) {
        result.push(cleanValues);
      } else {
        result.push(""); // Or handle empty columns as needed
      }
    }
    return result;
  };

  const handleConfirmMapping = () => {
    const list = data?.data?.dataList || data?.dataList || [];
    const headerRows = selectedHeaderRows.map(idx => rowToValues(list[idx]));
    const sampleRows = selectedSampleRows.map(idx => rowToValues(list[idx]));

    if (headerRows.length === 0 || sampleRows.length === 0) {
      alert("헤더 행과 데이터 행을 모두 선택해 주세요.");
      return;
    }

    // 동일한 병합 구조 해석 로직 (헤더와 데이터에 동일하게 적용)
    const buildStructure = (rows: any[]) => {
      if (rows.length === 0) return [];
      const colCount = rows[0].length;
      const result = [];
      for (let col = 0; col < colCount; col++) {
        const colValues = rows.map(row => row[col] || "");
        const cleanValues = colValues.filter(val => val && String(val).trim() !== "");

        if (cleanValues.length === 1) {
          result.push(cleanValues[0]);
        } else if (cleanValues.length > 1) {
          result.push(cleanValues);
        } else {
          result.push("");
        }
      }
      return result;
    };

    // 1. 헤더 구조 해석
    const flattenedHeaders = buildStructure(headerRows);

    // 2. 데이터 구조 해석 (선택된 데이터 행들을 전체를 하나의 구조 단위로 처리)
    const flattenedData = buildStructure(sampleRows);

    setMappingResult({
      flattenedHeaders,
      flattenedData
    });
    setMode(null);
  };

  const rowToValues = (row: any) => Object.values(row).find(v => Array.isArray(v)) as any[] || Object.values(row);

  const handleCellEdit = (rowIndex: number, colIndex: number, newValue: string) => {
    const list = [...(data?.data?.dataList || data?.dataList || [])];
    let row = list[rowIndex];

    // Update nested array structure if exists
    const key = Object.keys(row).find(k => Array.isArray(row[k]));
    if (key) {
      row = { ...row, [key]: [...row[key]] };
      row[key][colIndex] = newValue;
    } else {
      row = { ...row, [Object.keys(row)[colIndex]]: newValue };
    }
    list[rowIndex] = row;

    setData((prev: any) => ({
      ...prev,
      data: prev.data ? { ...prev.data, dataList: list } : undefined,
      dataList: prev.data ? undefined : list
    }));
  };

  const renderTable = () => {
    const list = data?.dataList || data?.data?.dataList;
    const totalCount = data?.totalCount || data?.data?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / 20);

    if (!list || !Array.isArray(list) || list.length === 0) {
      return (
        <div className="mt-10 border-2 border-dashed p-10 text-center text-gray-400">
          파일을 업로드하면 여기에 데이터가 표시됩니다.
        </div>
      );
    }

    return (
      <div className="mt-6 flex flex-col">
        {/* 헤더 선택기 */}
        <div className="flex gap-2 p-2 border rounded mb-4 justify-end items-center">
          <Button variant={mode === 'HEADER' ? 'primary' : 'secondary'} onClick={() => setMode('HEADER')}>헤더 선택</Button>
          <Button variant={mode === 'DATA' ? 'primary' : 'secondary'} onClick={() => setMode('DATA')}>데이터 선택</Button>
          <Button variant="secondary" onClick={handleReset}>선택 해제</Button>
          <div className="mx-2 border-l h-6" />
          <Button variant="primary" onClick={handleConfirmMapping}>선택 완료</Button>
        </div>

        {/* 데이터 뷰 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-800">
            <tbody>
              {list.map((row: any, rowIndex: number) => {
                const isHeader = selectedHeaderRows.includes(rowIndex);
                const isData = selectedSampleRows.includes(rowIndex);
                const rowValues = rowToValues(row);

                return (
                  <tr
                    key={rowIndex}
                    onClick={() => handleRowClick(rowIndex)}
                    className={`cursor-pointer ${isHeader ? 'bg-yellow-200' : isData ? 'bg-green-200' : 'hover:bg-gray-50'}`}
                  >
                    <td className="border-2 p-2 text-xs text-gray-400 bg-gray-50 w-12 text-center border-gray-800">
                      {row.rowIndex !== undefined ? row.rowIndex + 1 : rowIndex + 1}
                    </td>
                    {rowValues.map((cell, colIndex) => (
                      <td key={colIndex} className={`border-2 p-2 text-sm text-center  border-gray-800`}>
                        <input
                          className="w-full bg-transparent text-center outline-none"
                          value={String(cell)}
                          onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="mt-6 flex justify-center items-center gap-4 p-4 bg-gray-50 rounded border">
          <Button variant="secondary" disabled={page <= 1} onClick={() => handleUpload(page - 1)}>
            이전
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600">{page}</span>
            <span className="text-gray-400">/</span>
            <span>{totalPages || 1} 페이지</span>
          </div>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => handleUpload(page + 1)}>
            다음
          </Button>
        </div>
      </div>
    );
  };

  return (
    <main className="flex h-screen p-6 gap-6">
      <div className="w-1/3 border-r pr-6 flex flex-col gap-4">
        {/* 파일 선택기 */}
        <Heading level={2}>엑셀 파일 업로드</Heading>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <div className="flex gap-2">
          <Button onClick={() => handleUpload(1)} disabled={!file}>전송</Button>
          <Button variant="secondary" onClick={() => { setFile(null); setFileInfo(null); setData(null); }}>취소</Button>
        </div>
        {fileInfo && (
          <div className="bg-gray-100 p-4 rounded">
            <Text>파일명: {fileInfo.name}</Text>
            <Text>용량: {(fileInfo.size / 1024).toFixed(2)} KB</Text>
          </div>
        )}
      </div>
      <div className="w-2/3 overflow-auto">
        <Heading level={2}>데이터 그리드</Heading>
        {renderTable()}
        {/* 출력박스 */}
        {mappingResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <Heading level={3}>구조 해석 결과 (병합 구조 준비 완료)</Heading>
            <pre className="text-xs">{JSON.stringify(mappingResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </main>
  );
}