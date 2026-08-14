import {useEffect,useState} from "react";
import {Routes,Route,Navigate,useNavigate,Link} from "react-router-dom";
import api from "./api";

function Layout({children}){
 const nav=useNavigate(); const user=JSON.parse(localStorage.getItem("user")||"null");
 const logout=()=>{localStorage.clear();nav("/login")};
 return <><header><b>⭐ Store Rating</b><nav>{user&&<span>{user.name} ({user.role})</span>} {user&&<button onClick={logout}>Logout</button>}</nav></header><main>{children}</main></>
}
function Login(){
 const nav=useNavigate(); const [f,setF]=useState({email:"",password:""});const [m,setM]=useState("");
 const submit=async e=>{e.preventDefault();try{const {data}=await api.post("/auth/login",f);localStorage.setItem("token",data.token);localStorage.setItem("user",JSON.stringify(data.user));nav(data.user.role==="ADMIN"?"/admin":data.user.role==="OWNER"?"/owner":"/stores")}catch(e){setM(e.response?.data?.message||"Login failed")}};
 return <Layout><Card title="Login"><Msg m={m}/><FormInput n="email" type="email" v={f.email} set={v=>setF({...f,email:v})}/><FormInput n="password" type="password" v={f.password} set={v=>setF({...f,password:v})}/><button onClick={submit}>Login</button><p>No account? <Link to="/register">Register</Link></p></Card></Layout>
}
function Register(){
 const nav=useNavigate();const [f,setF]=useState({name:"",email:"",address:"",password:""});const[m,setM]=useState("");
 const submit=async e=>{e.preventDefault();try{await api.post("/auth/register",f);setM("Registered successfully");setTimeout(()=>nav("/login"),700)}catch(e){setM(e.response?.data?.message||"Registration failed")}};
 return <Layout><Card title="Create Account"><Msg m={m}/><FormInput n="name" v={f.name} set={v=>setF({...f,name:v})}/><FormInput n="email" type="email" v={f.email} set={v=>setF({...f,email:v})}/><label>Address<textarea value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></label><FormInput n="password" type="password" v={f.password} set={v=>setF({...f,password:v})}/><small>Name: 20–60 chars. Password: 8–16 chars, uppercase + special character.</small><button onClick={submit}>Register</button></Card></Layout>
}
function FormInput({n,type="text",v,set}){return <label>{n[0].toUpperCase()+n.slice(1)}<input type={type} value={v} onChange={e=>set(e.target.value)} required/></label>}
function Card({title,children}){return <section className="card"><h2>{title}</h2>{children}</section>}
function Msg({m}){return m?<div className="msg">{m}</div>:null}
function Protected({role,children}){const u=JSON.parse(localStorage.getItem("user")||"null");if(!u)return <Navigate to="/login"/>;if(role&&!role.includes(u.role))return <Navigate to="/login"/>;return <Layout>{children}</Layout>}

function Stores(){
 const [rows,setRows]=useState([]),[q,setQ]=useState({name:"",address:""}),[m,setM]=useState("");
 const load=async()=>{const {data}=await api.get("/stores",{params:q});setRows(data)};
 useEffect(()=>{load()},[]);
 const rate=async(id,rating)=>{try{await api.post(`/stores/${id}/rating`,{rating});setM("Rating saved");load()}catch(e){setM(e.response?.data?.message||"Error")}};
 return <><h1>Stores</h1><div className="filters"><input placeholder="Search name" onChange={e=>setQ({...q,name:e.target.value})}/><input placeholder="Search address" onChange={e=>setQ({...q,address:e.target.value})}/><button onClick={load}>Search</button></div><Msg m={m}/><div className="grid">{rows.map(s=><Card key={s.id} title={s.name}><p>{s.address}</p><p>Overall rating: ⭐ {s.overallRating}</p><p>Your rating: {s.userRating||"Not rated"}</p><select value={s.userRating||""} onChange={e=>rate(s.id,Number(e.target.value))}><option value="" disabled>Rate 1–5</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></Card>)}</div></>
}

