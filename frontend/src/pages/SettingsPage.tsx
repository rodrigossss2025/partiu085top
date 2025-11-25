// frontend/src/pages/SettingsPage.tsx

import React, { useEffect, useState } from "react";
import {
  getStatusRadar,
  iniciarAgendador,
  pausarAgendador,
} from "../services/backendService";
import { GlassCard } from "@/components/GlassCard";

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    await iniciarAgendador();
    await fetchStatus();
    setLoading(false);
  }

  async function handlePausar() {
    setLoading(true);
    await pausarAgendador();
    await fetchStatus();
    setLoading(false);
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

        <div className="flex gap-3 mt-3">
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
        </div>
      </GlassCard>
    </div>
  );
};
