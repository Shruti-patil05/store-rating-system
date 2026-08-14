const bcrypt=require("bcryptjs");
const pool=require("../config/database");
async function seed(req,res){
 try{
  const accounts=[
   ["System Administrator Account","admin@example.com","Admin@123","Admin Office, Main Road","ADMIN"],
   ["Normal User Demo Account","user@example.com","User@123","User Street, City","USER"],
   ["Store Owner Demo Account","owner@example.com","Owner@123","Owner Street, City","OWNER"]
  ];
  for(const a of accounts){
   const hash=await bcrypt.hash(a[2],10);
   await pool.query("INSERT INTO users(name,email,password,address,role) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE role=VALUES(role),password=VALUES(password)",[a[0],a[1],hash,a[3],a[4]]);
  }
  const [[owner]]=await pool.query("SELECT id FROM users WHERE email='owner@example.com'");
  const [[count]]=await pool.query("SELECT COUNT(*) c FROM stores");
  if(!count.c) await pool.query("INSERT INTO stores(name,email,address,owner_id) VALUES(?,?,?,?)",["Demo Rating Store","store@example.com","Main Market Road, Pune",owner.id]);
  res.json({message:"Demo data ready",accounts:[
   "admin@example.com / Admin@123","user@example.com / User@123","owner@example.com / Owner@123"
  ]});
 }catch(e){res.status(500).json({message:e.message});}
}
module.exports=seed;
