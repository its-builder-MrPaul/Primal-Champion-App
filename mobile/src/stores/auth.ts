import { create } from "zustand";
import { supabase } from "@/lib/supabase";

type AuthState = {
  ready: boolean;
  userId: string | null;
  bootstrap: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => {
  // Keep the app auth state synchronized with Supabase without taking
  // navigation control away from individual screens.
  supabase.auth.onAuthStateChange((_event, session) => {
    set({ userId: session?.user.id ?? null, ready: true });
  });

  return {
    ready: false,
    userId: null,

    bootstrap: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("Unable to restore Supabase session:", error.message);
      }
      set({
        ready: true,
        userId: data.session?.user.id ?? null,
      });
    },

    signOut: async () => {
      await supabase.auth.signOut();
      set({ userId: null });
    },
  };
});
