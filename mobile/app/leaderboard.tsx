import { View, Text } from "react-native";

export default function Leaderboard() {
  return (
    <View className="flex-1 bg-background px-5 pt-16">
      <Text className="text-muted text-xs tracking-widest">COMPETITION</Text>
      <Text className="text-text text-4xl font-bold mt-2">Leaderboard</Text>

      <View className="bg-surface border border-border rounded-card p-6 mt-8">
        <Text className="text-text text-xl font-bold">Your Rank</Text>
        <Text className="text-muted mt-2">
          Compete with athletes and climb the rankings.
        </Text>
      </View>
    </View>
  );
}