// src/components/Sidebar.tsx
import React from "react";

type PageKey = "radar" | "resultados" | "config";

interface SidebarProps {
  activePage: PageKey;
  onChange(page: PageKey): void;
}

const items: { key: PageKey; label: string; icon: string }[] = [
  { key: "radar", label: "Radar", icon: "📡" },
  { key: "resultados", label: "Resultados", icon: "📊" },
  { key: "config", label: "Configurações", icon: "⚙️" },
];

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onChange }) => {
  return (
    <aside className="hidden md:flex flex-col w-56 bg-slate-950/60 border-r border-slate-800/70 backdrop-blur-lg">
      <div className="px-5 py-6 border-b border-slate-800/80">
        <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
          Radar
        </div>
        <div className="mt-1.5 text-lg font-semibold text-slate-50">
          Partiu085
        </div>
        <div className="text-[11px] text-slate-500">Monitor de passagens</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = item.key === activePage;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition
                ${isActive
                  ? "bg-slate-800 text-slate-50 shadow-inner shadow-slate-900/60"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 text-[11px] text-slate-500 border-t border-slate-800/80">
        Conectado ao backend Flask<br />
        <span className="text-slate-400">localhost:5000</span>
      </div>
    </aside>
  );
};
