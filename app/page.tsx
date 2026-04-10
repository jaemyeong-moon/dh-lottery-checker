"use client";
import { useState, useEffect, useCallback } from "react";
import { NumberPicker } from "@/components/NumberPicker";
import { QRScanner } from "@/components/QRScanner";
import { PrizeHistory } from "@/components/PrizeHistory";
import { RecentDraws } from "@/components/RecentDraws";
import { useDrawHistory } from "@/lib/useDrawHistory";
import { loadNumberSets, saveNumberSets, addNumberSet, removeNumberSet } from "@/lib/storage";
import type { NumberSet } from "@/lib/types";

type Tab = "pick" | "qr" | "my" | "draws";

export default function Home() {
  const { draws, loading, progress } = useDrawHistory();
  const [numberSets, setNumberSets] = useState<NumberSet[]>([]);
  const [tab, setTab] = useState<Tab>("pick");

  useEffect(() => {
    setNumberSets(loadNumberSets());
  }, []);

  const handleSave = useCallback((set: NumberSet) => {
    setNumberSets(addNumberSet(set));
    setTab("my");
  }, []);

  const handleSaveMany = useCallback((sets: NumberSet[]) => {
    let current = loadNumberSets();
    for (const s of sets) current = [s, ...current];
    saveNumberSets(current);
    setNumberSets(current);
    setTab("my");
  }, []);

  const handleDelete = useCallback((id: string) => {
    setNumberSets(removeNumberSet(id));
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "pick", label: "번호 선택" },
    { id: "qr", label: "QR 스캔" },
    { id: "my", label: `내 번호 (${numberSets.length})` },
    { id: "draws", label: "추첨 결과" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-16">
      {/* Header */}
      <header className="bg-blue-700 text-white px-4 py-5 shadow">
        <h1 className="text-2xl font-extrabold tracking-tight">🍀 동행복권 번호 분석기</h1>
        <p className="text-blue-200 text-sm mt-0.5">번호 생성 · QR 스캔 · 당첨이력 · 번호 통계</p>
        {loading && progress && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-blue-200 mb-1">
              <span>추첨 데이터 다운로드 중…</span>
              <span>{progress.fetched} / {progress.total}</span>
            </div>
            <div className="w-full bg-blue-900 rounded-full h-1.5">
              <div
                className="bg-yellow-400 h-1.5 rounded-full transition-all"
                style={{ width: `${(progress.fetched / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
        {loading && !progress && (
          <p className="mt-1 text-xs text-blue-300 animate-pulse">데이터 로딩 중…</p>
        )}
        {!loading && draws.length > 0 && (
          <p className="mt-1 text-xs text-blue-300">{draws.length}회 추첨 데이터 로드 완료</p>
        )}
      </header>

      {/* Tab bar */}
      <nav className="sticky top-0 z-10 bg-white shadow-sm flex border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors
              ${tab === t.id ? "text-blue-700 border-b-2 border-blue-700" : "text-gray-500 hover:text-gray-800"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        {tab === "pick" && (
          <NumberPicker onSave={handleSave} />
        )}

        {tab === "qr" && (
          <QRScanner onSave={handleSaveMany} draws={draws} />
        )}

        {tab === "my" && (
          <>
            {numberSets.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
                <p className="text-4xl mb-2">🎱</p>
                <p>저장된 번호가 없습니다.</p>
                <p className="text-sm mt-1">번호 선택 또는 QR 스캔으로 추가하세요.</p>
              </div>
            ) : (
              numberSets.map((set) => (
                <PrizeHistory
                  key={set.id}
                  set={set}
                  draws={draws}
                  onDelete={handleDelete}
                />
              ))
            )}
          </>
        )}

        {tab === "draws" && (
          <RecentDraws draws={draws} limit={30} />
        )}
      </div>
    </main>
  );
}
