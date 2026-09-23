export type ScoreFactors = {
  effort: number; intensity: number; consistency: number; recovery: number;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function activityScore(base: number, factors: ScoreFactors): number {
  const effort = clamp(factors.effort, 0.75, 1.50);
  const intensity = clamp(factors.intensity, 0.80, 1.40);
  const consistency = clamp(factors.consistency, 0.90, 1.25);
  const recovery = clamp(factors.recovery, 0.80, 1.15);
  return Math.max(0, Math.round(base * effort * intensity * consistency * recovery));
}

export function runBaseScore(distanceMeters: number): number {
  return Math.floor(Math.max(0, distanceMeters) / 10);
}

export function exerciseBaseScore(basePerUnit: number, units: number): number {
  return Math.floor(Math.max(0, units) * Math.max(0, basePerUnit));
}

export function sleepPoints(hours: number): number {
  if (hours < 5) return -50;
  if (hours < 6) return 0;
  if (hours < 7) return 20;
  if (hours < 8) return 50;
  if (hours <= 8) return 100;
  return 120;
}

export function hydrationPoints(litres: number): number {
  const safe = Math.max(0, litres);
  return Math.floor(safe * 20) + (safe >= 3 ? 50 : 0);
}

export function streakBonus(days: number): number {
  if (days >= 100) return 2000;
  if (days >= 30) return 500;
  if (days >= 7) return 100;
  if (days >= 3) return 50;
  return 0;
}
