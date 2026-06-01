import { useAuth } from "@garden/auth";
import { useGarden } from "@garden/shared-state";
import { Button, cn } from "@garden/ui";
import { BookOpen, Dumbbell, House, Leaf, LogOut, Plus, Settings, SquareCheckBig, UtensilsCrossed } from "lucide-react";
import { type PropsWithChildren, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { QuickCapture } from "./QuickCapture";

const primary = [
  { to: "/today", label: "Today", icon: House },
  { to: "/train", label: "Train", icon: Dumbbell },
  { to: "/think", label: "Think", icon: BookOpen },
  { to: "/work", label: "Work", icon: SquareCheckBig },
  { to: "/eat", label: "Eat", icon: UtensilsCrossed },
];

export const AppShell = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { syncError, syncStatus } = useGarden();
  const accountLabel = auth.user?.email ?? (auth.enabled ? "Signed in" : "Local mode");
  const syncLabel = auth.enabled && auth.user
    ? syncStatus === "synced"
      ? "Synced across devices"
      : syncStatus === "syncing"
        ? "Syncing Garden data..."
        : syncStatus === "error"
          ? "Sync needs setup"
          : "Local cache active"
    : auth.enabled
      ? "Sign in to sync"
      : "Local-only workspace";
  const [captureOpen, setCaptureOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCaptureOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-ink/5 bg-canvas px-6 py-7 lg:flex lg:flex-col">
        <div className="mb-14 flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-forest text-white">
            <Leaf size={18} strokeWidth={1.8} />
          </div>
          <div>
            <p className="font-serif text-xl leading-5 tracking-tight">Garden OS</p>
            <p className="mt-1 text-xs text-muted">Intentional living</p>
          </div>
        </div>
        <nav className="space-y-1">
          {primary.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium text-muted transition",
                  isActive ? "bg-white text-forest shadow-card" : "hover:bg-white/60 hover:text-ink",
                )
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setCaptureOpen(true)}
          className="mt-6 flex h-11 items-center justify-between gap-2 rounded-2xl border border-ink/8 bg-white/70 px-4 text-sm font-medium text-muted transition hover:text-ink"
        >
          <span className="flex items-center gap-2.5">
            <Plus size={17} strokeWidth={1.8} />
            Quick capture
          </span>
          <kbd className="rounded-md border border-ink/10 bg-mist px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted">
            ⌘K
          </kbd>
        </button>
        <div className="mt-auto space-y-3">
          <div className="rounded-2xl bg-white/70 p-3 text-xs text-muted">
            <p className="font-medium text-ink">{accountLabel}</p>
            <p className="mt-1" title={syncError ?? undefined}>{syncLabel}</p>
          </div>
          <Button onClick={() => navigate("/review")} className="w-full !bg-clay hover:!bg-clay/90">
            Evening review
          </Button>
          {auth.enabled ? (
            <Button variant="quiet" className="w-full justify-start gap-2 px-4" onClick={() => void auth.signOut()}>
              <LogOut size={16} />
              Sign out
            </Button>
          ) : null}
          <NavLink to="/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-ink">
            <Settings size={17} />
            Settings
          </NavLink>
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink/5 bg-canvas/90 px-5 backdrop-blur lg:hidden">
        <NavLink to="/today" className="flex items-center gap-2.5">
          <Leaf className="text-forest" size={19} />
          <span className="font-serif text-xl tracking-tight">Garden OS</span>
        </NavLink>
        <Button variant="secondary" className="h-9 min-h-9 px-3" onClick={() => navigate("/review")}>
          Review
        </Button>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 pb-28 pt-7 sm:px-8 lg:ml-64 lg:px-12 lg:pb-12 lg:pt-11">
        {children}
      </main>
      <button
        aria-label="Quick capture"
        onClick={() => setCaptureOpen(true)}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-forest text-white shadow-card transition active:scale-95 lg:hidden"
      >
        <Plus size={24} strokeWidth={2} />
      </button>
      <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 flex items-center justify-around rounded-[1.4rem] border border-ink/6 bg-white/96 p-2 shadow-card backdrop-blur lg:hidden">
        {primary.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn("flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] text-muted", isActive && "bg-mist text-forest")
            }
          >
            <Icon size={18} strokeWidth={1.9} />
            {label}
          </NavLink>
        ))}
      </nav>
      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
};
