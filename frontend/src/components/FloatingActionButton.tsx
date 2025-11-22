import React from "react";
import { Cpu } from "lucide-react";

export const FloatingActionButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="fixed bottom-20 right-5 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-110"
  >
    <Cpu size={22} />
  </button>
);
