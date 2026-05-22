/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Key, User as UserIcon, RefreshCw, AlertTriangle, Info, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  
  // Recovery form state
  const [recoverUsername, setRecoverUsername] = useState('');
  const [recoverCpf, setRecoverCpf] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState('');
  const [recoverError, setRecoverError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, informe seu usuário militar e senha física.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Falha na autenticação militar local.');
      }
      
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Erro de comunicação offline com o servidor administrativo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverUsername || !recoverCpf) {
      setRecoverError('Preencha seu usuário militar e CPF de auditoria.');
      return;
    }

    setRecoverError('');
    setRecoverSuccess('');
    
    try {
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: recoverUsername, cpf: recoverCpf })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Auditoria militar de CPF não localizada.');
      }
      
      setRecoverSuccess(data.message);
    } catch (err: any) {
      setRecoverError(err.message || 'Erro na verificação dos registros locais.');
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-900 flex flex-col justify-center py-2 sm:py-4 sm:px-6 lg:px-8 relative" id="login-container">
      {/* Decorative military background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a1e_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-950/20 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-950/40 rounded-full filter blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Emblem or Shield */}
        <div className="flex justify-center">
          <div className="w-18 h-18 sm:w-22 sm:h-22 flex items-center justify-center p-1">
            <img src="/logo.png" alt="71º BI Mtz Logo" className="w-full h-full object-contain filter drop-shadow-md" />
          </div>
        </div>
        
        <h2 className="mt-2 text-center text-2xl sm:text-3xl font-display font-medium tracking-tight text-white antialiased">
          CONTRATOS - 71º BI Mtz
        </h2>
        <p className="mt-0.5 text-center text-xs sm:text-sm font-sans text-emerald-400 font-medium tracking-wide uppercase">
          71º Batalhão de Infantaria Motorizado
        </p>
        <p className="mt-0.5 text-center text-[10px] sm:text-xs font-mono text-slate-400">
          Batalhão Duarte Coelho
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-800/90 border border-slate-700/80 backdrop-blur-md py-4 px-6 shadow-2xl rounded-xl sm:px-10" id="login-card">
          {!showRecover ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-base font-medium font-display text-white border-b border-slate-700 pb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Autenticação de Segurança
              </h3>

              {error && (
                <div className="p-2.5 bg-red-950/80 border border-red-750 text-red-200 text-xs rounded-lg flex items-start gap-2 animate-shake">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-medium font-sans uppercase tracking-wider text-slate-300">
                  Usuário
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: admin ou sgt_silva"
                    className="block w-full pl-9 pr-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs font-sans transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium font-sans uppercase tracking-wider text-slate-300">
                  Senha
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className="block w-full pl-9 pr-9 py-2 border border-slate-700 bg-slate-900 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs font-sans transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center text-slate-400 font-mono gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80"></span>
                  Conexão Offline Segura
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecover(true);
                    setError('');
                  }}
                  className="font-medium text-emerald-400 hover:text-emerald-350 transition-colors uppercase tracking-wide focus:outline-none"
                >
                  Recuperar Senha
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-emerald-500 rounded-lg shadow-sm text-xs font-semibold font-display tracking-widest text-white uppercase bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
                  id="btn-entrar"
                >
                  {loading ? (
                    <RefreshCw className="h-4.5 w-4.5 animate-spin text-white" />
                  ) : (
                    'Entrar na Plataforma'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRecover} className="space-y-4">
              <h3 className="text-base font-medium font-display text-white border-b border-slate-700 pb-2 flex items-center gap-2">
                <RefreshCw className="h-4.5 w-4.5 text-emerald-400" />
                Recuperação Administrativa
              </h3>

              {recoverError && (
                <div className="p-2.5 bg-red-950/80 border border-red-750 text-red-200 text-xs rounded-lg">
                  {recoverError}
                </div>
              )}

              {recoverSuccess && (
                <div className="p-3 bg-emerald-950/90 border border-emerald-600 text-emerald-100 text-xs rounded-lg leading-relaxed">
                  <p className="font-semibold text-white mb-0.5">Registro Encontrado!</p>
                  <p>{recoverSuccess}</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-medium font-sans uppercase tracking-wider text-slate-300">
                  Usuário
                </label>
                <input
                  type="text"
                  required
                  value={recoverUsername}
                  onChange={(e) => setRecoverUsername(e.target.value)}
                  placeholder="Ex: sgt_silva"
                  className="mt-1 block w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium font-sans uppercase tracking-wider text-slate-300">
                  CPF
                </label>
                <input
                  type="text"
                  required
                  value={recoverCpf}
                  onChange={(e) => setRecoverCpf(e.target.value)}
                  placeholder="Ex: 111.222.333-44"
                  className="mt-1 block w-full px-3 py-2 border border-slate-700 bg-slate-900 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs text-center font-mono"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecover(false);
                    setRecoverError('');
                    setRecoverSuccess('');
                  }}
                  className="text-[10px] font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider text-left"
                >
                  Voltar para o Login
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 border border-emerald-500 rounded-lg text-xs font-semibold font-display tracking-wider text-white uppercase bg-emerald-850 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Auditar e Recuperar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      <p className="mt-3 text-center text-[10px] sm:text-xs text-slate-500 font-mono leading-relaxed">
        Direitos Autorais Reservados &copy; 2026 71º BI Mtz &bull; Desenvolvido por 1º Sgt Gaudencio
      </p>
    </div>
  );
}
