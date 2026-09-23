import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import { EXERCISES } from "@/constants/app";
import { exerciseBaseScore, activityScore } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";

export default function Workout() {
 const [reps,setReps]=useState<Record<string,string>>({});
 const save=async()=>{const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
   const {data:w}=await supabase.from("workouts").insert({user_id:user.id,type:"bodyweight"}).select().single();
   if(!w)return; for(const [key,,base] of EXERCISES){const n=Number(reps[key]||0);if(n>0)await supabase.from("exercise_logs").insert({workout_id:w.id,user_id:user.id,exercise:key,reps:n,score:activityScore(exerciseBaseScore(base,n),{effort:1,intensity:1,consistency:1,recovery:1})});}
 };
 return <ScrollView className="flex-1 bg-background px-5 pt-14"><Text className="text-text text-4xl font-bold">Workout</Text>{EXERCISES.map(([key,label])=><View key={key} className="bg-surface border border-border rounded-control p-4 mt-3 flex-row items-center justify-between"><Text className="text-text font-bold">{label}</Text><TextInput keyboardType="numeric" value={reps[key]||""} onChangeText={v=>setReps({...reps,[key]:v})} placeholder="0" placeholderTextColor="#8C95A6" className="bg-background text-text p-3 rounded-control w-20 text-center"/></View>)}<Pressable onPress={save} className="bg-accent rounded-control h-14 justify-center items-center my-8"><Text className="text-text font-bold">COMPLETE WORKOUT</Text></Pressable></ScrollView>;
}
