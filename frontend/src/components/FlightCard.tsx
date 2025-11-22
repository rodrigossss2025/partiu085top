import React from 'react';
import {
  TicketIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import type { Oferta } from '../types';

// Funções de formatação
const formatDataBr = (dateStr?: string) => {
  if (!dateStr) return '--/--';
  const [ano, mes, dia] = dateStr.split('-');
  if (dia && mes && ano) return `${dia}/${mes}/${ano}`;
  return dateStr;
};

const timeAgo = (timestampStr: string) => {
  if (!timestampStr) return '';
  const found = new Date(timestampStr);
  const now = new Date();
  const diffMs = now.getTime() - found.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins} min atrás`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours} horas atrás`;
  return `${Math.round(diffHours / 24)} dias atrás`;
};

export const FlightCard = ({ voo }: { voo: Oferta }) => {
  const dataIda = voo.data_ida || voo.data;
  const temVolta = voo.data_volta && voo.data_volta.length > 5;

  return (
    <div className="group bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-5 hover:border-orange-500/50 hover:shadow-orange-900/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full">

      {/* BADGE DE MODO */}
      <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wider ${
        voo.modo === 'AUTO'
          ? 'bg-purple-600/20 text-purple-400'
          : voo.modo === 'MILHAS (R$)'
          ? 'bg-purple-600/20 text-purple-400'
          : 'bg-blue-600/20 text-blue-400'
      }`}>
        {voo.modo === 'AUTO'
          ? '🤖 Auto'
          : voo.modo === 'MILHAS (R$)'
          ? '💸 Milhas'
          : '👤 Manual'}
      </div>

      {/* ROTA */}
      <div className="flex items-center gap-3 mt-2 mb-4">
        <span className="text-2xl font-black text-white">{voo.origem}</span>
        <div className="h-0.5 w-8 bg-slate-600 relative group-hover:w-12 transition-all">
          <TicketIcon className="h-4 w-4 text-slate-400 absolute -top-2 left-1/2 -translate-x-1/2" />
        </div>
        <span className="text-2xl font-black text-white">{voo.destino}</span>
      </div>

      {/* DATAS */}
      <div className="space-y-3 mb-6 flex-grow">

        {/* IDA */}
        <div className="flex items-center text-gray-300">
          <CalendarDaysIcon className="h-5 w-5 mr-2 text-orange-500" />
          <span className="text-xs font-bold uppercase text-gray-500 mr-2 w-10">Ida</span>
          <span className="text-lg font-medium text-white">{formatDataBr(dataIda)}</span>
        </div>

        {/* VOLTA */}
        {temVolta ? (
          <div className="flex items-center text-gray-300">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-orange-500" />
            <span className="text-xs font-bold uppercase text-gray-500 mr-2 w-10">Volta</span>
            <span className="text-lg font-medium text-white">{formatDataBr(voo.data_volta)}</span>
          </div>
        ) : (
          <div className="flex items-center text-gray-600">
            <div className="h-5 w-5 mr-2"></div>
            <span className="text-xs italic">Somente Ida</span>
          </div>
        )}

        {/* TEMPO */}
        <div className="flex items-center text-gray-500 text-xs pt-2 mt-2 border-t border-slate-700/50">
          <ClockIcon className="h-3 w-3 mr-1.5" />
          Achado: {timeAgo(voo.timestamp)}
        </div>
      </div>

      {/* PREÇO + BOTÃO */}
      <div className="flex items-end justify-between border-t border-slate-700 pt-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">
            {voo.modo === 'MILHAS (R$)'
              ? 'Preço em Milhas'
              : temVolta
              ? 'Total (Ida + Volta)'
              : 'Preço por pessoa'}
          </p>

          <div className={`flex items-center text-2xl font-bold ${
            voo.modo === 'MILHAS (R$)'
              ? 'text-purple-400'
              : 'text-green-400'
          }`}>
            <span className="text-sm mr-1">
              {voo.modo === 'MILHAS (R$)' ? '' : voo.moeda}
            </span>

            {/* 💰 PREÇO FINAL DO BACKEND */}
            {Number(
              voo.modo === "MILHAS (R$)"
                ? voo.baseline
                : voo.preco   // <- SEMPRE vem o preço final (ida ou ida+volta)
            ).toLocaleString("pt-BR", {
              minimumFractionDigits: voo.modo === "MILHAS (R$)" ? 0 : 2
            })}

            {voo.modo === 'MILHAS (R$)' && (
              <span className="text-lg ml-2">milhas</span>
            )}
          </div>

          {/* Preço em R$ quando for milhas */}
          {voo.modo === 'MILHAS (R$)' && (
            <span className="text-xs text-green-400">
              Preço (R$):{' '}
              {Number(voo.preco).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          )}
        </div>

        <a
          href={voo.link}
          target="_blank"
          rel="noreferrer"
          className="bg-white text-slate-900 hover:bg-orange-500 hover:text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg active:scale-95"
        >
          Ver
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </a>
      </div>

      {/* EFEITO SPARKLES */}
      {Number(voo.preco) < 2500 && (
        <div className="absolute -left-10 -bottom-10 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <SparklesIcon className="h-32 w-32 text-yellow-400 rotate-12" />
        </div>
      )}
    </div>
  );
};
