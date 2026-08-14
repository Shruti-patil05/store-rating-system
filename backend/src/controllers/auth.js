const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { validateUser } = require("../utils/validation");

function tokenFor(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
}

async function register(req, res) {
  try {
    const { name, email, address, password } = req.body;
    const error = validateUser({ name, email, address, password });
    if (error) return res.status(400).json({ message: error });

    const [exists] = await pool.query("SELECT id FROM users WHERE email=?", [email]);
    if (exists.length) return res.status(409).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users(name,email,password,address,role) VALUES(?,?,?,?, 'USER')",
      [name, email, hash, address]
    );
    res.status(201).json({ message: "Registration successful", id: result.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email=?", [email]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const u = rows[0];
    res.json({ token: tokenFor(u), user: { id:u.id, name:u.name, email:u.email, address:u.address, role:u.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const { passwordRegex } = require("../utils/validation");
    if (!passwordRegex.test(newPassword || "")) return res.status(400).json({ message: "New password must be 8-16 characters with one uppercase and one special character" });
    const [rows] = await pool.query("SELECT password FROM users WHERE id=?", [req.user.id]);
    if (!rows.length || !(await bcrypt.compare(currentPassword, rows[0].password))) return res.status(400).json({ message: "Current password is incorrect" });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password=? WHERE id=?", [hash, req.user.id]);
    res.json({ message: "Password updated successfully" });
  } catch (e) { res.status(500).json({ message: e.message }); }
}

module.exports = { register, login, changePassword };
