"use client";
import { useState } from "react";
import { NumberBall } from "./NumberBall";
import { generateRandomNumbers } from "@/lib/lotto";
import type { NumberSet } from "@/lib/types";

interface Props {
  onSave: (set: NumberSet) => void;
}

export function NumberPicker({ onSave }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [label, setLabel] = useState("");

  function toggleNumber(n: number) {
    setSelected((prev) =>
      prev.includes(n)
        ? prev.filter((x) => x !== n)
        : prev.length < 6
        ? [...prev, n].sort((a, b) => a - b)
        : prev
    );
  }

  function handleRandom() {
    setSelected(generateRandomNumbers());
  }

  function handleSave() {
    if (selected.length !== 6) return;
    const set: NumberSet = {
      id: crypto.randomUUID(),
      numbers: selected,
      label: label.trim() || `내 번호 ${new Date().toLocaleDateString("ko-KR")}`,
      createdAt: new Date().toISOString(),
      source: "manual",
    };
    onSave(set);
    setSelected([]);
    setLabel("");
  }

  return (
    <div className="bg-white rounded-2xl shadow p-5 space-y-4">
      <h2 className="font-bold text-lg text-gray-800">번호 선택</h2>

      {/* Selected preview */}
      <div className="flex flex-wrap gap-2 min-h-[44px] items-center bg-gray-50 rounded-xl px-3 py-2">
        {selected.length === 0 ? (
          <span className="text-gray-400 text-sm">번호를 선택하세요 (6개)</span>
        ) : (
          selected.map((n) => <NumberBall key={n} number={n} size="lg" />)
        )}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-9 gap-1.5">
        {Array.from({ length: 45 }, (_, i) => i + 1).map((n) => {
          const isSelected = selected.includes(n);
          return (
            <button
              key={n}
              onClick={() => toggleNumber(n)}
              className={`w-8 h-8 rounded-full text-xs font-semibold transition-all
                ${isSelected ? "ring-2 ring-blue-500 scale-110" : "hover:scale-105"}
                ${selected.length === 6 && !isSelected ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <NumberBall number={n} size="sm" highlight={isSelected} />
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-2 items-center flex-wrap">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="이름 (선택)"
          className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleRandom}
          className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-sm"
        >
          자동
        </button>
        <button
          onClick={handleSave}
          disabled={selected.length !== 6}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm"
        >
          저장
        </button>
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
