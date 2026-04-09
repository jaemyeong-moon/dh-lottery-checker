/**
 * dhlottery.co.kr 새 API 클라이언트 (2026년 리뉴얼 이후)
 *
 * 구 API (common.do?method=getLottoNumber) → WAF로 완전 차단됨
 * 신 API (/lt645/selectPstLt645InfoNew.do) → 올바른 헤더만 있으면 쿠키/브라우저 없이 작동
 */
import type { DrawResult } from "./types";

const BASE = "https://www.dhlottery.co.kr";

const COMMON_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: `${BASE}/lt645/result`,
  requestmenuuri: "/lt645/result",
  "X-Requested-With": "XMLHttpRequest",
  ajax: "true",
  Accept: "application/json, text/javascript, */*; q=0.01",
};

interface NewDrawItem {
  ltEpsd: number;
  tm1WnNo: number;
  tm2WnNo: number;
  tm3WnNo: number;
  tm4WnNo: number;
  tm5WnNo: number;
  tm6WnNo: number;
  bnsWnNo: number;
  ltRflYmd: string; // "YYYYMMDD"
  rnk1WnAmt: number;
  rnk1WnNope: number;
  rlvtEpsdSumNtslAmt: number;
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

/**
 * 특정 회차 주변 10개 회차를 반환합니다.
 * srchDir=center → [drwNo+4, ..., drwNo, ..., drwNo-5] (10개)
 */
export async function fetchDrawsAround(drwNo: number): Promise<DrawResult[]> {
  const url = `${BASE}/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=${drwNo}&_=${Date.now()}`;
  const res = await fetch(url, { headers: COMMON_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const list: NewDrawItem[] = json?.data?.list ?? [];
  return list.map(convertDraw);
}

/**
 * 단일 회차를 반환합니다.
 */
export async function fetchSingleDraw(drwNo: number): Promise<DrawResult | null> {
  const draws = await fetchDrawsAround(drwNo);
  return draws.find((d) => d.drwNo === drwNo) ?? null;
}

/**
 * 최신 회차 번호를 반환합니다.
 */
export async function fetchLatestDrwNo(): Promise<number> {
  const url = `${BASE}/selectMainInfo.do?_=${Date.now()}`;
  const res = await fetch(url, {
    headers: {
      ...COMMON_HEADERS,
      Referer: `${BASE}/`,
      requestmenuuri: "/",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const lt645: NewDrawItem[] = json?.data?.result?.pstLtEpstInfo?.lt645 ?? [];
  if (lt645.length === 0) throw new Error("no lt645 data");
  return Math.max(...lt645.map((d) => d.ltEpsd));
}
