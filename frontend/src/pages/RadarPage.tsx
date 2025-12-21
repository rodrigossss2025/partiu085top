import React, { useState } from "react";
import {
  PaperAirplaneIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale/pt-BR";
import { postExecutarManual } from "../services/backendService";
import { DestinoAutocomplete } from "../components/DestinoAutocomplete";

registerLocale("pt-BR", ptBR);

/* =================== PAGE =================== */

export function RadarPage() {
  const [searchMode, setSearchMode] = useState<"exact" | "flex">("exact");
  const [destinosInput, setDestinosInput] = useState<string>("");

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleSearch = async () => {
    if (!destinosInput || !startDate) {
      alert("Preencha os destinos e a data inicial!");
      return;
    }

    setLoading(true);
    setStatusMsg("Consultando Amadeus em tempo real...");

    const destinosList = destinosInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    const modoEnvio = searchMode === "flex" ? "MANUAL_FLEX" : "MANUAL";

    try {
      const response: any = await postExecutarManual(
        modoEnvio,
        destinosList,
        formatDate(startDate),
        formatDate(endDate)
      );

      if (response?.success) {
        setStatusMsg(
          "Busca concluída! Verifique os resultados na aba Resultados."
        );
      } else {
        setStatusMsg("Erro ao iniciar busca.");
      }
    } catch (error) {
      console.error("Erro ao executar radar:", error);
      setStatusMsg("Erro na comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* CABEÇALHO */}
      <div className="flex items-center space-x-3 mb-2">
        <PaperAirplaneIcon className="h-8 w-8 text-orange-500" />
        <h1 className="text-3xl font-bold text-white">Radar Livre</h1>
      </div>
      <p className="text-gray-400 -mt-4 ml-11">
        Explore qualquer destino do mundo usando o poder do Amadeus.
      </p>

      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-2xl">
        {/* TABS */}
        <div className="flex space-x-4 mb-6 border-b border-slate-700 pb-4">
          <button
            onClick={() => setSearchMode("exact")}
            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${
              searchMode === "exact"
                ? "text-orange-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            📅 Data Exata
            {searchMode === "exact" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setSearchMode("flex")}
            className={`pb-2 px-4 text-sm font-medium transition-colors relative ${
              searchMode === "flex"
                ? "text-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🔍 Janela de Preços (Flexível)
            {searchMode === "flex" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-t-full" />
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DESTINOS */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destinos (IATA)
            </label>

            <DestinoAutocomplete
              value={destinosInput}
              onChange={setDestinosInput}
            />

            <p className="text-xs text-gray-500 mt-1">
              Digite o nome da cidade ou código. Seleção múltipla com vírgula.
            </p>
          </div>

          {/* DATA INICIAL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4" />
              {searchMode === "exact"
                ? "Data do Voo"
                : "Início do Período"}
            </label>

            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              locale="pt-BR"
              placeholderText="Selecione a data"
              className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
              wrapperClassName="w-full"
              showPopperArrow={false}
            />
          </div>

          {/* DATA FINAL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4" />
              {searchMode === "exact"
                ? "Volta (Opcional)"
                : "Fim do Período"}
            </label>

            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              minDate={startDate || new Date()}
              locale="pt-BR"
              placeholderText="Selecione a data"
              className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
              wrapperClassName="w-full"
              showPopperArrow={false}
            />

            {searchMode === "flex" && (
              <p className="text-xs text-blue-400 mt-1">
                Busca datas baratas entre Início e Fim.
              </p>
            )}
          </div>
        </div>

        {/* AÇÃO */}
        <div className="mt-8 flex justify-end items-center gap-4">
          {statusMsg && (
            <span className="text-sm text-green-400 animate-pulse">
              {statusMsg}
            </span>
          )}

          <button
            onClick={handleSearch}
            disabled={loading}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : searchMode === "exact"
                ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white"
                : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white"
            }`}
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-5 w-5" />
                {searchMode === "exact"
                  ? "Buscar Voo Exato"
                  : "Escanear Período"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-gray-500 text-sm">
        <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
          <strong className="block text-gray-300 mb-1">Modo Exato</strong>
          Consulta o preço real-time de um voo específico.
        </div>

        <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
          <strong className="block text-gray-300 mb-1">Modo Flexível</strong>
          Varre o calendário e acha datas baratas.
        </div>

        <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
          <strong className="block text-gray-300 mb-1">Códigos IATA</strong>
          Use sempre 3 letras. Ex: FOR, MIA, LIS.
        </div>
      </div>
    </div>
  );
}
