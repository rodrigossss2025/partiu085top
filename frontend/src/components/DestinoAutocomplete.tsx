import React, { useState, useEffect, useRef } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { getDestinosDisponiveis } from '../services/backendService';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

interface Destino {
  label: string; // Ex: "Miami (MIA)"
  value: string; // Ex: "MIA"
}

export function DestinoAutocomplete({ value, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<Destino[]>([]);
  const [filtered, setFiltered] = useState<Destino[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. Carrega os destinos do seu CSV ao iniciar
  useEffect(() => {
    async function load() {
      const data = await getDestinosDisponiveis();
      if (data.success && data.destinos) {
        setSuggestions(data.destinos);
      }
    }
    load();
  }, []);

  // 2. Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Lógica de filtro inteligente (multiselect)
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    onChange(rawVal);

    // Pega apenas o último termo digitado após a vírgula
    const terms = rawVal.split(',');
    const currentTerm = terms[terms.length - 1].trim().toUpperCase();

    if (currentTerm.length >= 1) {
      const matches = suggestions.filter(s =>
        s.label.toUpperCase().includes(currentTerm) ||
        s.value.includes(currentTerm)
      ).slice(0, 5); // Limita a 5 sugestões

      setFiltered(matches);
      setShowDropdown(matches.length > 0);
    } else {
      setShowDropdown(false);
    }
  };

  // 4. Ao selecionar um item
  const handleSelect = (iata: string) => {
    const terms = value.split(',');
    terms.pop(); // Remove o termo incompleto digitado
    terms.push(iata); // Adiciona o IATA correto

    const newValue = terms.join(', ') + ', '; // Adiciona vírgula para o próximo
    onChange(newValue);
    setShowDropdown(false);

    // Foca de volta no input (opcional, via ref se quisesse)
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={handleInput}
        placeholder="Digite para buscar (Ex: FOR, MIA)"
        className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all uppercase"
      />

      {showDropdown && (
        <ul className="absolute z-50 w-full bg-slate-800 border border-slate-600 rounded-xl mt-1 shadow-2xl max-h-60 overflow-y-auto animate-fade-in">
          {filtered.map((item) => (
            <li
              key={item.value}
              onClick={() => handleSelect(item.value)}
              className="px-4 py-3 hover:bg-slate-700 cursor-pointer text-gray-200 flex items-center gap-2 transition-colors border-b border-slate-700/50 last:border-0"
            >
              <MapPinIcon className="h-4 w-4 text-orange-500" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}