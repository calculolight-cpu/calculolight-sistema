import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

dotenv.config();
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();

app.use(cors({ origin: ["http://localhost:5173","http://localhost:5174",process.env.APP_URL,process.env.SITE_URL].filter(Boolean) }));
app.use(express.json());

function auth(req,res,next){
  const h=req.headers.authorization||"";
  const token=h.startsWith("Bearer ")?h.slice(7):null;
  if(!token) return res.status(401).json({ error:"Token ausente" });
  try { req.auth=jwt.verify(token, process.env.JWT_SECRET || "troque_este_segredo"); next(); }
  catch { return res.status(401).json({ error:"Token inválido" }); }
}

app.get("/api/health", (_,res)=>res.json({ ok:true, app:"Cálculo Light API" }));

app.post("/api/auth/login", async (req,res)=>{
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1",[email]);
  const user = result.rows[0];
  if(!user) return res.status(401).json({ error:"Login inválido" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if(!ok) return res.status(401).json({ error:"Login inválido" });
  const token = jwt.sign({ userId:user.id, companyId:user.company_id, email:user.email, role:user.role }, process.env.JWT_SECRET || "troque_este_segredo", { expiresIn:"7d" });
  res.json({ token, user:{ id:user.id, email:user.email, role:user.role } });
});

app.get("/api/clients", auth, async (req,res)=>{
  const result = await pool.query("SELECT * FROM clients WHERE company_id = $1 ORDER BY id DESC",[req.auth.companyId]);
  res.json(result.rows);
});

app.get("/api/billing/plans", async (_,res)=>{
  const result = await pool.query("SELECT id, code, name, description, price_cents, currency, interval_unit, interval_count, trial_days FROM billing_plans WHERE is_active = TRUE ORDER BY price_cents ASC");
  res.json(result.rows);
});

app.listen(process.env.PORT || 3000, ()=>console.log(`API rodando em http://localhost:${process.env.PORT || 3000}`));
