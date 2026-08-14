const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { validateUser } = require("../utils/validation");

const sortField = (v, allowed, fallback) => allowed.includes(v) ? v : fallback;
const sortOrder = v => String(v).toUpperCase() === "DESC" ? "DESC" : "ASC";

async function dashboard(req,res) {
  try {
    const [[u]] = await pool.query("SELECT COUNT(*) total FROM users");
    const [[s]] = await pool.query("SELECT COUNT(*) total FROM stores");
    const [[r]] = await pool.query("SELECT COUNT(*) total FROM ratings");
    res.json({ users:u.total, stores:s.total, ratings:r.total });
  } catch(e){res.status(500).json({message:e.message});}
}

async function users(req,res) {
  try {
    const {name="",email="",address="",role="",sortBy="name",order="ASC"}=req.query;
    const field=sortField(sortBy,["name","email","address","role"],"name");
    let sql="SELECT id,name,email,address,role FROM users WHERE name LIKE ? AND email LIKE ? AND address LIKE ?";
    const p=[`%${name}%`,`%${email}%`,`%${address}%`];
    if(role){sql+=" AND role=?";p.push(role);}
    sql+=` ORDER BY ${field} ${sortOrder(order)}`;
    const [rows]=await pool.query(sql,p);
    res.json(rows);
  }catch(e){res.status(500).json({message:e.message});}
}

async function createUser(req,res){
  try{
    const {name,email,password,address,role="USER"}=req.body;
    const error=validateUser({name,email,address,password});
    if(error)return res.status(400).json({message:error});
    if(!["ADMIN","USER","OWNER"].includes(role))return res.status(400).json({message:"Invalid role"});
    const [x]=await pool.query("SELECT id FROM users WHERE email=?",[email]);
    if(x.length)return res.status(409).json({message:"Email already exists"});
    const hash=await bcrypt.hash(password,10);
    const [r]=await pool.query("INSERT INTO users(name,email,password,address,role) VALUES(?,?,?,?,?)",[name,email,hash,address,role]);
    res.status(201).json({message:"User created",id:r.insertId});
  }catch(e){res.status(500).json({message:e.message});}
}

async function stores(req,res){
  try{
    const {name="",email="",address="",sortBy="name",order="ASC"}=req.query;
    const field=sortField(sortBy,["name","email","address"],"name");
    const [rows]=await pool.query(
      `SELECT s.id,s.name,s.email,s.address,COALESCE(ROUND(AVG(r.rating),2),0) rating
       FROM stores s LEFT JOIN ratings r ON r.store_id=s.id
       WHERE s.name LIKE ? AND s.email LIKE ? AND s.address LIKE ?
       GROUP BY s.id ORDER BY ${field} ${sortOrder(order)}`,
      [`%${name}%`,`%${email}%`,`%${address}%`]
    );
    res.json(rows);
  }catch(e){res.status(500).json({message:e.message});}
}

async function createStore(req,res){
  try{
    const {name,email,address,ownerId}=req.body;
    if(!name||!email||!address||!ownerId)return res.status(400).json({message:"All fields are required"});
    const [o]=await pool.query("SELECT id FROM users WHERE id=? AND role='OWNER'",[ownerId]);
    if(!o.length)return res.status(400).json({message:"Owner account not found"});
    const [r]=await pool.query("INSERT INTO stores(name,email,address,owner_id) VALUES(?,?,?,?)",[name,email,address,ownerId]);
    res.status(201).json({message:"Store created",id:r.insertId});
  }catch(e){res.status(500).json({message:e.message});}
}

async function userDetails(req,res){
  try{
    const [rows]=await pool.query(
      `SELECT u.id,u.name,u.email,u.address,u.role,
       CASE WHEN u.role='OWNER' THEN COALESCE(ROUND(AVG(r.rating),2),0) ELSE NULL END rating
       FROM users u LEFT JOIN stores s ON s.owner_id=u.id LEFT JOIN ratings r ON r.store_id=s.id
       WHERE u.id=? GROUP BY u.id`,[req.params.id]);
    if(!rows.length)return res.status(404).json({message:"User not found"});
    res.json(rows[0]);
  }catch(e){res.status(500).json({message:e.message});}
}

module.exports={dashboard,users,createUser,stores,createStore,userDetails};
