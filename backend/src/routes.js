const express=require("express");
const {register,login,changePassword}=require("./controllers/auth");
const admin=require("./controllers/admin");
const stores=require("./controllers/stores");
const owner=require("./controllers/owner");
const seed=require("./controllers/seed");
const {authenticate,authorize}=require("./middleware/auth");
const r=express.Router();

r.post("/auth/register",register);
r.post("/auth/login",login);
r.post("/seed",seed);
r.use("/account",authenticate);
r.post("/account/password",changePassword);

r.use("/admin",authenticate,authorize("ADMIN"));
r.get("/admin/dashboard",admin.dashboard);
r.get("/admin/users",admin.users);
r.post("/admin/users",admin.createUser);
r.get("/admin/users/:id",admin.userDetails);
r.get("/admin/stores",admin.stores);
r.post("/admin/stores",admin.createStore);

r.use("/stores",authenticate,authorize("USER"));
r.get("/stores",stores.list);
r.post("/stores/:storeId/rating",stores.rate);

r.use("/owner",authenticate,authorize("OWNER"));
r.get("/owner/dashboard",owner.dashboard);

module.exports=r;
