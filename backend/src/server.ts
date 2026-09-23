import express from "express";
const app=express(); app.use(express.json());
app.get("/health",(_,res)=>res.json({ok:true,service:"primal-champion-api"}));
app.listen(process.env.PORT||3000);
