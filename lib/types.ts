export interface DrawResult {
  drwNo: number;
  drwNoDate: string;
  drwtNo1: number;
  drwtNo2: number;
  drwtNo3: number;
  drwtNo4: number;
  drwtNo5: number;
  drwtNo6: number;
  bnusNo: number;
  firstWinamnt: number;
  firstPrzwnerCo: number;
  returnValue: "success" | "fail";
}

export type PrizeRank = 1 | 2 | 3 | 4 | 5;

export interface PrizeRecord {
  drwNo: number;
  drwNoDate: string;
  rank: PrizeRank;
  matchCount: number;
  hasBonus: boolean;
}

export interface NumberSet {
  id: string;
  numbers: number[]; // sorted, 6 numbers
  label: string;
  createdAt: string;
  source: "manual" | "random" | "qr";
}

export type PrizeSummary = Partial<Record<PrizeRank, number>>;

export interface NumberSetAnalysis {
  set: NumberSet;
  records: PrizeRecord[];
  summary: PrizeSummary;
  // per-number stats: how many times each number appeared as a main or bonus winning number
  numberStats: Record<number, { main: number; bonus: number }>;
}
