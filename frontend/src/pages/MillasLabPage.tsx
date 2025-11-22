import React, { useState } from 'react';
import {
  BeakerIcon,
  ArrowsRightLeftIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { postProcessarTexto } from '../services/backendService';
import { FlightCard } from '../components/FlightCard'; // Importa SÓ O CARD
import type { Oferta } from '../types'; // IMPORTA O TIPO DO NOVO LOCAL

// O resultado pode ser um Voo ou um Texto
type Resultado =
  | { tipo: 'voo', conteudo: Oferta }
  | { tipo: 'texto', conteudo: string }
  | { tipo: 'erro', conteudo: string }
  | null;

export function MillasLabPage() {
  const [textoInput, setTextoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [copied, setCopied] = useState(false);

  const handleProcessar = async (modo: 'reais' | 'reescrever') => {
    if (!textoInput) return;
    setLoading(true);
    setResultado(null);

    const resp = await postProcessarTexto(textoInput, modo);

    if (resp.sucesso) {
      setResultado(resp);
    } else {
      setResultado({ tipo: 'erro', conteudo: resp.conteudo || 'Erro desconhecido.' });
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (resultado?.tipo === 'texto') {
      navigator.clipboard.writeText(resultado.conteudo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">

      <div className="flex items-center space-x-3 mb-2">
        <BeakerIcon className="h-8 w-8 text-orange-500" />
        <h1 className="text-3xl font-bold text-white">Conversor de Textos</h1>
      </div>
      <p className="text-gray-400 -mt-4 ml-11">
        Cole textos de promoções do WhatsApp para analisar e reescrever.
      </p>

      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-2xl space-y-6">

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cole o texto da promoção aqui:
          </label>
          <textarea
            value={textoInput}
            onChange={(e) => setTextoInput(e.target.value)}
            rows={8}
            className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            placeholder="Ex: Voe para MIA por 150k milhas dia 20/11..."
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => handleProcessar('reais')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white disabled:bg-gray-600"
          >
            {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <ArrowsRightLeftIcon className="h-5 w-5" />}
            Converter p/ Reais (R$)
          </button>

          <button
            onClick={() => handleProcessar('reescrever')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white disabled:bg-gray-600"
          >
            {loading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PencilSquareIcon className="h-5 w-5" />}
            Alterar Texto Milhas
          </button>
        </div>
      </div>

      {resultado && !loading && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-white mb-4 border-t border-slate-700 pt-6">Resultado:</h2>

          {resultado.tipo === 'voo' && (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-center text-green-400 mb-2">Encontrei o preço em dinheiro! (E já salvei nos Resultados)</p>
              <FlightCard voo={resultado.conteudo} />
            </div>
          )}

          {resultado.tipo === 'texto' && (
            <div className="relative bg-slate-800 p-4 rounded-xl border border-slate-700">
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-gray-300"
              >
                {copied ? <CheckIcon className="h-4 w-4 text-green-400" /> : <ClipboardIcon className="h-4 w-4" />}
              </button>
              <pre className="text-gray-200 whitespace-pre-wrap font-sans">
                {resultado.conteudo}
              </pre>
            </div>
          )}

          {resultado.tipo === 'erro' && (
            <div className="text-center py-10 bg-red-900/20 rounded-xl border border-red-700">
              <p className="text-red-400">Oops! {resultado.conteudo}</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}