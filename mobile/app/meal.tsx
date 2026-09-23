import { View, Text } from "react-native";

export default function Meal() {
  return (
    <View className="flex-1 bg-background px-5 pt-16">
      <Text className="text-muted text-xs tracking-widest">NUTRITION</Text>
      <Text className="text-text text-4xl font-bold mt-2">Meals</Text>

      <View className="bg-surface border border-border rounded-card p-6 mt-8">
        <Text className="text-text text-xl font-bold">Nutrition Tracking</Text>
        <Text className="text-muted mt-2">
          Log your meals and build your nutrition score.
        </Text>
      </View>
    </View>
  );
}