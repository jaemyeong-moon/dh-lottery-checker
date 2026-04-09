"use client";
import { useMemo, useState } from "react";
import type { DrawResult, NumberSet, PrizeRank } from "@/lib/types";
import { analyzeNumberSet, PRIZE_LABELS } from "@/lib/lotto";
import { NumberBall } from "./NumberBall";

interface Props {
  set: NumberSet;
  draws: DrawResult[];
  onDelete: (id: string) => void;
}

const RANK_BADGE: Record<PrizeRank, string> = {
  1: "bg-yellow-400 text-yellow-900",
  2: "bg-orange-400 text-white",
  3: "bg-blue-500 text-white",
  4: "bg-green-500 text-white",
  5: "bg-gray-400 text-white",
};

// RANK_BADGE is used for prize record rows and summary badges above

export function PrizeHistory({ set, draws, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showNumStats, setShowNumStats] = useState(false);

  const analysis = useMemo(() => analyzeNumberSet(set, draws), [set, draws]);

  const totalWins = Object.values(analysis.summary).reduce((s, c) => s + c, 0);

  return (
    <div className="bg-white rounded-2xl shadow p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-800">{set.label}</p>
          <p className="text-xs text-gray-400">
            {new Date(set.createdAt).toLocaleDateString("ko-KR")} · {set.source === "qr" ? "QR" : "수동"}
          </p>
        </div>
        <button onClick={() => onDelete(set.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">✕</button>
      </div>

      {/* Numbers */}
      <div className="flex flex-wrap gap-1.5">
        {set.numbers.map((n) => <NumberBall key={n} number={n} size="md" />)}
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-1.5">
        {draws.length === 0 ? (
          <span className="text-xs text-gray-400">추첨 데이터 로딩 중…</span>
        ) : totalWins === 0 ? (
          <span className="text-xs text-gray-400">{draws.length}회 조회 · 당첨 없음</span>
        ) : (
          <>
            <span className="text-xs text-gray-500 self-center">{draws.length}회 조회 ·</span>
            {(Object.entries(analysis.summary) as [string, number][])
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([rank, count]) => (
                <span
                  key={rank}
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${RANK_BADGE[Number(rank) as PrizeRank]}`}
                >
                  {PRIZE_LABELS[Number(rank) as PrizeRank]} {count}회
                </span>
              ))}
          </>
        )}
      </div>

      {/* Per-number stats toggle */}
      {draws.length > 0 && (
        <button
          onClick={() => setShowNumStats((v) => !v)}
          className="text-xs text-blue-500 hover:underline"
        >
          {showNumStats ? "▲ 번호별 통계 숨기기" : "▼ 번호별 당첨 통계"}
        </button>
      )}

      {showNumStats && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="py-1 pr-3 text-left">번호</th>
                <th className="py-1 px-2 text-center">당첨번호</th>
                <th className="py-1 px-2 text-center">보너스</th>
                <th className="py-1 px-2 text-center">합계</th>
              </tr>
            </thead>
            <tbody>
              {set.numbers.map((n) => {
                const stats = analysis.numberStats[n];
                const total = stats.main + stats.bonus;
                return (
                  <tr key={n} className="border-b last:border-0">
                    <td className="py-1 pr-3"><NumberBall number={n} size="sm" /></td>
                    <td className="py-1 px-2 text-center font-semibold text-blue-600">{stats.main}</td>
                    <td className="py-1 px-2 text-center font-semibold text-orange-500">{stats.bonus}</td>
                    <td className="py-1 px-2 text-center font-semibold text-gray-700">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Records list */}
      {analysis.records.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-blue-500 hover:underline"
          >
            {expanded ? `▲ 당첨이력 숨기기` : `▼ 당첨이력 ${analysis.records.length}건 보기`}
          </button>
          {expanded && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {analysis.records.map((rec) => (
                <div key={rec.drwNo} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${RANK_BADGE[rec.rank]}`}>
                    {PRIZE_LABELS[rec.rank]}
                  </span>
                  <span className="text-gray-600">{rec.drwNo}회</span>
                  <span className="text-gray-400 text-xs">{rec.drwNoDate}</span>
                  <span className="text-gray-500 text-xs ml-auto">{rec.matchCount}개 일치{rec.hasBonus ? " + 보너스" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
