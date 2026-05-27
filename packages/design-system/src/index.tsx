import { Card, cn } from "@garden/ui";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export const ModuleHeader = ({
  title,
  description,
  aside,
}: {
  title: string;
  description: string;
  aside?: ReactNode;
}) => (
  <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
    <div>
      <h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-muted">{description}</p>
    </div>
    {aside}
  </header>
);

export const ModuleTabs = ({ tabs }: { tabs: Array<{ to: string; label: string; end?: boolean }> }) => (
  <nav className="mb-8 flex gap-2 overflow-x-auto pb-1" aria-label="Module sections">
    {tabs.map((tab) => (
      <NavLink
        key={tab.to}
        to={tab.to}
        end={tab.end}
        className={({ isActive }) =>
          cn(
            "shrink-0 rounded-full px-4 py-2.5 text-sm font-medium text-muted transition",
            isActive ? "bg-white text-forest shadow-card" : "hover:bg-white/55 hover:text-ink",
          )
        }
      >
        {tab.label}
      </NavLink>
    ))}
  </nav>
);

export const StatCard = ({ label, value, supporting }: { label: string; value: ReactNode; supporting?: string }) => (
  <Card className="p-5">
    <p className="text-xs font-medium uppercase tracking-[0.13em] text-muted">{label}</p>
    <div className="mt-3 font-serif text-3xl tracking-tight text-forest">{value}</div>
    {supporting ? <p className="mt-2 text-sm text-muted">{supporting}</p> : null}
  </Card>
);
