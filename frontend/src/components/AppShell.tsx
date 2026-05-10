import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const STORAGE_KEY = "price-monitor-sidebar-collapsed";

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const toggle = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      collapsed ? "justify-center px-2" : "",
      isActive
        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25"
        : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside
        className={[
          "relative z-20 flex shrink-0 flex-col border-r border-zinc-800/90 bg-zinc-950/98 backdrop-blur-sm transition-[width] duration-200 ease-out",
          collapsed ? "w-[4.5rem]" : "w-56",
        ].join(" ")}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-zinc-800/80 px-2">
          {!collapsed ? (
            <div className="flex min-w-0 items-center gap-2 px-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-sm font-bold text-emerald-300">
                PM
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-white">Price Monitor</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">lokalnie</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-300">
              PM
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          <NavLink to="/" end className={navClass} title={collapsed ? "Produkty" : undefined}>
            <LayoutDashboard className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            {!collapsed ? <span>Produkty</span> : null}
          </NavLink>
          <NavLink to="/settings" className={navClass} title={collapsed ? "Ustawienia" : undefined}>
            <Settings className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
            {!collapsed ? <span>Ustawienia</span> : null}
          </NavLink>
        </nav>

        <div className="border-t border-zinc-800/80 p-2">
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-zinc-800/60 hover:text-zinc-200"
            title={collapsed ? "Rozwiń panel" : "Zwiń panel"}
          >
            {collapsed ? (
              <PanelLeftOpen className="mx-auto h-5 w-5" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden />
                <span className="font-medium">Zwiń panel</span>
              </>
            )}
          </button>
          {!collapsed ? (
            <p className="mt-2 px-1 text-[10px] leading-relaxed text-zinc-600">Stan panelu zapisywany w przeglądarce.</p>
          ) : null}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-zinc-800/80 bg-zinc-950/80 px-4 backdrop-blur">
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
            v0.0.1
          </span>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
