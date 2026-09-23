import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/stores/auth";

export default function RootLayout() {
  const bootstrap = useAuth(s => s.bootstrap);
  useEffect(() => { void bootstrap(); }, [bootstrap]);
  return <><StatusBar style="light" /><Stack screenOptions={{ headerShown: false }} /></>;
}