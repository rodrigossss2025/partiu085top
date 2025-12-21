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

  async function handleIniciar() {
    setLoading(true);
    try {
      await iniciarAgendador();
      await fetchStatus();
    } catch (err) {
      console.error("Erro ao iniciar agendador:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePausar() {
    setLoading(true);
    try {
      await pausarAgendador();
      await fetchStatus();
    } catch (err) {
      console.error("Erro ao pausar agendador:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRodarAgora() {
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
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  const textoStatus =
    status?.status ||
    status?.message ||
    "Carregando status do agendador...";

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
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Iniciar
          </button>

          <button
            onClick={handlePausar}
            disabled={loading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pausar
          </button>

          <button
            onClick={handleRodarAgora}
            disabled={executandoAgora}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executandoAgora ? "Executando..." : "Rodar Agora"}
          </button>
        </div>

        {resultadoAgora && (
          <div className="mt-4 p-3 bg-black/40 text-gray-200 rounded-lg text-sm">
            <p className="font-bold mb-1">Resultado:</p>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(resultadoAgora, null, 2)}
            </pre>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
