/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  FileText, 
  Bell, 
  Calendar, 
  ShieldAlert,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Contract, Notification } from '../types';

interface DashboardProps {
  data: {
    aggregates: {
      total: number;
      active: number;
      expired: number;
      warning: number;
      suspended: number;
      totalValue: number;
    };
    expiringNext90: Array<{
      id: string;
      number: string;
      object: string;
      endDate: string;
      daysRemaining: number;
      value: number;
    }>;
    alerts: Notification[];
  };
  contracts: Contract[];
  onNavigateToContracts: () => void;
  onSelectContractId: (id: string) => void;
}

function getDaysDifference(endDateStr: string, baseDateStr: string): number {
  const end = new Date(endDateStr + 'T00:00:00Z');
  const base = new Date(baseDateStr + 'T00:00:00Z');
  const diffTime = end.getTime() - base.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getOffsetDateStr(baseDateStr: string, offsetDays: number): string {
  const date = new Date(baseDateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

export default function Dashboard({ data, contracts, onNavigateToContracts, onSelectContractId }: DashboardProps) {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'red' | 'yellow' | 'green'>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [systemTime, setSystemTime] = useState<string>(() => new Date().toLocaleTimeString('pt-BR'));

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isFilterActive = startDateFilter !== '' || endDateFilter !== '';

  // Filter core contracts from props based on date range (using endDate since we filter by expiration timeframe)
  const filteredContracts = contracts.filter(c => {
    if (startDateFilter && c.endDate < startDateFilter) return false;
    if (endDateFilter && c.endDate > endDateFilter) return false;
    return true;
  });

  const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const today = new Date(todayStr + 'T00:00:00');

  // Formatar data em português: "Sexta-feira, 22 de Maio de 2026"
  const dayStr = today.getDate();
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthName = months[today.getMonth()];
  const yearStr = today.getFullYear();
  const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const weekDayName = weekDays[today.getDay()];
  const formattedBaselineDate = `${weekDayName}, ${dayStr} de ${monthName} de ${yearStr}`;

  const trimesterEndStr = getOffsetDateStr(todayStr, 90);
  const semestreEndStr = getOffsetDateStr(todayStr, 180);

  // Dynamic aggregates computed from currently filtered contract slice
  const dynamicTotal = filteredContracts.length;
  const dynamicActive = filteredContracts.filter(c => c.status === 'ativo').length;
  const dynamicExpired = filteredContracts.filter(c => c.status === 'vencido').length;
  const dynamicWarning = filteredContracts.filter(c => c.status === 'em_vencimento').length;
  const dynamicSuspended = filteredContracts.filter(c => c.status === 'suspenso').length;
  
  // Capital / Value under management (Active or Em Vencimento)
  const activeContractsList = filteredContracts.filter(c => c.status === 'ativo' || c.status === 'em_vencimento');
  const totalValue = activeContractsList.reduce((sum, c) => sum + c.value, 0);

  // Dynamic expiring list for the bottom table & charts
  const dynamicExpiring = filteredContracts.filter(c => {
    if (isFilterActive) {
      // Show remaining contracts that end within the filter range and are not fully closed
      return c.status !== 'encerrado';
    } else {
      // Fallback: contracts expiring in the next 90 days from baseline date
      const diff = getDaysDifference(c.endDate, todayStr);
      return diff >= 0 && diff <= 90 && c.status !== 'encerrado' && c.status !== 'suspenso';
    }
  }).map(c => {
    const diff = getDaysDifference(c.endDate, todayStr);
    return {
      id: c.id,
      number: c.number,
      object: c.object,
      endDate: c.endDate,
      daysRemaining: diff,
      value: c.value
    };
  });

  // Filter alerts only for filtered contracts list
  const filteredAlerts = data.alerts.filter(alert => {
    const isInFilteredList = filteredContracts.some(c => c.id === alert.contractId);
    if (!isInFilteredList) return false;
    
    if (filterSeverity === 'all') return true;
    return alert.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 rounded-xl border border-slate-500 shadow-md">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-emerald-400 shrink-0" />
            Controladoria de Contratos
          </h1>
          <p className="text-sm font-sans text-slate-300 mt-1">
            71º Batalhão de Infantaria Motorizado &bull; Auditoria de Vigências e Fiscalizações
          </p>
        </div>
        <div className="mt-4 md:mt-0 px-4 py-2 bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono text-xs rounded-lg flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Baseline Operacional: {formattedBaselineDate} às {systemTime}</span>
        </div>
      </div>

      {/* NEW Date Range Selector Control Panel */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-500 shadow-md flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="p-2 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-lg shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Intervalo de Vigências
              {isFilterActive && (
                <span className="text-[11px] lowercase bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full text-emerald-400 font-mono uppercase">
                  Filtro Ativo
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-300 mt-1">Filtre capital sob gestão e prospecção de termos pela data de rescisão</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
          {/* Specific Native Dates */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="text-slate-300 font-mono text-[11px]">De:</label>
            <input 
              type="date" 
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="bg-slate-900 border border-slate-500 hover:border-slate-500 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
            <label className="text-slate-300 font-mono text-[11px]">Até:</label>
            <input 
              type="date" 
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="bg-slate-900 border border-slate-500 hover:border-slate-500 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* Clean and Simple Presets */}
          <div className="flex items-center gap-1 overflow-x-auto shrink-0">
            <button 
              type="button"
              onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
              className={`px-2.5 py-1.5 border rounded text-[11px] font-semibold transition-colors cursor-pointer ${!isFilterActive ? 'bg-slate-800 text-white border-slate-650' : 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-white'}`}
            >
              Todos
            </button>
            <button 
              type="button"
              onClick={() => { setStartDateFilter(todayStr); setEndDateFilter(trimesterEndStr); }}
              className={`px-2.5 py-1.5 border rounded text-[11px] font-semibold transition-colors cursor-pointer ${startDateFilter === todayStr && endDateFilter === trimesterEndStr ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-white'}`}
            >
              Trimestre (90D)
            </button>
            <button 
              type="button"
              onClick={() => { setStartDateFilter(todayStr); setEndDateFilter(semestreEndStr); }}
              className={`px-2.5 py-1.5 border rounded text-[11px] font-semibold transition-colors cursor-pointer ${startDateFilter === todayStr && endDateFilter === semestreEndStr ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-white'}`}
            >
              Semestre (180D)
            </button>
            <button 
              type="button"
              onClick={() => { setStartDateFilter('2026-01-01'); setEndDateFilter('2026-12-31'); }}
              className={`px-2.5 py-1.5 border rounded text-[11px] font-semibold transition-colors cursor-pointer ${startDateFilter === '2026-01-01' && endDateFilter === '2026-12-31' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-white'}`}
            >
              Ano 2026
            </button>
            <button 
              type="button"
              onClick={() => { setStartDateFilter('2027-01-01'); setEndDateFilter('2027-12-31'); }}
              className={`px-2.5 py-1.5 border rounded text-[11px] font-semibold transition-colors cursor-pointer ${startDateFilter === '2027-01-01' && endDateFilter === '2027-12-31' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-white'}`}
            >
              Ano 2027
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* Total Active */}
        <div className="bg-slate-800 border-l-4 border-emerald-500 rounded-xl p-5 shadow-sm hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold font-sans uppercase tracking-wider text-slate-300">Contratos Ativos</p>
              <h3 className="text-2xl font-display font-bold text-white mt-2">
                {dynamicActive}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-emerald-400 font-semibold">{dynamicActive}</span> de <span className="text-emerald-400 font-semibold">{dynamicTotal}</span> no período.
          </div>
        </div>

        {/* Expiring (Warning) */}
        <div className="bg-slate-800 border-l-4 border-yellow-500 rounded-xl p-5 shadow-sm hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold font-sans uppercase tracking-wider text-slate-300">Próximos ao Vencimento</p>
              <h3 className="text-2xl font-display font-bold text-white mt-2">
                {dynamicWarning}
              </h3>
            </div>
            <div className="p-2.5 bg-yellow-950 text-yellow-500 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
            Abaixo de <span className="text-yellow-500 font-semibold">30 dias</span> para término.
          </div>
        </div>

        {/* Expired Contracts (Red) */}
        <div className="bg-slate-800 border-l-4 border-red-500 rounded-xl p-5 shadow-sm hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold font-sans uppercase tracking-wider text-slate-300">Contratos Vencidos</p>
              <h3 className="text-2xl font-display font-medium text-white mt-2 flex items-center gap-2">
                {dynamicExpired}
                {dynamicExpired > 0 && (
                  <span className="text-[11px] uppercase font-bold tracking-wide h-5 px-1.5 bg-red-950 text-red-500 border border-red-900 rounded-full flex items-center">Crítico</span>
                )}
              </h3>
            </div>
            <div className="p-2.5 bg-red-950 text-red-400 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
            Prazos regulares com vigência expirada.
          </div>
        </div>

        {/* Value Under Management */}
        <div className="bg-slate-800 border-l-4 border-sky-500 rounded-xl p-5 shadow-sm hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold font-sans uppercase tracking-wider text-slate-300">Capital Sob Gestão</p>
              <h3 className="text-xl font-display font-bold text-white mt-2">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
            </div>
            <div className="p-2.5 bg-sky-950 text-sky-400 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
            Filtrado/Vigente monitorado no período.
          </div>
        </div>
      </div>

      {/* Main Grid for Analytics and Real-time Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alerts Center System (2 columns on lg) */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-500 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-500 pb-3">
              <h2 className="text-lg font-display font-medium text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-400" />
                Painel Geral de Alertas ({filteredAlerts.length})
              </h2>
              
              {/* Category selector */}
              <div className="flex bg-slate-900 text-xs p-1 rounded-lg border border-slate-500">
                <button
                  onClick={() => setFilterSeverity('all')}
                  className={`px-2.5 py-1 rounded-md transition-all ${filterSeverity === 'all' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-450 hover:text-slate-200'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterSeverity('red')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${filterSeverity === 'red' ? 'bg-red-950 text-red-400 font-semibold border border-red-900' : 'text-slate-450 hover:text-red-400'}`}
                >
                  Vencidos/Críticos
                </button>
                <button
                  onClick={() => setFilterSeverity('yellow')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${filterSeverity === 'yellow' ? 'bg-yellow-950 text-yellow-500 font-semibold border border-yellow-904' : 'text-slate-450 hover:text-yellow-500'}`}
                >
                  Vencimento
                </button>
                <button
                  onClick={() => setFilterSeverity('green')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${filterSeverity === 'green' ? 'bg-emerald-950 text-emerald-450 font-semibold border border-emerald-900' : 'text-slate-450 hover:text-emerald-400'}`}
                >
                  Revisão 90D
                </button>
              </div>
            </div>

            {/* List of alerts */}
            <div className="mt-4 space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-12 text-slate-300 font-sans border-2 border-dashed border-slate-500/50 rounded-lg">
                  <ShieldAlert className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                  Nenhum alerta militar de segurança registrado nesta criticidade.
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className={`p-3.5 rounded-lg border flex gap-3 transition-colors ${
                      alert.severity === 'red' 
                        ? 'bg-red-950 border-red-900/60 hover:bg-red-950 text-red-100' 
                        : alert.severity === 'yellow'
                        ? 'bg-yellow-950 border-yellow-900/40 hover:bg-yellow-950 text-yellow-105'
                        : 'bg-emerald-950 border-emerald-920 hover:bg-emerald-950 text-emerald-100'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {alert.severity === 'red' && <div className="h-4 w-4 rounded-full bg-red-500 animate-ping absolute" />}
                      <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold leading-none ${
                        alert.severity === 'red' ? 'bg-red-900 text-white' : alert.severity === 'yellow' ? 'bg-yellow-800 text-slate-900' : 'bg-emerald-800 text-white'
                      }`}>
                        !
                      </span>
                    </div>
                    <div className="flex-1 text-sm bg-transparent">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold font-display tracking-wide">{alert.contractNumber}</span>
                        <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-500 text-center shrink-0">
                          {(() => {
                            const days = alert.daysRemaining !== undefined && alert.daysRemaining !== null 
                              ? alert.daysRemaining 
                              : (() => {
                                  const contract = contracts.find(c => c.id === alert.contractId);
                                  if (!contract) return null;
                                  const end = new Date(contract.endDate);
                                  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                })();
                            
                            if (days === null || days === undefined || isNaN(days)) return 'N/A';
                            return days < 0 
                              ? `Vencido há ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`
                              : `${days} ${days === 1 ? 'dia' : 'dias'}`;
                          })()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs opacity-90 leading-tight">
                        {alert.message}
                      </p>
                      <button 
                        onClick={() => onSelectContractId(alert.contractId)}
                        className="mt-2 text-xs font-semibold underline flex items-center gap-1 hover:text-white"
                      >
                        Auditar Contrato Relacionado
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-500/55 flex justify-end">
            <button 
              onClick={onNavigateToContracts}
              className="text-xs font-semibold font-display text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              Consultar Todos os Contratos
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* SVG-based customized military chart dashboard (No download needed, fully offline) */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-500 shadow-md">
          <h2 className="text-lg font-display font-medium text-white border-b border-slate-500 pb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            Distribuição de Recursos
          </h2>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs text-white uppercase tracking-wider font-mono">Porcentagem por vigência</p>
              <div className="mt-3 flex h-6 rounded-lg overflow-hidden border border-slate-900">
                {/* Active Segment */}
                <div 
                  style={{ width: `${(dynamicActive / (dynamicTotal || 1)) * 100}%` }}
                  className="bg-emerald-600 hover:opacity-90 transition-opacity flex items-center justify-center text-[11px] text-white font-mono font-semibold"
                  title={`Ativos: ${dynamicActive}`}
                >
                  {dynamicActive > 0 && `${Math.round((dynamicActive / (dynamicTotal || 1)) * 100)}%`}
                </div>
                {/* Warning Segment */}
                <div 
                  style={{ width: `${(dynamicWarning / (dynamicTotal || 1)) * 100}%` }}
                  className="bg-yellow-500 hover:opacity-90 transition-opacity flex items-center justify-center text-[11px] text-slate-900 font-mono font-semibold"
                  title={`Em atenção: ${dynamicWarning}`}
                >
                  {dynamicWarning > 0 && `${Math.round((dynamicWarning / (dynamicTotal || 1)) * 100)}%`}
                </div>
                {/* Expired Segment */}
                <div 
                  style={{ width: `${(dynamicExpired / (dynamicTotal || 1)) * 100}%` }}
                  className="bg-red-600 hover:opacity-90 transition-opacity flex items-center justify-center text-[11px] text-white font-mono font-semibold"
                  title={`Vencidos: ${dynamicExpired}`}
                >
                  {dynamicExpired > 0 && `${Math.round((dynamicExpired / (dynamicTotal || 1)) * 100)}%`}
                </div>
              </div>
              <div className="flex gap-4 mt-3 justify-center text-xs font-mono text-white">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-emerald-600"></span>Ativo ({dynamicActive})</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-yellow-500"></span>Atenção ({dynamicWarning})</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-600"></span>Vencido ({dynamicExpired})</span>
              </div>
            </div>

            {/* Custom SVG Bar Graph of Contract Objects Value */}
            <div className="pt-4 border-t border-slate-500/60 pb-2">
              <p className="text-xs text-white uppercase tracking-wider font-mono mb-3">Maiores Contratos Ativos (R$)</p>
              <div className="space-y-3">
                {activeContractsList.length === 0 ? (
                  <p className="text-xs text-white font-mono text-center py-4">Nenhum contrato ativo neste período.</p>
                ) : (
                  [...activeContractsList].sort((a, b) => b.value - a.value).slice(0, 4).map((contract) => {
                    const maxVal = Math.max(...activeContractsList.map(c => c.value), 1);
                    const barPercent = Math.min(100, Math.max(10, (contract.value / maxVal) * 100));
                    return (
                      <div key={contract.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs gap-3">
                          <span className="font-medium text-white truncate flex-1" title={contract.contractorName}>
                            {contract.contractorName}
                          </span>
                          <span className="font-mono text-emerald-400 font-semibold text-right shrink-0">
                            {contract.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                          <div 
                            style={{ width: `${barPercent}%` }}
                            className="bg-sky-500 rounded-full h-full text-right"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Critical Expirations Grid in Red Alerts */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-500 shadow-md">
        <h2 className="text-lg font-display font-medium text-white border-b border-slate-500 pb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-400" />
          Prospecção de Términos {isFilterActive ? "(Vigências no de Intervalo Selecionado)" : "(Vigências nos Próximos 90 Dias)"}
        </h2>
        <div className="mt-4 overflow-x-auto">
          {dynamicExpiring.length === 0 ? (
            <div className="text-center py-8 text-slate-300 font-sans">
              Nenhum contrato ativo se encerrando no período solicitado.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-700 text-sm">
              <thead className="bg-slate-800 flex-auto justify-stretch">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-300">Contrato Nº</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-300">Objeto Detalhado</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-300">Data Término</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-300">Prazo Restante</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-300">Valor Homologado</th>
                  <th scope="col" className="relative px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {dynamicExpiring.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-emerald-400 font-semibold">{c.number}</td>
                    <td className="px-4 py-3 text-slate-300 font-medium max-w-[280px] truncate" title={c.object}>{c.object}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-300">{c.endDate.split('-').reverse().join('/')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        c.daysRemaining < 0 
                          ? 'bg-red-950 text-red-400 border border-red-900/60' 
                          : c.daysRemaining <= 15 
                          ? 'bg-red-950 text-red-405 border border-red-900' 
                          : 'bg-yellow-950 text-yellow-501 border border-yellow-902'
                      }`}>
                        {c.daysRemaining < 0 
                          ? `Vencido há ${Math.abs(c.daysRemaining)} ${Math.abs(c.daysRemaining) === 1 ? 'dia' : 'dias'}` 
                          : `${c.daysRemaining} ${c.daysRemaining === 1 ? 'dia' : 'dias'}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white font-semibold font-mono">
                      {c.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-semibold">
                      <button
                        onClick={() => onSelectContractId(c.id)}
                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 uppercase tracking-wide cursor-pointer text-left"
                      >
                        Visualizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
