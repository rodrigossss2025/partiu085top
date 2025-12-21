import React, { useEffect, useState } from "react";
import {
  getStatusRadar,
  iniciarAgendador,
  pausarAgendador,
  executarAgendadorAgora,
} from "../services/backendService";
import { GlassCard } from "@/components/GlassCard";

/* =================== PAGE =================== */

export function SettingsPage() {
  // Tipando o estado para evitar problemas com 'any'
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [executandoAgora, setExecutandoAgora] = useState<boolean>(false);
  const [resultadoAgora, setResultadoAgora] = useState<any>(null);

  async function fetchStatus() {
    try {
      const data = await getStatusRadar();
      setStatus(data);
    } catch (err) {
      console.error("Erro ao carregar status do agendador:", err);
    }
  }

  const handleIniciar = async () => {
    setLoading(true);
    try {
      await iniciarAgendador();
      await fetchStatus();
    } catch (err) {
      console.error("Erro ao iniciar agendador:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePausar = async () => {
    setLoading(true);
    try {
      await pausarAgendador();
      await fetchStatus();
    } catch (err) {
      console.error("Erro ao pausar agendador:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRodarAgora = async () => {
    setExecutandoAgora(true);
    setResultadoAgora(null);

    try {
      const data = await executarAgendadorAgora();
      setResultadoAgora(data);
    } catch (err) {
      console.error("Erro ao executar agora:", err);
    } finally {
      setExecutandoAgora(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Lógica de texto simplificada
  const textoStatus =
    status?.status ||
    status?.message ||
    (loading ? "Atualizando..." : "Carregando status do agendador...");

  return (
    <div className="p-4 space-y-4">
      <GlassCard>
        <h2 className="text-lg font-bold mb-2 text-white">
          Status do Agendador
        </h2>

        <p className="text-sm text-gray-300 mb-2">{textoStatus}</p>

        <div className="flex gap-3 mt-3 flex-wrap">
          <button
            onClick={handleIniciar}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Iniciar
          </button>

          <button
            onClick={handlePausar}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Pausar
          </button>

          <button
            onClick={handleRodarAgora}
            disabled={executandoAgora}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {executandoAgora ? "Executando..." : "Rodar Agora"}
          </button>
        </div>

        {resultadoAgora && (
          <div className="mt-4 p-3 bg-black/40 text-gray-200 rounded-lg text-sm border border-white/10">
            <p className="font-bold mb-1 text-blue-400">Resultado:</p>
            <pre className="whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(resultadoAgora, null, 2)}
            </pre>
          </div>
        )}
      </GlassCard>
    </div>
  );
}