import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function Welcome() {
  return <View className="flex-1 bg-background px-6 justify-center">
    <Text className="text-accent text-sm font-bold tracking-widest">PRIMAL CHAMPION</Text>
    <Text className="text-text text-5xl font-bold mt-3">Train. Eat.{ "\n" }Recover. Dominate.</Text>
    <Text className="text-muted text-base mt-5">Every disciplined action moves your score, level and rank.</Text>
    <Link href="/sign-in" asChild><Pressable className="bg-accent rounded-control h-14 justify-center items-center mt-10"><Text className="text-text font-bold">ENTER THE ARENA</Text></Pressable></Link>
  </View>;
}
