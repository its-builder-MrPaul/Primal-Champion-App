import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization");
  if (!auth) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401});
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
    global:{headers:{Authorization:auth}}
  });
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401});
  const body = await req.json();
  const base = Math.max(0, Number(body.base ?? 0));
  const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
  const score=Math.round(base*clamp(Number(body.effort??1),.75,1.5)*clamp(Number(body.intensity??1),.8,1.4)*clamp(Number(body.consistency??1),.9,1.25)*clamp(Number(body.recovery??1),.8,1.15));
  return new Response(JSON.stringify({score}),{headers:{"Content-Type":"application/json"}});
});
