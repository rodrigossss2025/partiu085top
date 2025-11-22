// AdaptadorPage.tsx — Interface do Módulo de IA (Em Desenvolvimento)
// ===========================================================
import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Cpu, Send, Loader2 } from "lucide-react";

export const AdaptadorPage: React.FC = () => {
  const [input, setInput] = useState("");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnviar = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResposta("");
    try {
      // simula chamada futura ao backend Flask (módulo de IA)
      await new Promise((r) => setTimeout(r, 1000));
      setResposta("🤖 O módulo de IA ainda está em desenvolvimento, mas já está pronto para receber mensagens!");
    } catch {
      setResposta("⚠️ Erro ao se comunicar com o backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-16 px-6 text-white">
      <h2 className="text-3xl font-bold flex items-center gap-2">
        <Cpu className="w-7 h-7 text-orange-400" /> Adaptador IA
      </h2>

      <GlassCard>
        <p className="text-gray-300 mb-3">
          Este módulo conectará o sistema Partiu085 ao assistente inteligente para análise de voos, logs e promoções.
        </p>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite algo para testar..."
            className="flex-1 bg-transparent border border-gray-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
          <button
            onClick={handleEnviar}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg shadow-md transition"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send size={18} />}
          </button>
        </div>

        {resposta && (
          <p className="text-gray-200 mt-4 text-sm bg-white/10 p-3 rounded-lg">{resposta}</p>
        )}
      </GlassCard>
    </div>
  );
};
