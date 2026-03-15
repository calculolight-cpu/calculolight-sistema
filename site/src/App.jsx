import React from "react";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="font-bold">Cálculo Light</div>
          <a href="https://app.calculolight.com" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Entrar no app</a>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-5xl font-black tracking-tight">Teste grátis de 2 dias nos planos Profissional e Fábrica.</h1>
      </main>
    </div>
  );
}
