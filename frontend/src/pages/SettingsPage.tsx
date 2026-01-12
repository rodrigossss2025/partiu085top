import React, { useEffect, useState, useRef } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useNavigate } from "react-router-dom";

export function SettingsPage() {

  const navigate = useNavigate();

  const [statusExecucao, setStatusExecucao] = useState<boolean>(false);
  const [loadingExecucao, setLoadingExecucao] = useState<boolean>(false);
  const [mensagem, setMensagem] = useState<string>("");
  const [progresso, setProgresso] = useState<number>(0);
  const [finalizou, setFinalizou] = useState<boolean>(false);

  const [logs, setLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";

  /* ------------ STATUS ---------------- */

  async function fetchStatusExecucao() {
    try {
      const res = await fetch(`${API_BASE}/status_execucao`);
      const data = await res.json();

      const rodando = data.em_andamento === true;
      setStatusExecucao(rodando);

      if (rodando) {
        setProgresso(prev => Math.min(prev + 8, 92));
      } else {
        setProgresso(100);
        setFinalizou(true);
      }

    } catch (err) {
      console.error("Erro ao consultar status da execução:", err);
    }
  }

  const iniciarPolling = () => {
    const interval = setInterval(fetchStatusExecucao, 3000);
    return interval;
  };

  /* ------------ LOGS AO VIVO ---------------- */

  async function fetchLogs() {
    try {
      const res = await fetch(`${API_BASE}/logs_execucao`);
      const data = await res.json();

      if (data?.logs) {
        setLogs(data.logs);
      }

      // auto scroll
      setTimeout(() => {
        if (logsRef.current) {
          logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }
      }, 100);

    } catch (err) {
      console.error("Erro ao buscar logs:", err);
    }
  }

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  /* ------------ EXECUTAR ---------------- */

  const handleExecutarAgora = async () => {
    setLoadingExecucao(true);
    setMensagem("");
    setProgresso(5);
    setFinalizou(false);

    try {
      const res = await fetch(
        `${API_BASE}/executar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modo: "MANUAL" })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMensagem(data.message || "Erro ao iniciar execução");
        return;
      }

      setMensagem("🚀 Busca iniciada. Aguarde…");
      const poll = iniciarPolling();

      const stopCheck = setInterval(() => {
        if (finalizou) {
          clearInterval(poll);
          clearInterval(stopCheck);
        }
      }, 1000);

    } catch (err) {
      console.error("Erro ao executar agora:", err);
      setMensagem("❌ Erro ao conectar com o servidor.");
    } finally {
      setLoadingExecucao(false);
    }
  };

  /* ------------ MONTAGEM INICIAL ---------------- */

  useEffect(() => {
    fetchStatusExecucao();
  }, []);

  return (
    <div className="p-4 space-y-4">

      <GlassCard>
        <h2 className="text-lg font-bold mb-2 text-white">
          Execução Manual do Radar
        </h2>

        <p className="text-sm text-gray-300 mb-2">
          Status:{" "}
          {statusExecucao
            ? "⏳ Busca em execução"
            : "🟢 Aguardando execução"}
        </p>

        {(statusExecucao || progresso > 0) && (
          <div className="w-full bg-white/10 rounded h-3 mb-3">
            <div
              className="bg-orange-500 h-3 rounded transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        )}

        <div className="flex gap-3 mt-3 flex-wrap">
          <button
            onClick={handleExecutarAgora}
            disabled={loadingExecucao || statusExecucao}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-bold disabled:opacity-50"
          >
            {statusExecucao
              ? "Executando..."
              : loadingExecucao
              ? "Iniciando..."
              : "Executar Busca Agora"}
          </button>

          <button
            onClick={fetchStatusExecucao}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-bold"
          >
            Atualizar Status
          </button>

          {finalizou && (
            <button
              onClick={() => navigate("/results")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold"
            >
              Abrir Resultados
            </button>
          )}
        </div>

        {mensagem && (
          <div className="mt-4 p-3 bg-black/40 text-gray-200 rounded-lg text-sm border border-white/10">
            {mensagem}
          </div>
        )}
      </GlassCard>

      {/* ---------- PAINEL DE LOGS ---------- */}

      <GlassCard>
        <h3 className="text-md font-bold text-white mb-2">
          📡 Logs de Execução (tempo real)
        </h3>

        <div
          ref={logsRef}
          className="bg-black/40 border border-white/10 rounded-lg p-3 h-72 overflow-y-auto text-sm font-mono text-gray-200"
        >
          {logs.length === 0 && (
            <div className="opacity-60">Nenhum log disponível.</div>
          )}

          {logs.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {l}
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-2">
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Limpar logs
          </button>
        </div>
      </GlassCard>

    </div>
  );
}
