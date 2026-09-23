import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  const actions = [["RUN","/run"],["WORKOUT","/workout"],["MEAL","/meal"],["RECOVER","/recovery"],["RANK","/leaderboard"],["PROFILE","/profile"]] as const;
  return <View className="flex-1 bg-background px-5 pt-16">
    <Text className="text-muted text-xs tracking-widest">TODAY</Text>
    <Text className="text-text text-4xl font-bold mt-2">Your Arena</Text>
    <View className="bg-surface border border-border rounded-card p-6 mt-8">
      <Text className="text-muted">DAILY SCORE</Text><Text className="text-text text-6xl font-bold mt-2">0</Text>
      <Text className="text-accent mt-2">🔥 0 day streak</Text>
    </View>
    <View className="flex-row flex-wrap gap-3 mt-6">{actions.map(([label,path]) =>
      <Link key={path} href={path} asChild><Pressable className="bg-surface border border-border rounded-control px-5 py-4"><Text className="text-text font-bold">{label}</Text></Pressable></Link>)}</View>
  </View>;
}
