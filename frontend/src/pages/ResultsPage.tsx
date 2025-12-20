import React, { useEffect, useMemo, useState } from "react";
import {
  TicketIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { getResultados } from "../services/backendService";
import { FlightCard } from "../components/FlightCard";
import type { Oferta as OfertaOriginal } from "../types";

/* =================== TIPAGEM LOCAL =================== */

interface Oferta extends OfertaOriginal {
  preco: number;
  percentual_baseline: number | null;
}

interface OfertasAgrupadas {
  hoje: Oferta[];
  ontem: Oferta[];
}

/* =================== HELPERS =================== */

function parseTimestamp(ts?: string): Date {
  if (!ts) return new Date();

  let d = new Date(ts);
  if (!isNaN(d.getTime())) return d;

  d = new Date(ts.replace(" ", "T"));
  if (!isNaN(d.getTime())) return d;

  return new Date();
}

function normalizePreco(valor: any): number {
  if (valor === null || valor === undefined) return 0;
  if (typeof valor === "number") return valor;

  const n = Number(
    String(valor)
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  );

  return isNaN(n) ? 0 : n;
}

/* =================== PROCESSADOR =================== */

function processarResultados(
  listaBruta: OfertaOriginal[],
  filtro: string
): OfertasAgrupadas {
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const termoFiltro = filtro.trim().toUpperCase();

  const listaFiltrada = termoFiltro
    ? listaBruta.filter((o: any) =>
        String(o.destino || o.destination || o.destino_iata || "")
          .toUpperCase()
          .includes(termoFiltro)
      )
    : listaBruta;

  const ofertasHoje: Oferta[] = [];
  const ofertasOntem: Oferta[] = [];

  listaFiltrada.forEach((oferta: any) => {
    const precoNum = normalizePreco(oferta.preco);
    const baselineNum = Number(oferta.baseline) || 0;

    if (
      oferta.modo === "AUTO" &&
      baselineNum > 0 &&
      precoNum > baselineNum
    ) {
      return;
    }

    const dataEncontrada = parseTimestamp(
      oferta.timestamp || oferta.data_hora || oferta.created_at
    );

    const diffHours =
      (Date.now() - dataEncontrada.getTime()) / (1000 * 60 * 60);
    if (diffHours > 48) return;

    const percentual =
      oferta.modo === "AUTO" && baselineNum > 0
        ? precoNum / baselineNum
        : null;

    const ofertaProcessada: Oferta = {
      ...oferta,
      preco: precoNum,
      percentual_baseline: percentual,
    };

    if (isSameDay(dataEncontrada, hoje)) {
      ofertasHoje.push(ofertaProcessada);
    } else if (isSameDay(dataEncontrada, ontem)) {
      ofertasOntem.push(ofertaProcessada);
    } else {
      ofertasHoje.push(ofertaProcessada);
    }
  });

  ofertasHoje.sort((a, b) => a.preco - b.preco);
  ofertasOntem.sort((a, b) => a.preco - b.preco);

  return { hoje: ofertasHoje, ontem: ofertasOntem };
}

/* =================== PAGE =================== */

export function ResultsPage() {
  const [allOfertas, setAllOfertas] = useState<OfertaOriginal[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getResultados();
        const lista =
          data?.results ||
          data?.resultados ||
          data?.ofertas ||
          data?.lista ||
          data?.data ||
          [];

        if (Array.isArray(lista)) setAllOfertas(lista);
      } catch (e) {
        console.error("Erro ao ler resultados", e);
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

  const rarasHoje = grupos.hoje.filter(
    (o) =>
      o.modo === "AUTO" &&
      o.percentual_baseline !== null &&
      o.percentual_baseline <= 0.6
  );

  const excelentesHoje = grupos.hoje.filter(
    (o) =>
      o.modo === "AUTO" &&
      o.percentual_baseline !== null &&
      o.percentual_baseline > 0.6 &&
      o.percentual_baseline <= 0.8
  );

  const boasHoje = grupos.hoje.filter(
    (o) =>
      o.modo === "AUTO" &&
      o.percentual_baseline !== null &&
      o.percentual_baseline > 0.8 &&
      o.percentual_baseline <= 1
  );

  const manuaisHoje = grupos.hoje.filter((o) => o.modo !== "AUTO");

  const excelentesOntem = grupos.ontem.filter(
    (o) =>
      o.modo === "AUTO" &&
      o.percentual_baseline !== null &&
      o.percentual_baseline <= 0.8
  );

  const boasOntem = grupos.ontem.filter(
    (o) =>
      o.modo === "AUTO" &&
      o.percentual_baseline !== null &&
      o.percentual_baseline > 0.8 &&
      o.percentual_baseline <= 1
  );

  const totalAtivo =
    rarasHoje.length +
    excelentesHoje.length +
    boasHoje.length +
    manuaisHoje.length +
    excelentesOntem.length +
    boasOntem.length;

  return (
    <div className="space-y-10 p-6">
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <TicketIcon className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">Oportunidades</h1>
          </div>
          <p className="text-gray-400 ml-11">
            Ofertas válidas das últimas 48 horas.
          </p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-gray-300 text-sm">
          Total Ativo:{" "}
          <span className="text-white font-bold">{totalAtivo}</span>
        </div>
      </div>

      {/* FILTRO */}
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por destino (MIA, LIS, DXB...)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white"
        />
      </div>

      {/* RESULTADOS */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando…</div>
      ) : totalAtivo === 0 ? (
        <div className="text-center py-20 bg-slate-800 rounded-2xl border border-slate-700">
          <TrashIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma oferta encontrada.</p>
        </div>
      ) : (
        <>
          {rarasHoje.length > 0 && (
            <Section title="🚨 OFERTAS RARAS (≤ 60%)">
              {rarasHoje}
            </Section>
          )}

          {excelentesHoje.length > 0 && (
            <Section title="🔥 Imperdíveis (até 80%)">
              {excelentesHoje}
            </Section>
          )}

          {boasHoje.length > 0 && (
            <Section title="💡 Boas oportunidades">
              {boasHoje}
            </Section>
          )}

          {manuaisHoje.length > 0 && (
            <Section title="👤 Buscas Manuais">
              {manuaisHoje}
            </Section>
          )}

          {(excelentesOntem.length > 0 || boasOntem.length > 0) && (
            <Section title="⏳ Ontem" faded>
              {[...excelentesOntem, ...boasOntem]}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

/* =================== SECTION =================== */

function Section({
  title,
  children,
  faded,
}: {
  title: string;
  children: Oferta[];
  faded?: boolean;
}) {
  return (
    <section className={faded ? "opacity-80" : ""}>
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {children.map((voo, i) => (
          <FlightCard key={i} voo={voo} />
        ))}
      </div>
    </section>
  );
}
