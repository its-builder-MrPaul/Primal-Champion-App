import { useState } from "react";
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../src/lib/supabase";

export default function SignIn() {
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const showMessage = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showMessage("Email required", "Please enter your email address.");
      return;
    }

    if (!password) {
      showMessage("Password required", "Please enter your password.");
      return;
    }

    if (password.length < 6) {
      showMessage(
        "Password too short",
        "Your password must contain at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      if (isCreateAccount) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (!data.user) {
          throw new Error("Account creation did not return a user.");
        }

        // If email confirmation is disabled, Supabase returns a session and
        // the user can immediately continue into onboarding.
        if (data.session) {
          router.replace("/onboarding");
          return;
        }

        showMessage(
          "Account created",
          "Your account was created. Please verify your email, then sign in."
        );
        setIsCreateAccount(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      // A successful password login must produce an authenticated session.
      // Use the returned user/session directly instead of waiting for the
      // Zustand bootstrap cycle.
      if (!data.session || !data.user) {
        showMessage(
          "Sign in incomplete",
          "Please verify your email before signing in."
        );
        return;
      }

      // A profile may not exist for an older account if the database trigger
      // was unavailable at account creation. In that case onboarding is the
      // correct next step. maybeSingle() also avoids treating a missing row
      // as an unexpected error.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, age, weight_kg, height_cm, gender, goal")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Profile lookup failed after sign in:", profileError.message);
        // Authentication itself succeeded. Let the user continue to the
        // profile setup instead of trapping them on the sign-in screen.
        router.replace("/onboarding");
        return;
      }

      const profileComplete = Boolean(
        profile &&
          profile.name?.trim() &&
          profile.age !== null &&
          profile.weight_kg !== null &&
          profile.height_cm !== null &&
          profile.gender?.trim() &&
          profile.goal !== null
      );

      router.replace(profileComplete ? "/home" : "/onboarding");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      showMessage(
        isCreateAccount ? "Unable to create account" : "Unable to sign in",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-5 pt-16">
      <Text className="text-muted text-xs tracking-widest">
        PRIMAL CHAMPION
      </Text>

      <Text className="text-text text-4xl font-bold mt-2">
        {isCreateAccount ? "Create Account" : "Sign In"}
      </Text>

      <Text className="text-muted mt-3">
        {isCreateAccount
          ? "Create your account and enter the arena."
          : "Enter the arena and continue your journey."}
      </Text>

      <View className="mt-8">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#8A8F98"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          className="bg-surface border border-border rounded-control px-5 py-4 text-text"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#8A8F98"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          className="bg-surface border border-border rounded-control px-5 py-4 text-text mt-4"
        />

        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          className={`rounded-control px-5 py-4 mt-6 ${
            loading ? "bg-muted" : "bg-accent"
          }`}
        >
          <Text className="text-white font-bold text-center">
            {loading
              ? "PLEASE WAIT..."
              : isCreateAccount
                ? "CREATE ACCOUNT"
                : "SIGN IN"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsCreateAccount((current) => !current)}
          disabled={loading}
          className="border border-border rounded-control px-5 py-4 mt-4"
        >
          <Text className="text-text text-center font-bold">
            {isCreateAccount
              ? "ALREADY HAVE AN ACCOUNT? SIGN IN"
              : "CREATE ACCOUNT"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}