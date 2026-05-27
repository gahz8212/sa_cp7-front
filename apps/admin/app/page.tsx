 "use client";

 import { useState, useRef } from "react";
import { RichEditor, type RichEditorHandle, Heading, Button, Divider, Text } from "@cp7/ui";
import { useUserStore } from "@/common/store/useUserStore";
import { useAuthProvider } from "@/components/providers/AuthProvider/context";
import { useSessionTimer } from "@cp7/core";

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function TimerStatus() {
  const { remainingTime } = useSessionTimer();
  const { userInfo } = useUserStore();

  if (!userInfo) return null;

  return (
    <div className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1.5 rounded-full text-xs font-mono shadow-lg fixed top-4 right-4 z-50">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      Session: {formatTime(remainingTime)}
    </div>
  );
}

export default function Home() {
   const [content, setContent] = useState("<p>안녕하세요! <b>RichEditor</b> 테스트 페이지입니다.</p>");
   const editorRef = useRef<RichEditorHandle>(null);

   // Auth 관련 훅
   const { userInfo, setStoreUserInfo, clearUserInfo } = useUserStore();
   const { setAccess } = useAuthProvider();

   const handleSave = () => {
     console.log("저장된 내용:", content);
     if (editorRef.current) {
       const orphaned = editorRef.current.getOrphanedImages();
       if (orphaned.length > 0) {
         console.log("고아 이미지 (정리 필요):", orphaned);
       }
     }
     alert("저장된 내용을 콘솔에서 확인하세요.");
   };

   const simulateLogin = () => {
     setStoreUserInfo({ aprvSttsCd: "DONE" });
   };

   return (
     <main className="p-8 max-w-4xl mx-auto space-y-10">
       <TimerStatus />
       {/* 1. Auth 테스트 섹션 */}
       <section className="space-y-4 p-6 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30">
         <Heading level={2} className="text-blue-700">🔐 Auth & Session Test</Heading>
         <div className="flex items-center gap-4">
           <div className="flex-1">
             <p className="text-sm font-medium">현재 로그인 상태:</p>
             <code className="text-xs bg-white px-2 py-1 rounded border">
               {userInfo ? JSON.stringify(userInfo) : "로그아웃됨"}
             </code>
           </div>
           <div className="flex gap-2">
             {!userInfo ? (
               <Button onClick={simulateLogin} variant="primary">로그인 시뮬레이션</Button>
             ) : (
               <Button onClick={clearUserInfo} variant="outline">로그아웃</Button>
             )}
             <Button onClick={() => setAccess(false)} variant="danger">접근 제한 테스트</Button>
           </div>
         </div>
         <p className="text-xs text-gray-500">
           * 로그인을 하면 상단 혹은 어딘가에 세션 타이머가 작동하는지 확인해보세요.<br/>
           * '접근 제한' 클릭 시 AuthProvider의 팝업과 뒤로가기 로직이 작동합니다.
         </p>
       </section>

       <Divider />

       {/* 2. 에디터 섹션 */}
       <section className="space-y-6">
         <Heading level={1}>RichEditor Demo</Heading>

         <div className="space-y-4">
           <RichEditor
             ref={editorRef}
             value={content}
             onChange={setContent}
             placeholder="내용을 입력해주세요..."
             minHeight={400}
           />

           <div className="flex justify-end">
             <Button onClick={handleSave}>
               저장하기
             </Button>
           </div>
         </div>

         <div className="mt-8 p-4 bg-gray-50 rounded-lg">
           <h2 className="text-sm font-semibold mb-2 text-gray-700">현재 HTML 결과:</h2>
           <pre className="text-xs break-all whitespace-pre-wrap bg-white p-3 border rounded text-gray-600">
             {content}
           </pre>
         </div>
       </section>
     </main>
   );
 }