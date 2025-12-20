import React, { useEffect, useMemo, useState } from "react";
import {
  TicketIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { getResultados } from "../services/backendService";
import { FlightCard } from "../components/FlightCard";

/* =================== HELPERS =================== */

function parseTimestamp(ts) {
  if (!ts) return new Date();
  let d = new Date(ts);
  if (!isNaN(d.getTime())) return d;
  d = new Date(ts.replace(" ", "T"));
  return isNaN(d.getTime()) ? new Date() : d;
}

function normalizePreco(valor) {
  if (valor == null) return 0;
  if (typeof valor === "number") return valor;
  const n = Number(
    String(valor).replace("R$", "").replace(/\./g, "").replace(",", ".").trim()
  );
  return isNaN(n) ? 0 : n;
}

/* =================== PROCESSADOR =================== */

function processarResultados(listaBruta, filtro) {
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const termo = filtro.trim().toUpperCase();

  const lista = termo
    ? listaBruta.filter((o) =>
        String(o.destino || o.destination || o.destino_iata || "")
          .toUpperCase()
          .includes(termo)
      )
    : listaBruta;

  const hojeArr = [];
  const ontemArr = [];

  lista.forEach((o) => {
    const preco = normalizePreco(o.preco);
    const baseline = Number(o.baseline) || 0;

    if (o.modo === "AUTO" && baseline > 0 && preco > baseline) return;

    const data = parseTimestamp(o.timestamp || o.data_hora || o.created_at);
    const diff = (Date.now() - data.getTime()) / 36e5;
    if (diff > 48) return;

    const percentual =
      o.modo === "AUTO" && baseline > 0 ? preco / baseline : null;

    const obj = { ...o, preco, percentual_baseline: percentual };

    if (isSameDay(data, hoje)) hojeArr.push(obj);
    else if (isSameDay(data, ontem)) ontemArr.push(obj);
    else hojeArr.push(obj);
  });

  hojeArr.sort((a, b) => a.preco - b.preco);
  ontemArr.sort((a, b) => a.preco - b.preco);

  return { hoje: hojeArr, ontem: ontemArr };
}

/* =================== PAGE =================== */

export function ResultsPage() {
  const [allOfertas, setAllOfertas] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grupos = useMemo(
    () => processarResultados(allOfertas, filter),
    [allOfertas, filter]
  );

  const filtra = (arr, fn) => arr.filter(fn);

  return (
    <div className="space-y-10 p-6">
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
          <span className="text-white font-bold">
            {grupos.hoje.length + grupos.ontem.length}
          </span>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por destino (MIA, LIS, DXB...)"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando…</div>
      ) : (
        <>
          <Section title="Hoje" lista={grupos.hoje} />
          <Section title="Ontem" lista={grupos.ontem} faded />
        </>
      )}
    </div>
  );
}

/* =================== SECTION =================== */

function Section({ title, lista, faded }) {
  if (!lista || lista.length === 0) return null;
  return (
    <section className={faded ? "opacity-80" : ""}>
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {lista.map((voo, i) => (
          <FlightCard key={i} voo={voo} />
        ))}
      </div>
    </section>
  );
}
