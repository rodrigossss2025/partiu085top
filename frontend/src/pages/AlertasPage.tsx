import React, { useState, useEffect } from 'react';
import { BellAlertIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getAlertas, addAlerta, deleteAlerta } from '../services/backendService';
import { DestinoAutocomplete } from '../components/DestinoAutocomplete';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale/pt-BR';

// Registra o idioma
registerLocale('pt-BR', ptBR);

interface Alerta {
  id: string;
  origem: string;
  destino: string;
  data_ida: string;
  data_volta: string;
  preco_alvo: string | number;
}

export function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  // State do Formulário
  const [destino, setDestino] = useState("");
  const [dataIda, setDataIda] = useState<Date | null>(null);
  const [dataVolta, setDataVolta] = useState<Date | null>(null);
  const [precoAlvo, setPrecoAlvo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Carrega os alertas salvos
  useEffect(() => {
    fetchAlertas();
  }, []);

  const fetchAlertas = async () => {
    setLoading(true);
    const resp = await getAlertas();
    if (resp.success) {
      setAlertas(resp.alertas);
    }
    setLoading(false);
  };

  const handleAddAlerta = async () => {
    if (!destino || !dataIda || !precoAlvo) {
      alert("Preencha Destino, Data de Ida e Preço Alvo.");
      return;
    }

    setIsSaving(true);
    const destinoIATA = destino.split(',')[0].trim().toUpperCase();

    await addAlerta({
      destino: destinoIATA,
      data_ida: dataIda.toISOString().split('T')[0], // YYYY-MM-DD
      data_volta: dataVolta ? dataVolta.toISOString().split('T')[0] : "",
      preco_alvo: Number(precoAlvo)
    });

    // Limpa o form
    setDestino("");
    setDataIda(null);
    setDataVolta(null);
    setPrecoAlvo("");
    setIsSaving(false);

    // Atualiza a lista
    fetchAlertas();
  };

  const handleDelete = async (id: string) => {
    const item = document.getElementById(`alerta-${id}`);
    if (item) item.style.opacity = '0.3';

    await deleteAlerta(id);
    fetchAlertas(); // Recarrega a lista
  };

  const formatDataBr = (dateStr: string) => {
    if (!dateStr) return '--';
    const [ano, mes, dia] = dateStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="space-y-8 animate-fade-in p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BellAlertIcon className="h-8 w-8 text-orange-500" />
        <h1 className="text-3xl font-bold text-white">Alertas Fixos e Específicos"Sniper"</h1>
      </div>

      {/* Card de Cadastro de Alerta */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Criar Alerta Fixo</h2>
        <p className="text-sm text-gray-400 mb-6">
          Cadastre uma viagem específica. O robô "Sniper" vai checar o preço 4x ao dia e te avisar no Telegram se cair abaixo do seu alvo.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Destino */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Destino</label>
            <DestinoAutocomplete value={destino} onChange={setDestino} />
          </div>

          {/* Data Ida */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data Ida</label>
            <DatePicker
              selected={dataIda}
              onChange={(date) => setDataIda(date)}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              locale="pt-BR"
              placeholderText="Data da ida"
              className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            />
          </div>

          {/* Data Volta */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data Volta (Opcional)</label>
            <DatePicker
              selected={dataVolta}
              onChange={(date) => setDataVolta(date)}
              dateFormat="dd/MM/yyyy"
              minDate={dataIda || new Date()}
              locale="pt-BR"
              placeholderText="Data da volta"
              className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            />
          </div>

          {/* Preço Alvo */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Preço Alvo (R$)</label>
            <input
              type="number"
              value={precoAlvo}
              onChange={(e) => setPrecoAlvo(e.target.value)}
              placeholder="Ex: 500"
              className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">O robô só te avisa se o preço (ida) for MENOR ou IGUAL a este valor.</p>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleAddAlerta}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white disabled:bg-gray-600"
          >
            {isSaving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <BellAlertIcon className="h-5 w-5" />}
            Salvar Alerta
          </button>
        </div>
      </div>

      {/* Lista de Alertas Salvos */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Meus Alertas Ativos</h2>
        {loading && <p className="text-gray-500">Carregando...</p>}

        {!loading && alertas.length === 0 && (
          <p className="text-gray-500 text-center py-4">Nenhum alerta fixo cadastrado.</p>
        )}

        <ul className="space-y-3">
          {alertas.map((alerta) => (
            <li
              key={alerta.id}
              id={`alerta-${alerta.id}`}
              className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 flex items-center justify-between transition-opacity"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-700 rounded-full">
                  <BellAlertIcon className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <span className="text-lg font-bold text-white">{alerta.origem} → {alerta.destino}</span>
                  <p className="text-sm text-gray-400">
                    Ida: {formatDataBr(alerta.data_ida)} |
                    Volta: {formatDataBr(alerta.data_volta)} |
                    Alvo: <span className="text-green-400 font-bold">R$ {alerta.preco_alvo}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(alerta.id)}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-900/20 rounded-full transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
