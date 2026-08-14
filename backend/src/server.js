const express=require("express");
const cors=require("cors");
require("dotenv").config();
const pool=require("./config/database");
const routes=require("./routes");
const app=express();
app.use(cors());
app.use(express.json());
app.use("/api",routes);
app.get("/",async(req,res)=>{
 try{await pool.query("SELECT 1");res.json({message:"Store Rating API running",database:"Connected"});}
 catch(e){res.status(500).json({message:"Database connection failed",error:e.message});}
});
const port=process.env.PORT||5000;
app.listen(port,()=>console.log(`API: http://localhost:${port}`));
