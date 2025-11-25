// frontend/src/pages/ResultsPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  TicketIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { getResultados } from "../services/backendService";
import { FlightCard } from "../components/FlightCard";
import type { Oferta } from "../types";

interface OfertasAgrupadas {
  hoje: Oferta[];
  ontem: Oferta[];
}

// Converte "2025-11-22 01:33:45" ou ISO -> Date
function parseTimestamp(ts: string) {
  if (!ts) return new Date(0);
  return new Date(ts.replace(" ", "T"));
}

function normalizePreco(p: any) {
  if (p === null || p === undefined) return 0;
  if (typeof p === "number") return p;
  return Number(String(p).replace(",", ".").replace("R$", "").trim());
}

function processarResultados(
  listaBruta: Oferta[],
  filtro: string
): OfertasAgrupadas {
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const ofertasHoje: Oferta[] = [];
  const ofertasOntem: Oferta[] = [];

  const termoFiltro = filtro.trim().toUpperCase();
  const listaFiltrada = termoFiltro
    ? listaBruta.filter((o: any) =>
        String(o.destino || "").toUpperCase().includes(termoFiltro)
      )
    : listaBruta;

  listaFiltrada.forEach((oferta: any) => {
    const precoNum = normalizePreco(oferta.preco);

    // Filtro baseline só para AUTO
    if (
      oferta.modo === "AUTO" &&
      oferta.baseline &&
      Number(oferta.baseline) > 0 &&
      precoNum > Number(oferta.baseline)
    ) {
      return;
    }

    const dataEncontrada = parseTimestamp(String(oferta.timestamp || ""));

    const diffHours =
      (Date.now() - dataEncontrada.getTime()) / (1000 * 60 * 60);
    if (diffHours > 48) return;

    const ofertaProcessada: Oferta = {
      ...oferta,
      preco: precoNum,
    };

    if (isSameDay(dataEncontrada, hoje)) {
      ofertasHoje.push(ofertaProcessada);
    } else if (isSameDay(dataEncontrada, ontem)) {
      ofertasOntem.push(ofertaProcessada);
    }
  });

  ofertasHoje.sort((a, b) => a.preco - b.preco);
  ofertasOntem.sort((a, b) => a.preco - b.preco);

  return { hoje: ofertasHoje, ontem: ofertasOntem };
}

export function ResultsPage() {
  const [allOfertas, setAllOfertas] = useState<Oferta[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getResultados();

        // 🔥 SUPORTE A TODOS OS FORMATOS:
        const lista =
          data?.results ||
          data?.resultados ||
          data?.ofertas ||
          data?.lista ||
          [];

        if (Array.isArray(lista)) {
          setAllOfertas(lista);
        } else {
          console.warn("Formato inesperado:", data);
        }
      } catch (error) {
        console.error("Erro ao ler resultados", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grupos = useMemo(
    () => processarResultados(allOfertas, filter),
    [allOfertas, filter]
  );

  const totalAtivo = grupos.hoje.length + grupos.ontem.length;

  return (
    <div className="space-y-8 animate-fade-in p-6">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <TicketIcon className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">Oportunidades</h1>
          </div>
          <p className="text-gray-400 ml-11">
            Mostrando apenas ofertas válidas das últimas 48 horas.
          </p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-gray-300 text-sm">
          Total Ativo: <span className="text-white font-bold">{totalAtivo}</span>
        </div>
      </div>

      {/* FILTRO */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar por Destino (ex: MIA, LIS, DXB...)"
            className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* RESULTADOS */}
      {loading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse">
          Carregando e filtrando ofertas...
        </div>
      ) : totalAtivo === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
          <TrashIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma oferta encontrada.</p>
          <p className="text-sm text-gray-600">
            {filter ? "Tente limpar o filtro ou" : "Use o Radar para buscar."}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {grupos.hoje.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-xl font-bold text-white">
                  Fresquinhas do Dia (Hoje)
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grupos.hoje.map((voo, i) => (
                  <FlightCard key={`hj-${i}`} voo={voo} />
                ))}
              </div>
            </section>
          )}

          {grupos.ontem.length > 0 && (
            <section className="opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 mb-4 border-t border-slate-700 pt-8">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <h2 className="text-xl font-bold text-gray-300">
                  Última Chamada (Ontem)
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grupos.ontem.map((voo, i) => (
                  <FlightCard key={`ont-${i}`} voo={voo} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
