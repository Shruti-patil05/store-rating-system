const pool=require("../config/database");

async function list(req,res){
 try{
  const {name="",address=""}=req.query;
  const [rows]=await pool.query(
   `SELECT s.id,s.name,s.address,COALESCE(ROUND(AVG(ar.rating),2),0) overallRating,
    ur.rating userRating
    FROM stores s LEFT JOIN ratings ar ON ar.store_id=s.id
    LEFT JOIN ratings ur ON ur.store_id=s.id AND ur.user_id=?
    WHERE s.name LIKE ? AND s.address LIKE ?
    GROUP BY s.id,ur.rating ORDER BY s.name ASC`,
   [req.user.id,`%${name}%`,`%${address}%`]);
  res.json(rows);
 }catch(e){res.status(500).json({message:e.message});}
}
async function rate(req,res){
 try{
  const rating=Number(req.body.rating);
  if(!Number.isInteger(rating)||rating<1||rating>5)return res.status(400).json({message:"Rating must be 1-5"});
  const [x]=await pool.query("SELECT id FROM ratings WHERE user_id=? AND store_id=?",[req.user.id,req.params.storeId]);
  if(x.length){
   await pool.query("UPDATE ratings SET rating=? WHERE id=?",[rating,x[0].id]);
   return res.json({message:"Rating updated"});
  }
  await pool.query("INSERT INTO ratings(user_id,store_id,rating) VALUES(?,?,?)",[req.user.id,req.params.storeId,rating]);
  res.status(201).json({message:"Rating submitted"});
 }catch(e){res.status(500).json({message:e.message});}
}
module.exports={list,rate};
