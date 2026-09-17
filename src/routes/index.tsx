import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { readSession, signIn } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("marketing@uninta.edu.br");
  const [password, setPassword] = useState("");
  useEffect(() => { if (readSession()) navigate({ to: "/visao-geral", replace: true }); }, [navigate]);
  return <main className="grid min-h-screen bg-background lg:grid-cols-[1.15fr_.85fr]">
    <section className="diagonal-glow relative hidden overflow-hidden border-r border-border p-14 lg:flex lg:flex-col lg:justify-between">
      <div><p className="font-display text-sm tracking-[.35em] text-muted-foreground">CENTRO UNIVERSITÁRIO UNINTA</p><div className="mt-4 h-1 w-14 bg-primary" /></div>
      <div className="relative z-10 max-w-2xl"><div className="mb-7 flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10"><BarChart3 className="size-8 text-primary" /></div><p className="font-display text-5xl font-bold leading-tight">Dados que impulsionam<br/><span className="text-primary">grandes conquistas.</span></p><p className="mt-5 text-lg text-muted-foreground">Estratégia. Resultados. Mais UNINTA.</p></div>
      <div className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary"/> Ambiente interno de análise de campanhas</div>
    </section>
    <section className="flex items-center justify-center p-6"><form className="w-full max-w-md" onSubmit={(e)=>{e.preventDefault(); if(!email.trim()) return; signIn(email); navigate({to:"/visao-geral"});}}>
      <div className="mb-10 lg:hidden"><p className="font-display text-3xl font-bold">UNINTA MET<span className="text-primary">RIC</span></p></div>
      <p className="text-sm font-medium uppercase tracking-[.25em] text-primary">UNINTA METRIC</p><h1 className="mt-3 font-display text-4xl font-bold">Bem-vindo.</h1><p className="mt-2 text-muted-foreground">Acesse a central de performance de campanhas.</p>
      <label className="mt-8 block text-sm">E-mail institucional</label><div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-card px-4"><Mail className="size-4 text-muted-foreground"/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="h-12 w-full bg-transparent outline-none" required/></div>
      <label className="mt-5 block text-sm">Senha</label><div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-card px-4"><LockKeyhole className="size-4 text-muted-foreground"/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" className="h-12 w-full bg-transparent outline-none"/></div>
      <div className="mt-4 flex justify-between text-xs text-muted-foreground"><label><input type="checkbox" className="mr-2"/>Lembrar-me</label><span>Autenticação real será conectada depois</span></div>
      <button className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition hover:brightness-110">ENTRAR <ArrowRight className="size-4"/></button>
      <p className="mt-5 text-center text-xs text-muted-foreground">MVP 0.1 • Sessão local para validação do produto</p>
    </form></section>
  </main>;
}
