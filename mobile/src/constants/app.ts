export const APP = {
  name: "Primal Champion",
  tagline: "Train. Eat. Recover. Dominate.",
  version: "1.0.0",
} as const;

export const GOALS = [
  ["fat_loss", "Fat Loss"], ["muscle_building", "Muscle Building"],
  ["endurance", "Endurance"], ["athletic_performance", "Athletic Performance"],
  ["general_fitness", "General Fitness"]
] as const;

export const EXERCISES = [
  ["pushup", "Pushups", 1], ["pullup", "Pullups", 5], ["chinup", "Chinups", 5],
  ["dip", "Dips", 3], ["squat", "Squats", 1], ["lunge", "Lunges", 1],
  ["burpee", "Burpees", 4], ["plank", "Plank", 10]
] as const;
