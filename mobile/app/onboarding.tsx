import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../src/lib/supabase";

const goals = [
  { label: "Fat Loss", value: "fat_loss" },
  { label: "Muscle Building", value: "muscle_building" },
  { label: "Endurance", value: "endurance" },
  { label: "Athletic Performance", value: "athletic_performance" },
  { label: "General Fitness", value: "general_fitness" },
] as const;

export default function Onboarding() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Missing information", "Please enter your name.");
      return;
    }

    const ageNumber = Number(age);
    const weightNumber = Number(weight);
    const heightNumber = Number(height);

    if (!age || !Number.isInteger(ageNumber) || ageNumber < 13 || ageNumber > 120) {
      Alert.alert("Invalid age", "Enter an age between 13 and 120.");
      return;
    }

    if (!weight || !Number.isFinite(weightNumber) || weightNumber <= 0) {
      Alert.alert("Invalid weight", "Enter a valid weight in kilograms.");
      return;
    }

    if (!height || !Number.isFinite(heightNumber) || heightNumber <= 0) {
      Alert.alert("Invalid height", "Enter a valid height in centimeters.");
      return;
    }

    if (!gender.trim()) {
      Alert.alert("Missing information", "Please enter your gender.");
      return;
    }

    if (!goal) {
      Alert.alert("Choose a goal", "Select your primary fitness goal.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        Alert.alert("Session expired", "Please sign in again.");
        router.replace("/sign-in");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name: name.trim(),
            age: ageNumber,
            weight_kg: weightNumber,
            height_cm: heightNumber,
            gender: gender.trim(),
            goal,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        throw error;
      }

      router.replace("/home");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save your profile.";

      Alert.alert("Profile update failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pt-16 pb-12"
    >
      <Text className="text-muted text-xs tracking-widest">
        YOUR JOURNEY
      </Text>

      <Text className="text-text text-4xl font-bold mt-2">
        Build Your Profile
      </Text>

      <Text className="text-muted mt-3">
        Tell us about yourself so we can personalize your Primal Champion
        experience.
      </Text>

      <View className="mt-8">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor="#8A8F98"
          className="bg-surface border border-border rounded-control px-5 py-4 text-text"
        />

        <TextInput
          value={age}
          onChangeText={setAge}
          placeholder="Age"
          placeholderTextColor="#8A8F98"
          keyboardType="number-pad"
          className="bg-surface border border-border rounded-control px-5 py-4 text-text mt-4"
        />

        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="Weight (kg)"
          placeholderTextColor="#8A8F98"
          keyboardType="decimal-pad"
          className="bg-surface border border-border rounded-control px-5 py-4 text-text mt-4"
        />

        <TextInput
          value={height}
          onChangeText={setHeight}
          placeholder="Height (cm)"
          placeholderTextColor="#8A8F98"
          keyboardType="decimal-pad"
          className="bg-surface border border-border rounded-control px-5 py-4 text-text mt-4"
        />

        <TextInput
          value={gender}
          onChangeText={setGender}
          placeholder="Gender"
          placeholderTextColor="#8A8F98"
          className="bg-surface border border-border rounded-control px-5 py-4 text-text mt-4"
        />

        <Text className="text-text text-lg font-bold mt-8 mb-4">
          Choose Your Goal
        </Text>

        <View className="gap-3">
          {goals.map((item) => {
            const selected = goal === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => setGoal(item.value)}
                className={`border rounded-control px-5 py-4 ${
                  selected
                    ? "bg-accent border-accent"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`font-bold ${
                    selected ? "text-white" : "text-text"
                  }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={saveProfile}
          disabled={loading}
          className={`rounded-control px-5 py-4 mt-8 ${
            loading ? "bg-muted" : "bg-accent"
          }`}
        >
          <Text className="text-white font-bold text-center">
            {loading ? "SAVING..." : "CONTINUE TO ARENA"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}