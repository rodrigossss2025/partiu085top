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

  async function iniciar() {
    setLoading(true);
    await iniciarAgendador();
    await fetchStatus();
    setLoading(false);
  }

  async function pausar() {
    setLoading(true);
    await pausarAgendador();
    await fetchStatus();
    setLoading(false);
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <GlassCard>
        <h2 className="text-lg font-bold mb-2">Status do Agendador</h2>

        <p className="text-sm text-gray-300 mb-2">
          {status ? status.status : "Carregando..."}
        </p>

        <div className="flex gap-3 mt-3">
          <button
            onClick={iniciar}
            disabled={loading}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md text-white font-bold"
          >
            Iniciar
          </button>

          <button
            onClick={pausar}
            disabled={loading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-white font-bold"
          >
            Pausar
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
