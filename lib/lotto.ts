import type { DrawResult, PrizeRank, PrizeRecord, NumberSetAnalysis, NumberSet, PrizeSummary } from "./types";

export function getDrawNumbers(draw: DrawResult): number[] {
  return [draw.drwtNo1, draw.drwtNo2, draw.drwtNo3, draw.drwtNo4, draw.drwtNo5, draw.drwtNo6];
}

export function calcPrize(
  myNumbers: number[],
  draw: DrawResult
): { rank: PrizeRank; matchCount: number; hasBonus: boolean } | null {
  const winning = new Set(getDrawNumbers(draw));
  const matchCount = myNumbers.filter((n) => winning.has(n)).length;
  const hasBonus = myNumbers.includes(draw.bnusNo);

  if (matchCount === 6) return { rank: 1, matchCount, hasBonus: false };
  if (matchCount === 5 && hasBonus) return { rank: 2, matchCount, hasBonus: true };
  if (matchCount === 5) return { rank: 3, matchCount, hasBonus: false };
  if (matchCount === 4) return { rank: 4, matchCount, hasBonus };
  if (matchCount === 3) return { rank: 5, matchCount, hasBonus };
  return null;
}

export function analyzeNumberSet(set: NumberSet, draws: DrawResult[]): NumberSetAnalysis {
  const records: PrizeRecord[] = [];
  const summary: PrizeSummary = {};
  // per-number: count how many times each number appeared as a main or bonus winning number
  const numberStats: Record<number, { main: number; bonus: number }> = {};
  for (const n of set.numbers) numberStats[n] = { main: 0, bonus: 0 };

  for (const draw of draws) {
    const result = calcPrize(set.numbers, draw);
    if (result) {
      records.push({ drwNo: draw.drwNo, drwNoDate: draw.drwNoDate, ...result });
      summary[result.rank] = (summary[result.rank] ?? 0) + 1;
    }

    // Count individual number appearances across ALL draws, regardless of full-set prize
    const winSet = new Set(getDrawNumbers(draw));
    for (const n of set.numbers) {
      if (winSet.has(n)) numberStats[n].main++;
      if (n === draw.bnusNo) numberStats[n].bonus++;
    }
  }

  records.sort((a, b) => b.drwNo - a.drwNo);
  return { set, records, summary, numberStats };
}

export function generateRandomNumbers(): number[] {
  const nums = new Set<number>();
  while (nums.size < 6) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return [...nums].sort((a, b) => a - b);
}

export const PRIZE_LABELS: Record<PrizeRank, string> = {
  1: "1등",
  2: "2등",
  3: "3등",
  4: "4등",
  5: "5등",
};

/** Parse 동행복권 QR code URL.
 * Format: https://m.dhlottery.co.kr/qr.do?method=winQr&v={drwNo}q{num1:02}{num2:02}...
 * One ticket may have up to 5 games (A–E), each 12 digits (6 numbers × 2 digits).
 */
export function parseQRContent(
  raw: string
): { drwNo: number; numberSets: number[][] } | null {
  try {
    // Accept full URL or just the v= value
    let vParam: string | null = null;
    if (raw.includes("?") || raw.startsWith("http")) {
      const url = new URL(raw.trim());
      vParam = url.searchParams.get("v");
    } else {
      vParam = raw.trim();
    }
    if (!vParam) return null;

    // Format: {drwNo}q{game1}q{game2}... each game = 6 numbers × 2 digits = 12 chars
    const parts = vParam.split("q");
    if (parts.length < 2) return null;

    const drwNo = parseInt(parts[0], 10);
    if (isNaN(drwNo)) return null;

    const numberSets: number[][] = [];
    for (let i = 1; i < parts.length; i++) {
      const gameStr = parts[i];
      if (gameStr.length !== 12) continue;
      const game: number[] = [];
      for (let j = 0; j < 12; j += 2) {
        const n = parseInt(gameStr.substring(j, j + 2), 10);
        if (isNaN(n) || n < 1 || n > 45) break;
        game.push(n);
      }
      if (game.length === 6) numberSets.push(game.sort((a, b) => a - b));
    }

    if (numberSets.length === 0) return null;
    return { drwNo, numberSets };
  } catch {
    return null;
  }
}
