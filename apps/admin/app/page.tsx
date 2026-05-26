"use client";
import { useState, useRef } from "react";
import { RichEditor, RichEditorHandle } from "@cp7/ui";
export default function Home() {
  const [content, setContent] = useState("<p>안녕하세요!<b>RichEditor</b>테스트 페이지입니다.</p>");
  const editorRef = useRef<RichEditorHandle>(null);
  const handleSave = () => {
    console.log("저장된 내용:", content);
    if (editorRef.current) {
      const orphanded = editorRef.current.getOrphanedImages();
      if (orphanded.length > 0) { console.log("고아 이미지 (정리 필요):", orphanded); }
    }
    alert("저장된 내용을 콘솔에서 확인하세요.");
    return (
      <>RichEditor</>
    );
  }
}