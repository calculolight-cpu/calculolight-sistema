import React, { useEffect, useState } from "react";
import { clearToken, createQuote, getClients, getPlans, getQuotes, login, setToken } from "./api";
function Card({ children }) { return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>; }
function money(v){ return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v||0)); }

export default function App() {
  const [token, setTokenState] = useState(localStorage.getItem("cl_token") || "");
  const [email, setEmail] = useState("master@calculolight.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [calculation, setCalculation] = useState(null);
  const [form, setForm] = useState({ client_name:"", typology:"Porta Pivotante ACM", line:"Gold", width_mm:1200, height_mm:2300, color:"Preto Fosco", glass:"Laminado Fumê 5+5", quantity:1, status:"Enviado" });

  async function loadAll() {
    const [c, q, p] = await Promise.all([getClients(), getQuotes(), getPlans()]);
    setClients(c); setQuotes(q); setPlans(p);
    if (!form.client_name && c[0]) setForm((prev) => ({ ...prev, client_name: c[0].name }));
  }
  useEffect(() => { if (token) loadAll().catch((e) => setError(e.message)); }, [token]);

  async function handleLogin() {
    try {
      setError("");
      const result = await login(email, password);
      setToken(result.token);
      setTokenState(result.token);
    } catch (e) { setError(e.message); }
  }

  async function handleCreateQuote() {
    try {
      setError("");
      const result = await createQuote(form);
      setCalculation(result.calculation);
      setQuotes(await getQuotes());
    } catch (e) { setError(e.message); }
  }

  if (!token) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <Card><div className="mb-4 text-2xl font-black">Entrar no Cálculo Light</div>
        <div className="space-y-3">
          <input className="w-full rounded-xl border px-4 py-3" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="w-full rounded-xl border px-4 py-3" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white" onClick={handleLogin}>Entrar</button>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex gap-2 border-b bg-white px-4 py-4 overflow-x-auto">
        {["dashboard","orcamentos","planos"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 ${tab===t ? "bg-yellow-400 font-semibold" : "bg-slate-100"}`}>{t}</button>
        ))}
        <button className="ml-auto rounded-xl border px-4 py-2" onClick={() => { clearToken(); setTokenState(""); }}>Sair</button>
      </div>
      <div className="p-6">
        {tab === "dashboard" && <div className="grid gap-4 md:grid-cols-3"><Card><div className="text-sm text-slate-500">Clientes</div><div className="mt-2 text-3xl font-bold">{clients.length}</div></Card><Card><div className="text-sm text-slate-500">Orçamentos</div><div className="mt-2 text-3xl font-bold">{quotes.length}</div></Card><Card><div className="text-sm text-slate-500">Receita estimada</div><div className="mt-2 text-3xl font-bold">{money(quotes.reduce((a,q)=>a+Number(q.total_value||0),0))}</div></Card></div>}
        {tab === "orcamentos" && <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><Card><div className="mb-4 text-xl font-black">Novo orçamento</div><div className="space-y-3"><select className="w-full rounded-xl border px-4 py-3" value={form.client_name} onChange={(e)=>setForm({...form, client_name: e.target.value})}>{clients.map((c)=><option key={c.id} value={c.name}>{c.name}</option>)}</select><select className="w-full rounded-xl border px-4 py-3" value={form.typology} onChange={(e)=>setForm({...form, typology: e.target.value})}><option>Porta Pivotante ACM</option><option>Janela de Correr 2 Folhas</option></select><div className="grid grid-cols-2 gap-3"><select className="w-full rounded-xl border px-4 py-3" value={form.line} onChange={(e)=>setForm({...form, line: e.target.value})}><option>Gold</option><option>Suprema</option></select><input className="w-full rounded-xl border px-4 py-3" value={form.glass} onChange={(e)=>setForm({...form, glass: e.target.value})} /></div><div className="grid grid-cols-2 gap-3"><input type="number" className="w-full rounded-xl border px-4 py-3" value={form.width_mm} onChange={(e)=>setForm({...form, width_mm: Number(e.target.value)})} /><input type="number" className="w-full rounded-xl border px-4 py-3" value={form.height_mm} onChange={(e)=>setForm({...form, height_mm: Number(e.target.value)})} /></div><input className="w-full rounded-xl border px-4 py-3" value={form.color} onChange={(e)=>setForm({...form, color: e.target.value})} /><button className="w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white" onClick={handleCreateQuote}>Salvar orçamento e calcular</button></div></Card><div className="space-y-6"><Card><div className="mb-4 text-xl font-black">Histórico</div><div className="space-y-3">{quotes.map((q)=><div key={q.id} className="rounded-2xl border p-4 flex items-center justify-between"><div><div className="font-semibold">{q.typology}</div><div className="text-sm text-slate-500">{q.client_name}</div></div><div className="font-bold">{money(q.total_value)}</div></div>)}</div></Card><Card><div className="mb-4 text-xl font-black">Resultado técnico</div>{!calculation ? <div className="text-slate-500">Crie um orçamento para receber o cálculo.</div> : <div className="space-y-4 text-sm"><div><strong>Abertura útil:</strong> {calculation.opening_clearance.width_useful_mm} x {calculation.opening_clearance.height_useful_mm} mm</div><div><strong>Perfis:</strong> {calculation.profiles.map((p)=>`${p.profile} ${p.cut_mm}mm x${p.quantity}`).join(" • ")}</div><div><strong>Vidros:</strong> {calculation.glasses.map((g)=>`${g.glass} ${g.width_mm}x${g.height_mm} x${g.quantity}`).join(" • ")}</div><div><strong>Barras 6m:</strong> {calculation.purchase_list.profiles.map((p)=>`${p.profile}: ${p.bars_needed} barra(s)`).join(" • ")}</div><div><strong>Venda:</strong> {money(calculation.pricing.sale_total)}</div></div>}</Card></div></div>}
        {tab === "planos" && <div className="grid gap-4 md:grid-cols-3">{plans.map((p)=><Card key={p.code}><div className="font-semibold">{p.name}</div><div className="text-sm text-slate-500">{money(p.price_cents/100)}/mês</div>{p.trial_days > 0 ? <div className="mt-2 text-xs font-semibold text-yellow-800">Teste grátis de {p.trial_days} dias</div> : null}</Card>)}</div>}
      </div>
    </div>
  );
}
