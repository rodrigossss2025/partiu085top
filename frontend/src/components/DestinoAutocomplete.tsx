import React, { useEffect, useState, useRef } from "react";
import { getDestinos } from "../services/backendService";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function DestinoAutocomplete({ value, onChange }: Props) {
  const [lista, setLista] = useState<any[]>([]);
  const [filtrados, setFiltrados] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const blurLock = useRef(false);

  // ---- Carrega lista do backend uma vez
  useEffect(() => {
    async function load() {
      const resp = await getDestinos();
      const destinos = resp?.destinos || [];
      setLista(destinos);
    }
    load();
  }, []);

  const debounceTimer = useRef<any>(null);

  // ---- Filtro atualizado: busca por IATA OU NOME
  const filtrar = (texto: string) => {
    const termo = texto.split(",").pop()?.trim().toUpperCase() || "";

    if (!termo) {
      setFiltrados([]);
      return;
    }

    const listaFiltrada = lista
      .map((d: any) => ({
        iata: d.iata?.toUpperCase() || "",
        cidade: d.cidade || "",
        pais: d.pais || "",
        fullName: `${d.cidade} (${d.pais})`,
      }))
      .filter((d) =>
        d.iata.includes(termo) ||
        d.cidade.toUpperCase().includes(termo) ||
        d.fullName.toUpperCase().includes(termo)
      )
      .slice(0, 12);

    setFiltrados(listaFiltrada);
  };

  const handleChange = (texto: string) => {
    onChange(texto.toUpperCase());

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      filtrar(texto);
    }, 120);

    setOpen(true);
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          if (!blurLock.current) setOpen(false);
        }}
        placeholder="Digite cidade ou código IATA…"
        className="w-full px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-600 text-white outline-none focus:ring-2 focus:ring-orange-500"
      />

      {open && filtrados.length > 0 && (
        <div
          className="absolute w-full bg-slate-900 border border-slate-700 rounded-xl mt-1 shadow-xl max-h-72 overflow-y-auto z-20"
          onMouseEnter={() => (blurLock.current = true)}
          onMouseLeave={() => (blurLock.current = false)}
        >
          {filtrados.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-slate-800 flex justify-between text-sm"
              onClick={() => {
                const partes = value.split(",");
                partes[partes.length - 1] = item.iata;
                onChange(partes.join(", ").toUpperCase());
                setOpen(false);
              }}
            >
              <span className="font-mono text-orange-300">{item.iata}</span>
              <span className="text-slate-300 ml-3 truncate">
                {item.cidade} ({item.pais})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
