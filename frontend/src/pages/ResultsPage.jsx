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
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d;
  return new Date(ts.replace(" ", "T"));
}

function normalizePreco(valor) {
  if (valor == null) return 0;
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
        String(o.destino || "").toUpperCase().includes(termo)
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

    hojeArr.push({ ...o, preco });
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
        const lista = data?.results || [];
        setAllOfertas(lista);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grupos = useMemo(
    () => processarResultados(allOfertas, filter),
    [allOfertas, filter]
  );

  return (
    <div className="space-y-10 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Resultados</h1>
        <span className="text-white font-bold">
          {grupos.hoje.length}
        </span>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filtrar por destino"
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
      />

      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {grupos.hoje.map((voo, i) => (
            <FlightCard key={i} voo={voo} />
          ))}
        </div>
      )}
    </div>
  );
}
