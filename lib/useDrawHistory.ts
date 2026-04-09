"use client";
import { useState, useEffect, useCallback } from "react";
import type { DrawResult } from "./types";
import {
  loadDrawCache,
  saveDrawCache,
  getCachedLatestDrwNo,
  setCachedLatestDrwNo,
} from "./storage";


interface NewDrawItem {
  ltEpsd: number;
  tm1WnNo: number;
  tm2WnNo: number;
  tm3WnNo: number;
  tm4WnNo: number;
  tm5WnNo: number;
  tm6WnNo: number;
  bnsWnNo: number;
  ltRflYmd: string;
  rnk1WnAmt: number;
  rnk1WnNope: number;
}

function convertDraw(item: NewDrawItem): DrawResult {
  const d = item.ltRflYmd;
  return {
    drwNo: item.ltEpsd,
    drwNoDate: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
    drwtNo1: item.tm1WnNo,
    drwtNo2: item.tm2WnNo,
    drwtNo3: item.tm3WnNo,
    drwtNo4: item.tm4WnNo,
    drwtNo5: item.tm5WnNo,
    drwtNo6: item.tm6WnNo,
    bnusNo: item.bnsWnNo,
    firstWinamnt: item.rnk1WnAmt,
    firstPrzwnerCo: item.rnk1WnNope,
    returnValue: "success",
  };
}

/** 특정 회차를 중심으로 10회차를 가져옵니다 */
async function fetchDrawBatch(centerDrwNo: number): Promise<DrawResult[]> {
  try {
    const res = await fetch(`/api/lotto?center=${centerDrwNo}`);
    if (!res.ok) return [];
    const json = await res.json();
    const list: NewDrawItem[] = json?.data?.list ?? [];
    return list.map(convertDraw);
  } catch {
    return [];
  }
}

/** 최신 회차 번호를 가져옵니다 */
async function fetchLatestDrwNo(): Promise<number | null> {
  try {
    const res = await fetch(`/api/lotto/latest`);
    if (!res.ok) return null;
    const json = await res.json();
    const lt645: NewDrawItem[] = json?.data?.result?.pstLtEpstInfo?.lt645 ?? [];
    if (lt645.length === 0) return null;
    return Math.max(...lt645.map((d) => d.ltEpsd));
  } catch {
    return null;
  }
}

interface UseDrawHistoryResult {
  draws: DrawResult[];
  loading: boolean;
  progress: { fetched: number; total: number } | null;
  refresh: () => void;
}

export function useDrawHistory(): UseDrawHistoryResult {
  const [draws, setDraws] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ fetched: number; total: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setProgress(null);

    const cache = loadDrawCache();
    const latestDrwNo = await fetchLatestDrwNo();
    if (!latestDrwNo) {
      setDraws(Object.values(cache).sort((a, b) => b.drwNo - a.drwNo));
      setLoading(false);
      return;
    }

    setCachedLatestDrwNo(latestDrwNo);

    // 어떤 회차가 캐시에 없는지 확인
    const missingSet = new Set<number>();
    for (let i = 1; i <= latestDrwNo; i++) {
      if (!cache[i]) missingSet.add(i);
    }

    if (missingSet.size > 0) {
      // 중심 회차 계산: 신 API는 10회차씩 반환하므로 중심점(5, 15, 25...) 기준으로 배치
      const centers = new Set<number>();
      for (const n of missingSet) {
        // n이 속하는 10개 구간의 중심: 5, 15, 25, ...
        const center = Math.max(5, Math.round(n / 10) * 10 - 5);
        centers.add(center);
      }
      // 최신 회차도 포함 (마지막 구간이 딱 안 맞을 수 있음)
      if (missingSet.has(latestDrwNo)) centers.add(latestDrwNo);

      const centerList = Array.from(centers).sort((a, b) => a - b);
      const total = missingSet.size;
      let fetched = 0;

      // 5개씩 병렬 요청
      const PARALLEL = 5;
      for (let i = 0; i < centerList.length; i += PARALLEL) {
        const chunk = centerList.slice(i, i + PARALLEL);
        const results = await Promise.all(chunk.map(fetchDrawBatch));
        for (const batch of results) {
          for (const draw of batch) {
            if (!cache[draw.drwNo] && draw.drwNo >= 1 && draw.drwNo <= latestDrwNo) {
              cache[draw.drwNo] = draw;
              if (missingSet.has(draw.drwNo)) fetched++;
            }
          }
        }
        setProgress({ fetched: Math.min(fetched, total), total });
        saveDrawCache(cache);
      }
    }

    setDraws(Object.values(cache).sort((a, b) => b.drwNo - a.drwNo));
    setLoading(false);
    setProgress(null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { draws, loading, progress, refresh: load };
}
