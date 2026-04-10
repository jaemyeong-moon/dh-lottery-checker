"use client";
import { useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { parseQRContent } from "@/lib/lotto";
import { NumberBall } from "./NumberBall";
import type { NumberSet } from "@/lib/types";

interface Props {
  onSave: (sets: NumberSet[]) => void;
}

export function QRScanner({ onSave }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [scanning, setScanning] = useState(false);
  const [parsed, setParsed] = useState<{ drwNo: number; numberSets: number[][] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const handleQRContent = useCallback((content: string) => {
    const result = parseQRContent(content);
    if (result) {
      setParsed(result);
      setError(null);
      stopCamera();
    } else {
      setError("로또 QR코드를 인식하지 못했습니다.");
    }
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    setParsed(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        const v = videoRef.current;
        v.srcObject = stream;
        await new Promise<void>((resolve) => {
          v.oncanplay = () => resolve();
          // 이미 준비된 경우
          if (v.readyState >= v.HAVE_ENOUGH_DATA) resolve();
        });
        await v.play().catch(() => {});
      }
      setScanning(true);

      const scan = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          handleQRContent(code.data);
        } else {
          rafRef.current = requestAnimationFrame(scan);
        }
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch {
      setError("카메라 권한이 필요합니다.");
    }
  }, [handleQRContent]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      URL.revokeObjectURL(url);
      if (code?.data) handleQRContent(code.data);
      else setError("이미지에서 QR코드를 찾을 수 없습니다.");
    };
    img.src = url;
    if (fileRef.current) fileRef.current.value = "";
  }, [handleQRContent]);

  function handleManualSubmit() {
    if (manualInput.trim()) handleQRContent(manualInput.trim());
  }

  function handleSaveParsed() {
    if (!parsed) return;
    const sets: NumberSet[] = parsed.numberSets.map((numbers, i) => ({
      id: crypto.randomUUID(),
      numbers,
      label: `QR ${parsed.drwNo}회 게임${String.fromCharCode(65 + i)}`,
      createdAt: new Date().toISOString(),
      source: "qr" as const,
    }));
    onSave(sets);
    setParsed(null);
    setManualInput("");
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h2 className="font-bold text-lg text-gray-800">QR 스캔</h2>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={scanning ? stopCamera : startCamera}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${
            scanning
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {scanning ? "카메라 끄기" : "카메라로 스캔"}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm"
        >
          이미지 업로드
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      </div>

      <div className={`relative rounded-xl overflow-hidden bg-black aspect-video ${scanning ? "" : "hidden"}`}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
        <div className="absolute inset-0 border-4 border-dashed border-yellow-400 m-8 rounded-xl opacity-60 pointer-events-none" />
        <p className="absolute bottom-2 w-full text-center text-white text-xs">QR코드를 프레임 안에 맞춰주세요</p>
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Manual URL input */}
      <div className="flex gap-2">
        <input
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
          placeholder="QR URL 직접 입력 (예: https://m.dhlottery.co.kr/qr.do?...)"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button onClick={handleManualSubmit} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
          확인
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {parsed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-green-800">{parsed.drwNo}회 로또 ({parsed.numberSets.length}게임)</p>
          <div className="space-y-2">
            {parsed.numberSets.map((nums, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-xs text-gray-500 w-4">{String.fromCharCode(65 + i)}</span>
                {nums.map((n) => <NumberBall key={n} number={n} size="sm" />)}
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveParsed}
            className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
          >
            저장하고 당첨이력 조회
          </button>
        </div>
      )}
    </div>
  );
}
