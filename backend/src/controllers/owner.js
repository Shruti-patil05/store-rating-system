const pool=require("../config/database");
async function dashboard(req,res){
 try{
  const [stores]=await pool.query("SELECT id,name,email,address FROM stores WHERE owner_id=?",[req.user.id]);
  if(!stores.length)return res.json({store:null,averageRating:0,users:[]});
  const store=stores[0];
  const [[avg]]=await pool.query("SELECT COALESCE(ROUND(AVG(rating),2),0) averageRating FROM ratings WHERE store_id=?",[store.id]);
  const [users]=await pool.query(
   `SELECT u.id,u.name,u.email,r.rating FROM ratings r JOIN users u ON u.id=r.user_id WHERE r.store_id=? ORDER BY u.name`,
   [store.id]);
  res.json({store,averageRating:avg.averageRating,users});
 }catch(e){res.status(500).json({message:e.message});}
}
module.exports={dashboard};
