import React from "react";

export const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-lg p-4 text-center text-white">
    {children}
  </div>
);
