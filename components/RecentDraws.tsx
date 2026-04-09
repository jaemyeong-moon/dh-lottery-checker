"use client";
import { useState, useMemo } from "react";
import type { DrawResult } from "@/lib/types";
import { getDrawNumbers } from "@/lib/lotto";
import { NumberBall } from "./NumberBall";

interface Props {
  draws: DrawResult[];
  limit?: number;
}

export function RecentDraws({ draws, limit = 10 }: Props) {
  const recent = draws.slice(0, limit);
  const [showFreq, setShowFreq] = useState(false);

  const freqData = useMemo(() => {
    const counts: Record<number, { main: number; bonus: number }> = {};
    for (let i = 1; i <= 45; i++) counts[i] = { main: 0, bonus: 0 };
    for (const d of draws) {
      for (const n of getDrawNumbers(d)) counts[n].main++;
      counts[d.bnusNo].bonus++;
    }
    return Object.entries(counts)
      .map(([num, c]) => ({ num: Number(num), main: c.main, bonus: c.bonus, total: c.main + c.bonus }))
      .sort((a, b) => b.total - a.total || a.num - b.num);
  }, [draws]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-bold text-lg text-gray-800 mb-3">최근 추첨 결과</h2>
        {recent.length === 0 ? (
          <p className="text-gray-400 text-sm">로딩 중…</p>
        ) : (
          <div className="space-y-2">
            {recent.map((d) => (
              <div key={d.drwNo} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 w-16 shrink-0">{d.drwNo}회</span>
                <div className="flex gap-1 flex-wrap">
                  {[d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6].map((n) => (
                    <NumberBall key={n} number={n} size="sm" />
                  ))}
                  <span className="text-gray-400 text-xs self-center mx-1">+</span>
                  <NumberBall number={d.bnusNo} size="sm" bonus />
                </div>
                <span className="text-xs text-gray-400 ml-auto">{d.drwNoDate}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {draws.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg text-gray-800">번호 빈도 분석</h2>
            <button
              onClick={() => setShowFreq((v) => !v)}
              className="text-xs text-blue-500 hover:underline"
            >
              {showFreq ? "숨기기" : "보기"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">전체 {draws.length}회 추첨 기준 · 출현 횟수순 정렬</p>
          {showFreq && (
            <div className="grid grid-cols-5 gap-2">
              {freqData.map(({ num, main, bonus, total }) => (
                <div key={num} className="flex flex-col items-center gap-0.5">
                  <NumberBall number={num} size="sm" />
                  <span className="text-xs font-bold text-gray-700">{total}</span>
                  <span className="text-[10px] text-gray-400">
                    {main}<span className="text-orange-400">+{bonus}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {!showFreq && (
            <p className="text-xs text-gray-400 text-center py-2">
              번호 빈도 분석 보기 버튼을 눌러 확인하세요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
