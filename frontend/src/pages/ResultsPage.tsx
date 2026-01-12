import React, { useEffect, useMemo, useState } from "react";
import { TicketIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getResultados } from "../services/backendService";
import { FlightCard } from "../components/FlightCard";

type Oferta = {
  origem?: string;
  destino?: string;
  destino_iata?: string;
  destination?: string;
  preco?: any;
  baseline?: any;
  modo?: string;
  timestamp?: string;
  data_hora?: string;
  created_at?: string;
  [key: string]: any;
};

/* =================== HELPERS =================== */

function getDestino(o: Oferta) {
  return (
    o.destino ||
    o.destination ||
    o.destino_iata ||
    "DESTINO"
  );
}

function normalizePreco(valor: any): number {
  if (valor == null) return 0;
  if (typeof valor === "number") return valor;

  let s = String(valor).replace("R$", "").trim();

  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/**
 * 🔵 Separa Radar (AUTO) x 🟠 Manual (MANUAL)
 */
function processarResultados(listaBruta: Oferta[], filtro: string) {
  const termo = filtro.trim().toUpperCase();

  const listaFiltrada = termo
    ? listaBruta.filter(o =>
        getDestino(o).toUpperCase().includes(termo)
      )
    : listaBruta;

  const radar: Oferta[] = [];
  const manual: Oferta[] = [];

  listaFiltrada.forEach((o) => {
    const preco = normalizePreco(o.preco);
    const baseline = normalizePreco(o.baseline);

    const obj = {
      ...o,
      preco,
      percentual_baseline:
        baseline > 0 ? preco / baseline : null,
    };

    if (o.modo === "AUTO") {
      if (baseline > 0 && preco <= baseline) {
        radar.push(obj);
      }
    } else {
      manual.push(obj);
    }
  });

  return {
    radar: radar.sort((a, b) => a.preco - b.preco),
    manual: manual.sort((a, b) => a.preco - b.preco),
  };
}

/* =================== PAGE =================== */

export function ResultsPage() {
  const [allOfertas, setAllOfertas] = useState<Oferta[]>([]);
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
      } catch (e) {
        console.error("Erro ao buscar resultados:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grupos = useMemo(
    () => processarResultados(allOfertas, filter),
    [allOfertas, filter]
  );

  const total = grupos.radar.length + grupos.manual.length;

  return (
    <div className="space-y-10 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TicketIcon className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">
            Oportunidades
          </h1>
        </div>

        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-gray-300">
          Total:{" "}
          <span className="text-white font-bold">{total}</span>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por destino..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">
          Carregando oportunidades...
        </div>
      ) : (
        <div className="space-y-12">

          <Section
            title="🔵 Ofertas do Radar (Automático)"
            lista={grupos.radar}
          />

          <Section
            title="🟠 Ofertas Manuais"
            lista={grupos.manual}
          />

          {total === 0 && (
            <div className="text-center py-20 text-gray-600">
              Nenhuma oferta encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =================== SECTION =================== */

function Section({
  title,
  lista,
}: {
  title: string;
  lista: Oferta[];
}) {
  if (lista.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-orange-500 pl-3">
        {title}
      </h2>

      <div
        className="
          grid
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-5
          xl:grid-cols-6
          gap-6
        "
      >
        {lista.map((voo, i) => (
          <div key={`${getDestino(voo)}-${i}`}>
            <FlightCard voo={voo} />
          </div>
        ))}
      </div>
    </section>
  );
}
