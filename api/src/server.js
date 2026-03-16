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

function calculateFrame(input){
  const opening_clearance={ width_input_mm:input.width_mm, height_input_mm:input.height_mm, width_useful_mm:input.width_mm-4, height_useful_mm:input.height_mm-4 };
  const isDoor=input.typology==="Porta Pivotante ACM";
  const profiles=isDoor?[{ profile:`Montante ${input.line}`, cut_mm:opening_clearance.height_useful_mm, quantity:2 },{ profile:`Travessa ${input.line}`, cut_mm:opening_clearance.width_useful_mm, quantity:2 },{ profile:`Batente ${input.line}`, cut_mm:opening_clearance.height_useful_mm, quantity:2 }]:[{ profile:`Trilho Superior ${input.line}`, cut_mm:opening_clearance.width_useful_mm, quantity:1 },{ profile:`Trilho Inferior ${input.line}`, cut_mm:opening_clearance.width_useful_mm, quantity:1 },{ profile:`Montante Folha ${input.line}`, cut_mm:opening_clearance.height_useful_mm, quantity:4 },{ profile:`Travessa Folha ${input.line}`, cut_mm:Math.round(opening_clearance.width_useful_mm/2), quantity:4 }];
  const glasses=isDoor?[{ glass:input.glass, width_mm:opening_clearance.width_useful_mm-120, height_mm:opening_clearance.height_useful_mm-180, quantity:1 }]:[{ glass:input.glass, width_mm:Math.round(opening_clearance.width_useful_mm/2)-80, height_mm:opening_clearance.height_useful_mm-100, quantity:2 }];
  return { opening_clearance, profiles, glasses, purchase_list:{ profiles:profiles.map((p)=>({ profile:p.profile, bars_needed:Math.max(1, Math.ceil((p.cut_mm*p.quantity)/6000)), total_waste_mm:0 })), glasses }, pricing:{ sale_total:isDoor?3350:2190 } };
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

app.get("/api/clients", auth, async (req,res)=>{ const result = await pool.query("SELECT * FROM clients WHERE company_id = $1 ORDER BY id DESC",[req.auth.companyId]); res.json(result.rows); });
app.get("/api/quotes", auth, async (req,res)=>{ const result = await pool.query("SELECT * FROM quotes WHERE company_id = $1 ORDER BY id DESC",[req.auth.companyId]); res.json(result.rows); });
app.post("/api/quotes", auth, async (req,res)=>{ const calc = calculateFrame(req.body); const result = await pool.query("INSERT INTO quotes (company_id, client_name, typology, line, width_mm, height_mm, color, glass, quantity, total_value, status, calculation_payload) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",[req.auth.companyId, req.body.client_name, req.body.typology, req.body.line, req.body.width_mm, req.body.height_mm, req.body.color, req.body.glass, req.body.quantity || 1, calc.pricing.sale_total, req.body.status || "Enviado", JSON.stringify(calc)]); res.status(201).json({ quote: result.rows[0], calculation: calc }); });
app.get("/api/billing/plans", async (_,res)=>{ const result = await pool.query("SELECT id, code, name, description, price_cents, currency, interval_unit, interval_count, trial_days FROM billing_plans WHERE is_active = TRUE ORDER BY price_cents ASC"); res.json(result.rows); });

app.listen(process.env.PORT || 3000, ()=>console.log(`API rodando em http://localhost:${process.env.PORT || 3000}`));
