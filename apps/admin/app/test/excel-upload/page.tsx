"use client";

import { useState } from "react";
import { Heading, Button, Text } from "@cp7/ui";
import axios from "axios";

export default function ExcelUploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [data, setData] = useState<any>(null); // 받아온 데이터
  const [page, setPage] = useState(1); // 현재 페이지
  const [headers, setHeaders] = useState<string[] | null>(null); // 헤더 라벨들
  const [dataKey, setDataKey] = useState<string | null>(null); // 데이터 배열이 들어있는 키값

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileInfo({ name: selectedFile.name, size: selectedFile.size });
      // 파일이 새로 선택되면 데이터 및 헤더 초기화
      setData(null);
      setHeaders(null);
      setDataKey(null);
      setPage(1);
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
      console.log(`Page ${targetPage} response:`, response.data);
      
      if (response.data) {
        const list = response.data?.data?.dataList || response.data?.dataList;
        
        // 헤더 행이 포함되어 있다면 정보 추출 및 저장
        const headerRow = list?.find((item: any) => item.rowType === 'HEADER');
        if (headerRow) {
          const key = Object.keys(headerRow).find(k => Array.isArray(headerRow[k]));
          if (key) {
            setDataKey(key);
            setHeaders(headerRow[key]);
          }
        }

        setData(response.data);
        setPage(targetPage);
      }
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    if (!data) return;
    const list = data?.data?.dataList || data?.dataList;
    if (!list || !Array.isArray(list)) return;

    const newList = [...list];
    const targetRow = newList[rowIndex];
    newList[rowIndex] = { ...targetRow, [key]: value };

    if (data.data?.dataList) {
      setData({ ...data, data: { ...data.data, dataList: newList } });
    } else {
      setData({ ...data, dataList: newList });
    }
  };

  const renderTable = () => {
    const list = data?.data?.dataList || data?.dataList;
    const totalCount = data?.data?.totalCount || data?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / 20);

    if (!list || !Array.isArray(list) || list.length === 0) {
      return (
        <div className="mt-10 border-2 border-dashed p-10 text-center text-gray-400">
          파일을 업로드하면 여기에 데이터가 표시됩니다.
        </div>
      );
    }

    // 저장된 헤더와 키값이 없으면 그리지 않음
    if (!headers || !dataKey) return null;

    // 현재 목록에 HEADER가 없다면 가상의 HEADER 행을 생성하여 목록 맨 앞에 추가합니다.
    const hasHeader = list.some((item: any) => item.rowType === 'HEADER');
    const displayList = hasHeader 
      ? list 
      : [{ rowType: 'HEADER', [dataKey]: headers }, ...list];

    // HEADER와 DATA 행을 구분하여 렌더링
    const tableHeaders = headers;
    const dataRows = displayList.filter((item: any) => item.rowType === 'DATA');

    return (
      <div className="mt-6 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-800">
            <thead>
              <tr className="bg-[#FFFF00]">
                {tableHeaders.map((h, idx) => (
                  <th key={idx} className="border border-gray-800 p-3 text-sm font-bold text-black text-center min-w-[120px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIndex) => {
                const rowCells = row[dataKey] as string[];
                const originalIndex = list.findIndex(item => item === row);
                return (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {rowCells.map((cell, colIndex) => (
                      <td key={colIndex} className="border border-gray-800 p-2 text-sm text-center">
                        <input 
                          value={cell || ""} 
                          onChange={(e) => handleCellChange(originalIndex, dataKey, e.target.value)}
                          className="w-full text-center outline-none bg-transparent"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center items-center gap-4 p-4 bg-gray-50 rounded border">
          <Button variant="secondary" disabled={page <= 1} onClick={() => handleUpload(page - 1)}>
            이전
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600">{page}</span>
            <span className="text-gray-400">/</span>
            <span>{totalPages || 1} 페이지</span>
            <span className="ml-2 text-xs text-gray-500">(총 {totalCount}건)</span>
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
        <Heading level={2}>엑셀 파일 업로드</Heading>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <div className="flex gap-2">
          <Button onClick={() => handleUpload(1)} disabled={!file}>전송</Button>
          <Button variant="secondary" onClick={() => { setFile(null); setFileInfo(null); setData(null); setHeaders(null); }}>취소</Button>
        </div>
        {fileInfo && (
          <div className="bg-gray-100 p-4 rounded">
            <Text>파일명: {fileInfo.name}</Text>
            <Text>용량: {(fileInfo.size / 1024).toFixed(2)} KB</Text>
          </div>
        )}
      </div>
      <div className="w-2/3">
        <Heading level={2}>데이터 그리드</Heading>
        {renderTable()}
      </div>
    </main>
  );
}
