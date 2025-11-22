// src/components/TopBar.tsx
import React from "react";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-4 md:px-8 md:py-5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-50 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
        <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          ● Online
        </span>
        <span className="px-2 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/30">
          Partiu085 FULL
        </span>
      </div>
    </header>
  );
};
