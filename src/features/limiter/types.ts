export interface LimiterSite {
  id: string;
  pattern: string;
  dailyBudgetMinutes: number;
  usedSeconds: number;
  /** YYYY-MM-DD, local date. usedSeconds resets to 0 the first time this stops matching today. */
  lastResetDate: string;
}

export interface LimiterSettings {
  sites: LimiterSite[];
}
