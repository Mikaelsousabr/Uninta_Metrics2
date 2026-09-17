import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarRange,
  Filter,
  GitCompare,
  Images,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Search,
  Settings,
  Moon,
  Sun,
  Stethoscope,
  Target,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { readSession, signOut, useDataset, type Session } from "@/lib/store";
import { TooltipProvider } from "@/components/ui/tooltip";

const NAV = [
  { label: "Visão Geral", to: "/visao-geral", icon: LayoutDashboard, ready: true },
  { label: "Campanhas", to: "/campanhas", icon: Megaphone, ready: true },
  { label: "Importações", to: "/importacoes", icon: Upload, ready: true },
  { label: "Funil", to: "/funil", icon: Filter, ready: true },
  { label: "Origem & Qualidade", to: "/origem-qualidade", icon: Target, ready: true },
  { label: "Criativos", to: "/criativos", icon: Images, ready: true },
  { label: "Públicos", to: "/publicos", icon: Users, ready: true },
  { label: "Comparar", to: "/comparar", icon: GitCompare, ready: true },
  { label: "Diagnósticos", to: "/diagnosticos", icon: Stethoscope, ready: true },
  { label: "Relatórios", to: "/relatorios", icon: BarChart3, ready: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const { imports } = useDataset();

  useEffect(() => {
    const current = readSession();
    if (!current) navigate({ to: "/", replace: true });
    else setSession(current);
  }, [navigate]);
  useEffect(() => {
    const savedTheme = localStorage.getItem("uninta-metric-theme");
    const initialTheme = savedTheme === "light" ? "light" : "dark";

    setTheme(initialTheme);
    document.documentElement.classList.toggle("light", initialTheme === "light");
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("uninta-metric-theme", nextTheme);

    document.documentElement.classList.toggle("light", nextTheme === "light");
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const units = ["Todas as unidades", "Sobral", "Fortaleza", "Itapipoca", "Tianguá", "Umirim"];
  const latest = imports[0];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
          <div className="border-b border-sidebar-border px-5 py-6">
            <p className="font-display text-sm tracking-[0.3em] text-muted-foreground">UNINTA</p>
            <p className="font-display text-2xl font-bold">
              MET<span className="text-primary">RIC</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Gestão e Performance de Campanhas
            </p>
            <div className="mt-3 h-0.5 w-8 bg-primary" />
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {NAV.map((item) =>
              item.ready ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    pathname.startsWith(item.to)
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground/60"
                  title="Em breve"
                >
                  <item.icon className="size-4" />
                  <span className="flex-1">{item.label}</span>
                  <span className="rounded border border-border px-1.5 py-0.5 text-[10px]">
                    Em breve
                  </span>
                </div>
              ),
            )}
          </nav>

          <div className="border-t border-sidebar-border p-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {(session?.name ?? "U").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{session?.name ?? "Usuário"}</p>
                <p className="truncate text-muted-foreground">{session?.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-muted-foreground">
              <Link to="/configuracoes" className="inline-flex items-center gap-1 hover:text-foreground"><Settings className="size-3.5" /> Configurações</Link>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                onClick={() => {
                  signOut();
                  navigate({ to: "/", replace: true });
                }}
              >
                <LogOut className="size-3.5" /> Sair
              </button>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">Versão 0.6.6</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex min-w-50 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder="Buscar campanhas, conjuntos, anúncios..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => { if (e.key === "Enter") navigate({ to: "/campanhas", search: { q: e.currentTarget.value || undefined } }); }}
              />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <CalendarRange className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {latest?.period_start && latest?.period_end
                  ? `${latest.period_start} — ${latest.period_end}`
                  : "Período dos dados importados"}
              </span>
            </div>
            <select
              aria-label="Filtrar unidade"
              onChange={(e) =>
                navigate({
                  to: "/campanhas",
                  search: {
                    unit:
                      e.target.value === "Todas as unidades"
                        ? undefined
                        : e.target.value,
                  },
                })
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>

            {/* Tema claro / escuro */}
            <button
              type="button"
              onClick={toggleTheme}
              className="relative rounded-lg border border-border bg-surface p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>

            {/* Notificações */}
            <button
              type="button"
              className="relative rounded-lg border border-border bg-surface p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Notificações"
              onClick={() =>
                window.alert(
                  latest?.warnings?.length
                    ? `Última importação: ${latest.warnings.length} aviso(s).\n\n${latest.warnings
                        .slice(0, 5)
                        .join("\n")}`
                    : "Nenhum aviso pendente na última importação.",
                )
              }
            >
              <Bell className="size-4" />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 md:flex">
              <Building2 className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">Centro Universitário UNINTA</span>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
