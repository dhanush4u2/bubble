import { useMemo } from "react";
import { BubbleItem } from "@/data/bubbleData";
import { TimeLog } from "@/hooks/useTimeLogs";

export interface LifeScore {
  total: number;         // 0–100
  balance: number;       // how evenly time is distributed vs plan
  consistency: number;   // how many days this week had logs
  productivity: number;  // productive + learning ratio
  coverage: number;      // actual vs expected overall
}

/**
 * Computes a Life Score (0–100) from bubble data and time logs.
 *
 * Factors:
 *  - Coverage (40%): actual / expected total hours
 *  - Balance (30%): how close each bubble's ratio is to 1.0
 *  - Consistency (20%): unique days with logs this week
 *  - Productivity (10%): productive + learning share of total
 */
export const useLifeScore = (
  bubbles: BubbleItem[],
  logs: TimeLog[],
): LifeScore => {
  return useMemo(() => {
    if (bubbles.length === 0) {
      return { total: 0, balance: 0, consistency: 0, productivity: 0, coverage: 0 };
    }

    const totalExpected = bubbles.reduce((s, b) => s + b.expectedWeeklyHours, 0);
    const totalActual = bubbles.reduce((s, b) => s + b.actualWeeklyHours, 0);

    // Coverage: how much of the plan is completed (capped at 100%)
    const coverage = totalExpected > 0
      ? Math.min(totalActual / totalExpected, 1) * 100
      : 0;

    // Balance: average closeness of each bubble's ratio to 1.0
    const ratios = bubbles
      .filter(b => b.expectedWeeklyHours > 0)
      .map(b => {
        const ratio = b.actualWeeklyHours / b.expectedWeeklyHours;
        // Score: 1.0 is perfect, penalty for over or under
        return Math.max(0, 1 - Math.abs(1 - ratio));
      });
    const balance = ratios.length > 0
      ? (ratios.reduce((s, r) => s + r, 0) / ratios.length) * 100
      : 0;

    // Consistency: unique days with at least one log (max 7)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const uniqueDays = new Set(
      logs
        .filter(l => {
          const d = new Date(l.date);
          return d >= weekStart;
        })
        .map(l => l.date),
    );
    const daysSoFar = Math.min(now.getDay() + 1, 7);
    const consistency = daysSoFar > 0
      ? Math.min(uniqueDays.size / daysSoFar, 1) * 100
      : 0;

    // Productivity: productive + learning share
    const productiveHours = bubbles
      .filter(b => b.category === 'productive' || b.category === 'learning')
      .reduce((s, b) => s + b.actualWeeklyHours, 0);
    const productivity = totalActual > 0
      ? Math.min(productiveHours / totalActual, 1) * 100
      : 0;

    // Weighted total
    const total = Math.round(
      coverage * 0.4 +
      balance * 0.3 +
      consistency * 0.2 +
      productivity * 0.1,
    );

    return {
      total: Math.min(total, 100),
      balance: Math.round(balance),
      consistency: Math.round(consistency),
      productivity: Math.round(productivity),
      coverage: Math.round(coverage),
    };
  }, [bubbles, logs]);
};
