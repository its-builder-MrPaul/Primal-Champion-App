export type FitnessGoal =
  | "fat_loss" | "muscle_building" | "endurance"
  | "athletic_performance" | "general_fitness";

export type ActivityType =
  | "run" | "walk" | "pushup" | "pullup" | "chinup"
  | "dip" | "squat" | "lunge" | "burpee" | "plank";

export type Profile = {
  id: string; name: string; age: number | null; weight_kg: number | null;
  height_cm: number | null; gender: string | null; goal: FitnessGoal | null;
  avatar_url: string | null; level: number; xp: number; total_points: number;
  current_streak: number; longest_streak: number; champion_count: number;
};
