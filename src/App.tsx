/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  History, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Search, 
  Send, 
  CheckCircle2, 
  XCircle,
  Car,
  DollarSign,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VEHICLES } from './constants';
import { Vehicle, Negotiation } from './types';

const STORAGE_KEY = 'centro_comercial_negotiations';
const WHATSAPP_STORAGE_KEY = 'centro_comercial_whatsapp';

export default function App() {
  // State
  const [currentVehicles, setCurrentVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<Negotiation[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Load data
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    const savedWhatsapp = localStorage.getItem(WHATSAPP_STORAGE_KEY);
    if (savedWhatsapp) {
      setWhatsappNumber(savedWhatsapp);
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(WHATSAPP_STORAGE_KEY, whatsappNumber);
  }, [whatsappNumber]);

  // Calculations
  const currentTotalTax = useMemo(() => 
    currentVehicles.reduce((sum, v) => sum + v.tax, 0), 
  [currentVehicles]);

  const currentUserProfit = currentTotalTax * 0.5;

  const filteredVehicles = useMemo(() => {
    if (!searchTerm) return [];
    return VEHICLES.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm]);

  // Financial Summary
  const totals = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return history.reduce((acc, neg) => {
      const negDate = new Date(neg.date);
      const negDateStr = negDate.toISOString().split('T')[0];

      acc.total += neg.userProfit;
      acc.commercialTotal += neg.commercialCenterProfit || (neg.totalTax * 0.5);
      
      if (negDateStr === today) {
        acc.today += neg.userProfit;
      }
      
      if (negDate >= startOfWeek) {
        acc.week += neg.userProfit;
      }

      return acc;
    }, { today: 0, week: 0, total: 0, commercialTotal: 0 });
  }, [history]);

  // Handlers
  const addVehicle = (vehicle: Vehicle) => {
    setCurrentVehicles([...currentVehicles, vehicle]);
    setSearchTerm('');
    setShowAutocomplete(false);
  };

  const removeVehicle = (index: number) => {
    setCurrentVehicles(currentVehicles.filter((_, i) => i !== index));
  };

  const registerNegotiation = () => {
    if (currentVehicles.length === 0) return;

    const newNegotiation: Negotiation = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      vehicles: [...currentVehicles],
      totalTax: currentTotalTax,
      userProfit: currentUserProfit,
      commercialCenterProfit: currentTotalTax * 0.5,
    };

    setHistory([newNegotiation, ...history]);
    setCurrentVehicles([]);
  };

  const clearCurrent = () => {
    setCurrentVehicles([]);
  };

  const clearHistory = () => {
    setHistory([]);
    setShowConfirmClear(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const sendToWhatsapp = () => {
    if (!whatsappNumber) {
      alert('Por favor, insira seu número de WhatsApp.');
      return;
    }

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    
    // Generate Report
    const today = new Date().toLocaleDateString('pt-BR');
    let message = `*📊 RELATÓRIO DE NEGOCIAÇÕES CENTRO COMERCIAL - ${today}*\n\n`;
    message += `*Total de Negociações:* ${history.length}\n`;
    message += `*Lucro Total:* ${formatCurrency(totals.total)}\n`;
    message += `*Lucro da Semana:* ${formatCurrency(totals.week)}\n\n`;
    message += `*--- HISTÓRICO RECENTE ---*\n`;
    
    history.slice(0, 5).forEach((neg, idx) => {
      const date = new Date(neg.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const vehicles = neg.vehicles.map(v => v.name).join(', ');
      message += `\n${idx + 1}. ${date}\n🚗 ${vehicles}\n💰 Taxa Total: ${formatCurrency(neg.totalTax)}\n👥 Divisão (2 Clientes): ${formatCurrency(neg.totalTax / 2)}\n💵 Seu Lucro: ${formatCurrency(neg.userProfit)}\n`;
    });

    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-brand-dark/20 border-b border-white/5 py-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2">
              <span className="text-brand-cyan">CENTRO</span> COMERCIAL
            </h1>
            <p className="text-white/50 text-sm font-medium uppercase tracking-widest">Dyamond</p>
          </div>
          
          <div className="flex items-center gap-4 bg-brand-dark/40 p-2 rounded-2xl border border-white/5">
            <div className="px-4 py-2">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Status do Sistema</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_#00D4FF]" />
                <span className="text-xs font-bold text-brand-cyan uppercase">Online & Sincronizado</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Financial Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar size={64} />
            </div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Ganhos Hoje</p>
            <h3 className="text-3xl font-black glow-cyan text-brand-cyan">
              {formatCurrency(totals.today)}
            </h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={64} />
            </div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Ganhos na Semana</p>
            <h3 className="text-3xl font-black glow-cyan text-brand-cyan">
              {formatCurrency(totals.week)}
            </h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={64} />
            </div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Total Acumulado</p>
            <h3 className="text-3xl font-black glow-cyan text-brand-cyan">
              {formatCurrency(totals.total)}
            </h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-premium relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Car size={64} />
            </div>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Centro Comercial</p>
            <h3 className="text-3xl font-black text-white/80">
              {formatCurrency(totals.commercialTotal)}
            </h3>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Negotiation Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Negotiation Form */}
            <section className="card-premium">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-cyan/10 rounded-lg text-brand-cyan">
                  <Car size={20} />
                </div>
                <h2 className="text-xl font-bold">Nova Negociação</h2>
              </div>

              <div className="space-y-6">
                {/* Search / Autocomplete */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input 
                      type="text"
                      placeholder="Buscar veículo (ex: Audi RS5)..."
                      className="w-full bg-brand-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-cyan/50 transition-all"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowAutocomplete(true);
                      }}
                      onFocus={() => setShowAutocomplete(true)}
                    />
                  </div>

                  <AnimatePresence>
                    {showAutocomplete && filteredVehicles.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-brand-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                      >
                        {filteredVehicles.map((v) => (
                          <button
                            key={v.name}
                            onClick={() => addVehicle(v)}
                            className="w-full text-left px-6 py-4 hover:bg-brand-cyan/10 flex justify-between items-center transition-colors border-b border-white/5 last:border-0"
                          >
                            <div>
                              <p className="font-bold text-white">{v.name}</p>
                              <p className="text-xs text-white/40">Valor: {formatCurrency(v.price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-brand-cyan font-bold">+{formatCurrency(v.tax)}</p>
                              <p className="text-[10px] text-white/30 uppercase font-bold">Taxa</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Selected Vehicles List */}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {currentVehicles.map((v, idx) => (
                      <motion.div 
                        key={`${v.name}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-dark rounded-lg flex items-center justify-center text-white/50">
                            <Car size={20} />
                          </div>
                          <div>
                            <p className="font-bold">{v.name}</p>
                            <p className="text-xs text-white/40">Valor: {formatCurrency(v.price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-brand-cyan font-bold">{formatCurrency(v.tax)}</p>
                            <p className="text-[10px] text-white/30 uppercase font-bold">Taxa</p>
                          </div>
                          <button 
                            onClick={() => removeVehicle(idx)}
                            className="p-2 text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {currentVehicles.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                      <p className="text-white/20 font-medium">Nenhum veículo selecionado</p>
                    </div>
                  )}
                </div>

                {/* Summary & Actions */}
                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full md:w-auto">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Taxa Total</p>
                      <p className="text-lg font-bold">{formatCurrency(currentTotalTax)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Divisão (2 Clientes)</p>
                      <p className="text-lg font-bold text-white/80">{formatCurrency(currentTotalTax / 2)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Centro Comercial (50%)</p>
                      <p className="text-lg font-bold text-white/80">{formatCurrency(currentTotalTax * 0.5)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-cyan uppercase font-black tracking-widest mb-1">Seu Lucro (50%)</p>
                      <p className="text-xl font-black text-brand-cyan glow-cyan">{formatCurrency(currentUserProfit)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button 
                      onClick={clearCurrent}
                      className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      Limpar
                    </button>
                    <button 
                      onClick={registerNegotiation}
                      disabled={currentVehicles.length === 0}
                      className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 size={18} />
                      Negociação Realizada
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* History Section */}
            <section className="card-premium">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-cyan/10 rounded-lg text-brand-cyan">
                    <History size={20} />
                  </div>
                  <h2 className="text-xl font-bold">Histórico de Negociações</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <span className="text-xs font-bold text-white/50">{history.length} Negociações Feitas</span>
                  </div>
                  
                  {history.length > 0 && (
                    <div className="relative">
                      {!showConfirmClear ? (
                        <button 
                          onClick={() => setShowConfirmClear(true)}
                          className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                          title="Limpar Histórico"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-1 animate-in fade-in zoom-in duration-200">
                          <span className="text-[10px] font-bold text-red-400 px-2 uppercase tracking-tighter">Apagar tudo?</span>
                          <button 
                            onClick={clearHistory}
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button 
                            onClick={() => setShowConfirmClear(false)}
                            className="p-1 bg-white/10 text-white/60 rounded hover:bg-white/20 transition-colors"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/30">Data / Hora</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/30">Veículos</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/30">Taxa Total</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/30">Centro Comercial</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Seu Lucro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((neg) => (
                      <tr key={neg.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="py-4">
                          <div className="flex items-center gap-2 text-white/60">
                            <Clock size={14} />
                            <span className="text-sm">
                              {new Date(neg.date).toLocaleDateString('pt-BR')}
                              <span className="ml-2 text-white/30">{new Date(neg.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-1">
                            {neg.vehicles.map((v, i) => (
                              <span key={i} className="text-xs bg-brand-dark px-2 py-1 rounded-md border border-white/5 text-white/80">
                                {v.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-sm font-medium text-white/80">{formatCurrency(neg.totalTax)}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm font-medium text-white/40">{formatCurrency(neg.commercialCenterProfit || (neg.totalTax * 0.5))}</span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="text-sm font-black text-brand-cyan">{formatCurrency(neg.userProfit)}</span>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-white/20 italic">
                          Nenhuma negociação registrada ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar / Export */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* WhatsApp Export */}
            <section className="card-premium border-brand-cyan/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Send size={20} />
                </div>
                <h2 className="text-xl font-bold">Exportar Extrato</h2>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-white/50 leading-relaxed">
                  Gere um relatório completo das suas negociações e envie diretamente para o seu WhatsApp.
                </p>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Seu WhatsApp</label>
                  <input 
                    type="text"
                    placeholder="Ex: 5511999999999"
                    className="w-full bg-brand-black/50 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-brand-cyan/50 transition-all text-sm"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>

                <button 
                  onClick={sendToWhatsapp}
                  className="w-full bg-green-500 text-brand-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  <Send size={18} />
                  Enviar para WhatsApp
                </button>
              </div>
            </section>

            {/* Quick Stats */}
            <section className="card-premium">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/40 mb-6">Resumo de Atividade</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                      <DollarSign size={16} />
                    </div>
                    <span className="text-sm text-white/70">Média por Negoc.</span>
                  </div>
                  <span className="font-bold">
                    {history.length > 0 ? formatCurrency(totals.total / history.length) : 'R$ 0,00'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                      <Car size={16} />
                    </div>
                    <span className="text-sm text-white/70">Veículos Vendidos</span>
                  </div>
                  <span className="font-bold">
                    {history.reduce((acc, neg) => acc + neg.vehicles.length, 0)}
                  </span>
                </div>

                <div className="p-4 bg-brand-cyan/5 rounded-xl border border-brand-cyan/10 mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-cyan mb-2">Dica de Performance</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Mantenha seu histórico atualizado diariamente para um controle financeiro preciso do seu desempenho no Centro Comercial.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5 text-center flex flex-col gap-2">
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">
          CENTRO COMERCIAL &copy; 2026 - Sistema de Gestão Premium
        </p>
        <p className="text-white/80 text-sm font-bold uppercase tracking-widest mt-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
          Site desenvolvido por Kauan Silva
        </p>
      </footer>
    </div>
  );
}