function Admin(){
 const [dash,setDash]=useState({}),[users,setUsers]=useState([]),[stores,setStores]=useState([]),[tab,setTab]=useState("users"),[m,setM]=useState("");
 const load=async()=>{const [d,u,s]=await Promise.all([api.get("/admin/dashboard"),api.get("/admin/users"),api.get("/admin/stores")]);setDash(d.data);setUsers(u.data);setStores(s.data)};
 useEffect(()=>{load()},[]);
 return <><h1>Admin Dashboard</h1><div className="stats"><div>Users <b>{dash.users}</b></div><div>Stores <b>{dash.stores}</b></div><div>Ratings <b>{dash.ratings}</b></div></div><button onClick={()=>setTab("users")}>Users</button> <button onClick={()=>setTab("stores")}>Stores</button> <button onClick={()=>setTab("adduser")}>Add User</button> <button onClick={()=>setTab("addstore")}>Add Store</button><Msg m={m}/>{tab==="users"&&<Table title="Users" rows={users} cols={["name","email","address","role"]}/>} {tab==="stores"&&<Table title="Stores" rows={stores} cols={["name","email","address","rating"]}/>} {tab==="adduser"&&<AdminUser onDone={()=>{setM("User created");load()}}/>} {tab==="addstore"&&<AdminStore users={users.filter(u=>u.role==="OWNER")} onDone={()=>{setM("Store created");load()}}/>}</>
}
function Table({title,rows,cols}){return <section className="card"><h2>{title}</h2><div className="tablewrap"><table><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id}>{cols.map(c=><td key={c}>{r[c]}</td>)}</tr>)}</tbody></table></div></section>}
function AdminUser({onDone}){const[f,setF]=useState({name:"",email:"",password:"",address:"",role:"USER"});const submit=async e=>{e.preventDefault();try{await api.post("/admin/users",f);onDone()}catch(e){alert(e.response?.data?.message)}};return <Card title="Add User"><FormInput n="name" v={f.name} set={v=>setF({...f,name:v})}/><FormInput n="email" v={f.email} set={v=>setF({...f,email:v})}/><FormInput n="password" type="password" v={f.password} set={v=>setF({...f,password:v})}/><label>Address<textarea value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></label><label>Role<select value={f.role} onChange={e=>setF({...f,role:e.target.value})}><option>USER</option><option>ADMIN</option><option>OWNER</option></select></label><button onClick={submit}>Create</button></Card>}
function AdminStore({users,onDone}){const[f,setF]=useState({name:"",email:"",address:"",ownerId:""});const submit=async e=>{e.preventDefault();try{await api.post("/admin/stores",{...f,ownerId:Number(f.ownerId)});onDone()}catch(e){alert(e.response?.data?.message)}};return <Card title="Add Store"><FormInput n="name" v={f.name} set={v=>setF({...f,name:v})}/><FormInput n="email" v={f.email} set={v=>setF({...f,email:v})}/><label>Address<textarea value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></label><label>Owner<select value={f.ownerId} onChange={e=>setF({...f,ownerId:e.target.value})}><option value="">Select owner</option>{users.map(u=><option value={u.id} key={u.id}>{u.name}</option>)}</select></label><button onClick={submit}>Create</button></Card>}

function Owner(){
 const[d,setD]=useState(null);useEffect(()=>{api.get("/owner/dashboard").then(x=>setD(x.data))},[]);
 if(!d)return <p>Loading...</p>;return <><h1>Store Owner Dashboard</h1>{!d.store?<Card title="No store assigned">Ask an administrator to assign a store.</Card>:<><div className="stats"><div>Store <b>{d.store.name}</b></div><div>Average Rating <b>⭐ {d.averageRating}</b></div><div>Ratings <b>{d.users.length}</b></div></div><Table title="Users who rated the store" rows={d.users} cols={["name","email","rating"]}/></>}</>
}
function Password(){const[f,setF]=useState({currentPassword:"",newPassword:""}),[m,setM]=useState("");const submit=async()=>{try{const r=await api.post("/account/password",f);setM(r.data.message)}catch(e){setM(e.response?.data?.message)}};return <Card title="Change Password"><Msg m={m}/><FormInput n="currentPassword" type="password" v={f.currentPassword} set={v=>setF({...f,currentPassword:v})}/><FormInput n="newPassword" type="password" v={f.newPassword} set={v=>setF({...f,newPassword:v})}/><button onClick={submit}>Update</button></Card>}
function App(){
 return <Routes><Route path="/" element={<Navigate to="/login"/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/stores" element={<Protected role={["USER"]}><Stores/></Protected>}/><Route path="/admin" element={<Protected role={["ADMIN"]}><Admin/></Protected>}/><Route path="/owner" element={<Protected role={["OWNER"]}><Owner/></Protected>}/><Route path="/password" element={<Protected><Password/></Protected>}/></Routes>
}
export default App;