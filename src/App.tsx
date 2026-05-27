/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

// Global variables injected by Vite based on git state
declare const __APP_VERSION__: string;
declare const __GIT_HASH__: string;
declare const __GIT_DATE__: string;
import { 
  Shield, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Users, 
  Activity, 
  Database, 
  Download, 
  RefreshCw, 
  LogOut, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Eye, 
  Paperclip, 
  UserPlus, 
  Check, 
  X,
  FileSpreadsheet,
  Printer,
  Info,
  Calendar,
  Lock,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { 
  User, 
  Contract, 
  Fiscal, 
  Notification, 
  SystemLog, 
  BackupInfo, 
  ContractStatus,
  PostoGraduacao
} from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'fiscais' | 'admins' | 'reports' | 'logs' | 'backups'>('dashboard');
  const [loading, setLoading] = useState(true);

  // Core system collections
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [fiscais, setFiscais] = useState<Fiscal[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Feedback notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Transition and Loading Animation States
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [transitionMessage, setTransitionMessage] = useState('');

  // Contracts Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFiscal, setFilterFiscal] = useState<string>('all');
  
  // Sorting & Pagination States
  const [sortContractsBy, setSortContractsBy] = useState('number');
  const [sortContractsOrder, setSortContractsOrder] = useState<'asc' | 'desc'>('asc');
  const [contractsPerPage, setContractsPerPage] = useState<number | 'all'>('all');
  const [contractsPage, setContractsPage] = useState(1);

  const [sortFiscaisBy, setSortFiscaisBy] = useState('name');
  const [sortFiscaisOrder, setSortFiscaisOrder] = useState<'asc' | 'desc'>('asc');
  const [fiscaisPerPage, setFiscaisPerPage] = useState<number | 'all'>('all');
  const [fiscaisPage, setFiscaisPage] = useState(1);
  
  // Modals / Form States
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editingObsIndex, setEditingObsIndex] = useState<number | null>(null);
  const [editingObsText, setEditingObsText] = useState('');
  
  // Fiscal Form modal state
  const [isFiscalModalOpen, setIsFiscalModalOpen] = useState(false);
  const [editingFiscal, setEditingFiscal] = useState<Fiscal | null>(null);

  // Admin Form modal state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  // New Contract Form State
  const [contractForm, setContractForm] = useState({
    number: '',
    object: '',
    contractorName: '',
    cnpj: '',
    value: 0,
    startDate: '',
    endDate: '',
    fiscalTitularId: '',
    fiscalSubstitutoId: '',
    observations: '',
    selectedFiles: [] as Array<{ name: string; size: string; content: string }>
  });

  // New Fiscal Form State
  const [fiscalForm, setFiscalForm] = useState({
    name: '',
    postoGraduacao: '3º Sgt' as PostoGraduacao,
    warName: '',
    cpf: '',
    email: '',
    phone: '',
    role: 'titular' as 'titular' | 'substituto' | 'ambos',
    status: 'ativo' as 'ativo' | 'inativo'
  });

  // New Admin Form State
  const [adminForm, setAdminForm] = useState({
    name: '',
    username: '',
    cpf: '',
    precCp: '',
    email: '',
    phone: '',
    identity: '',
    warName: '',
    rank: '',
    password: '',
    active: true,
    role: 'admin' as 'admin' | 'fiscal'
  });

  // Report Form Query
  const [reportType, setReportType] = useState<
    | 'ativos'
    | 'vencidos'
    | 'por_fiscal'
    | 'proximos_vencimentos'
    | 'logs'
    | 'efetivo_fiscais'
    | 'usuarios_sistema'
    | 'designacao_fiscais'
  >('ativos');
  const [reportFiscalId, setReportFiscalId] = useState<string>('all');
  const [reportDaysOut, setReportDaysOut] = useState<string>('90');

  // Masks
  const formatCPF = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length <= 3) return v;
    if (v.length <= 6) return `${v.slice(0,3)}.${v.slice(3)}`;
    if (v.length <= 9) return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
    return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9,11)}`;
  };

  const formatCpfCnpj = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length <= 11) {
      if (v.length <= 3) return v;
      if (v.length <= 6) return `${v.slice(0,3)}.${v.slice(3)}`;
      if (v.length <= 9) return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`;
      return `${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9,11)}`;
    } else {
      if (v.length <= 12) return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8)}`;
      return `${v.slice(0,2)}.${v.slice(2,5)}.${v.slice(5,8)}/${v.slice(8,12)}-${v.slice(12,14)}`;
    }
  };

  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (!v) return '';
    if (v.length <= 2) return `(${v}`;
    if (v.length <= 6) return `(${v.slice(0,2)}) ${v.slice(2)}`;
    if (v.length <= 10) return `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
    return `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7,11)}`;
  };

  // Apply theme to DOM
  const applyTheme = (themeName: string) => {
    const root = document.documentElement;
    if (themeName === 'blue') {
      root.style.setProperty('--theme-350', '#7dd3fc');
      root.style.setProperty('--theme-400', '#38bdf8');
      root.style.setProperty('--theme-450', '#0ea5e9');
      root.style.setProperty('--theme-500', '#0284c7');
      root.style.setProperty('--theme-600', '#0369a1');
      root.style.setProperty('--theme-700', '#075985');
      root.style.setProperty('--theme-800', '#0c4a6e');
      root.style.setProperty('--theme-900', '#082f49');
      root.style.setProperty('--theme-950', '#041e30');
    } else if (themeName === 'slate') {
      root.style.setProperty('--theme-350', '#94a3b8');
      root.style.setProperty('--theme-400', '#64748b');
      root.style.setProperty('--theme-450', '#475569');
      root.style.setProperty('--theme-500', '#334155');
      root.style.setProperty('--theme-600', '#1e293b');
      root.style.setProperty('--theme-700', '#0f172a');
      root.style.setProperty('--theme-800', '#020617');
      root.style.setProperty('--theme-900', '#000000');
      root.style.setProperty('--theme-950', '#000000');
    } else {
      // Default emerald
      root.style.removeProperty('--theme-350');
      root.style.removeProperty('--theme-400');
      root.style.removeProperty('--theme-450');
      root.style.removeProperty('--theme-500');
      root.style.removeProperty('--theme-600');
      root.style.removeProperty('--theme-700');
      root.style.removeProperty('--theme-800');
      root.style.removeProperty('--theme-900');
      root.style.removeProperty('--theme-950');
    }
  };

  // File system upload input reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Attempt local storage session re-connection
    const storedUser = localStorage.getItem('71bi_session_user');
    const loginTimeStr = localStorage.getItem('71bi_session_login_time');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 'admin' && loginTimeStr) {
          const loginTime = parseInt(loginTimeStr, 10);
          const elapsed = Math.floor((Date.now() - loginTime) / 1000);
          if (elapsed >= 1200) {
            localStorage.removeItem('71bi_session_user');
            localStorage.removeItem('71bi_session_login_time');
          } else {
            setCurrentUser(user);
          }
        } else {
          setCurrentUser(user);
        }
      } catch (e) {
        localStorage.removeItem('71bi_session_user');
        localStorage.removeItem('71bi_session_login_time');
      }
    }
    setLoading(false);
  }, []);

  // Effect to simulate security database decryption and loading upon login success
  useEffect(() => {
    if (!isTransitioning || !tempUser) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setTransitionProgress(Math.min(progress, 100));

      if (progress < 25) {
        setTransitionMessage('Autenticando credenciais criptografadas...');
      } else if (progress < 50) {
        setTransitionMessage('Carregando registros do banco SQLite local...');
      } else if (progress < 75) {
        setTransitionMessage('Decodificando anexos e contratos administrativos...');
      } else if (progress < 95) {
        setTransitionMessage('Verificando chaves de integridade offline...');
      } else {
        setTransitionMessage('Acesso concedido. Inicializando painel...');
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentUser(tempUser);
          setIsTransitioning(false);
          setTempUser(null);
          
          setActiveTab('dashboard');
          localStorage.setItem('71bi_session_user', JSON.stringify(tempUser));
          if (tempUser.role === 'admin') {
            localStorage.setItem('71bi_session_login_time', Date.now().toString());
          } else {
            localStorage.removeItem('71bi_session_login_time');
          }
          showToast(`Bem-vindo, ${tempUser.name}! Nível operacional: ${tempUser.role.toUpperCase()}`, 'success');
        }, 200);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isTransitioning, tempUser]);

  // Fetch all database records when user state is unlocked
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  // Effect to hide scrollbar on body during login or transition screens
  useEffect(() => {
    if (!currentUser || isTransitioning) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [currentUser, isTransitioning]);

  // Administrador Security Session Timers: 3 min inactivity, 20 min max duration
  const [idleCountdown, setIdleCountdown] = useState<number>(180);
  const [sessionCountdown, setSessionCountdown] = useState<number>(1200);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      return;
    }

    const loginTimeStr = localStorage.getItem('71bi_session_login_time');
    let initialSessionTime = 1200;
    if (loginTimeStr) {
      const loginTime = parseInt(loginTimeStr, 10);
      const elapsed = Math.floor((Date.now() - loginTime) / 1000);
      initialSessionTime = Math.max(0, 1200 - elapsed);
    } else {
      localStorage.setItem('71bi_session_login_time', Date.now().toString());
    }

    setIdleCountdown(180);
    setSessionCountdown(initialSessionTime);

    const handleActivity = () => {
      setIdleCountdown(180);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    const triggerAutoLogout = async (reason: string) => {
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: currentUser.rank && currentUser.warName ? `${currentUser.rank} ${currentUser.warName}` : currentUser.name,
            role: currentUser.role,
            action: 'LOGOUT_SEGURANCA',
            detail: reason
          })
        });
      } catch (err) {
        // ignore
      }
      setCurrentUser(null);
      setActiveTab('dashboard');
      localStorage.removeItem('71bi_session_user');
      localStorage.removeItem('71bi_session_login_time');
      showToast(`Segurança: ${reason}`, 'error');
    };

    const interval = setInterval(() => {
      setIdleCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerAutoLogout('Sessão encerrada por inatividade (3 minutos).');
          return 0;
        }
        return prev - 1;
      });

      setSessionCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          triggerAutoLogout('Tempo máximo de login atingido (20 minutos).');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [currentUser]);

  const abreviarPosto = (posto?: string): string => {
    if (!posto) return '';
    const map: Record<string, string> = {
      // Full name -> abbreviated
      'CORONEL': 'Cel', 'Coronel': 'Cel',
      'TENENTE-CORONEL': 'TC', 'Tenente-Coronel': 'TC', 'TENENTE CORONEL': 'TC',
      'MAJOR': 'Maj', 'Major': 'Maj',
      'CAPITAO': 'Cap', 'CAPITÃO': 'Cap', 'Capitão': 'Cap',
      'PRIMEIRO-TENENTE': '1º Ten', 'PRIMEIRO TENENTE': '1º Ten', '1º TENENTE': '1º Ten', '1º Tenente': '1º Ten',
      'SEGUNDO-TENENTE': '2º Ten', 'SEGUNDO TENENTE': '2º Ten', '2º TENENTE': '2º Ten', '2º Tenente': '2º Ten',
      'ASPIRANTE A OFICIAL': 'Asp', 'Aspirante a Oficial': 'Asp',
      'SUBTENENTE': 'Subten', 'Subtenente': 'Subten',
      'PRIMEIRO-SARGENTO': '1º Sgt', 'PRIMEIRO SARGENTO': '1º Sgt', '1º SARGENTO': '1º Sgt', '1º Sargento': '1º Sgt',
      'SEGUNDO-SARGENTO': '2º Sgt', 'SEGUNDO SARGENTO': '2º Sgt', '2º SARGENTO': '2º Sgt', '2º Sargento': '2º Sgt',
      'TERCEIRO-SARGENTO': '3º Sgt', 'TERCEIRO SARGENTO': '3º Sgt', '3º SARGENTO': '3º Sgt', '3º Sargento': '3º Sgt',
      'CABO': 'Cb', 'Cabo': 'Cb',
      'SOLDADO': 'Sd', 'Soldado': 'Sd',
      'SERVIDOR CIVIL': 'Sv Civ', 'Servidor Civil': 'Sv Civ',
      'GENERAL DE EXÉRCITO': 'Gen Ex', 'General de Exército': 'Gen Ex',
      'GENERAL DE DIVISÃO': 'Gen Div', 'General de Divisão': 'Gen Div',
      'GENERAL DE BRIGADA': 'Gen Bda', 'General de Brigada': 'Gen Bda',
    };
    return map[posto.trim()] ?? map[posto.toUpperCase().trim()] ?? posto;
  };

  const fetchAllData = async () => {
    try {
      const t = Date.now();
      const [resContracts, resFiscais, resAdmins, resDashboard, resLogs, resBackups] = await Promise.all([
        fetch(`/api/contracts?t=${t}`),
        fetch(`/api/fiscais?t=${t}`),
        fetch(`/api/users?t=${t}`),
        fetch(`/api/dashboard?t=${t}`),
        fetch(`/api/logs?t=${t}`),
        fetch(`/api/backups?t=${t}`)
      ]);

      if (resContracts.ok) {
        const data = await resContracts.json();
        setContracts(data);
        setSelectedContract(prev => {
          if (!prev) return null;
          const updated = data.find((c: any) => c.id === prev.id);
          return updated || null;
        });
      }
      if (resFiscais.ok) setFiscais(await resFiscais.json());
      if (resAdmins.ok) {
        const allUsers = await resAdmins.json();
        setAdmins(allUsers.filter((u: any) => u.role === 'admin' || u.role === 'gestor'));
      }
      if (resDashboard.ok) setDashboardData(await resDashboard.json());
      if (resLogs.ok) setLogs(await resLogs.json());
      if (resBackups.ok) setBackups(await resBackups.json());
    } catch (err) {
      showToast('Erro ao obter dados consolidados do servidor offline.', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    
    // Play sound alert
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        if (type === 'error') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'success') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(500, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }
      }
    } catch (e) {
      // Ignore audio errors (e.g., if browser blocks autoplay before user interaction)
    }

    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleLoginSuccess = (user: User) => {
    setTempUser(user);
    setIsTransitioning(true);
    setTransitionProgress(0);
    setTransitionMessage('Autenticando credenciais criptografadas...');
  };

  const handleLogout = async () => {
    if (currentUser) {
      // Log logout operation audit
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: currentUser.rank && currentUser.warName ? `${currentUser.rank} ${currentUser.warName}` : currentUser.name,
            role: currentUser.role,
            action: 'LOGOUT_VOLUNTARIO',
            detail: 'Sessão encerrada voluntariamente pelo usuário.'
          })
        });
      } catch (err) {
        // ignore
      }
      setCurrentUser(null);
      setActiveTab('dashboard');
      localStorage.removeItem('71bi_session_user');
      localStorage.removeItem('71bi_session_login_time');
      showToast('Sessão encerrada com conformidade militar.', 'info');
    }
  };

  // --- CONTRACT MANAGEMENT HANDLERS ---
  const handleOpenContractModal = (contract?: Contract) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
      showToast('Apenas administradores e gestores de contratos possuem outorga de criação/edição.', 'error');
      return;
    }

    if (contract) {
      setEditingContract(contract);
      setContractForm({
        number: contract.number,
        object: contract.object,
        contractorName: contract.contractorName,
        cnpj: contract.cnpj,
        value: contract.value,
        startDate: contract.startDate,
        endDate: contract.endDate,
        fiscalTitularId: contract.fiscalTitularId,
        fiscalSubstitutoId: contract.fiscalSubstitutoId,
        observations: contract.observations,
        selectedFiles: []
      });
    } else {
      setEditingContract(null);
      setContractForm({
        number: '',
        object: '',
        contractorName: '',
        cnpj: '',
        value: 0,
        startDate: '',
        endDate: '',
        termMonths: 12,
        fiscalTitularId: '',
        fiscalSubstitutoId: '',
        observations: '',
        status: 'ativo',
        selectedFiles: []
      });
    }
    setIsContractModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf') {
        showToast('Apenas arquivos PDF digitalizados são aceitos para segurança de auditoria.', 'error');
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Content = (event.target.result as string).split(',')[1];
          setContractForm(prev => ({
            ...prev,
            selectedFiles: [
              ...prev.selectedFiles,
              {
                name: file.name,
                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                content: base64Content
              }
            ]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.number || !contractForm.object || !contractForm.contractorName) {
      showToast('Preencha todos os campos contratuais elementares.', 'error');
      return;
    }

    try {
      const payload = {
        ...contractForm,
        documents: contractForm.selectedFiles,
        auditorUser: currentUser?.username || 'admin',
        auditorRole: currentUser?.role || 'admin'
      };

      let response;
      if (editingContract) {
        response = await fetch(`/api/contracts/${editingContract.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        showToast(editingContract ? 'Cadastro contratual militar atualizado!' : 'Novo contrato homologado com sucesso.', 'success');
        setIsContractModalOpen(false);
        fetchAllData();
      } else {
        const err = await response.json();
        showToast(err.error || 'Erro ao registrar contrato.', 'error');
      }
    } catch (err) {
      showToast('Erro de conexao local física.', 'error');
    }
  };

  const handleDeleteContract = async (id: string, number: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
      showToast('Apenas administradores e gestores podem excluir contratos.', 'error');
      return;
    }

    if (!confirm(`Deseja EXCLUIR permanentemente o contrato administrativo nº ${number}? Esta operação é gravada em logs.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/contracts/${id}?auditorUser=${currentUser.username}&auditorRole=${currentUser.role}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast(`Contrato ${number} excluído do acervo.`, 'success');
        if (selectedContract?.id === id) {
          setSelectedContract(null);
        }
        fetchAllData();
      } else {
        const err = await response.json();
        showToast(err.error || 'Erro ao deletar contrato.', 'error');
      }
    } catch (err) {
      showToast('Falha na comunicação de exclusão.', 'error');
    }
  };

  // --- FISCAIS HANDLERS ---
  const handleOpenFiscalModal = (fiscal?: Fiscal) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
      showToast('Apenas administradores e gestores podem gerenciar perfis de fiscais.', 'error');
      return;
    }

    if (fiscal) {
      setEditingFiscal(fiscal);
      setFiscalForm({
        name: fiscal.name,
        postoGraduacao: fiscal.postoGraduacao,
        warName: fiscal.warName || '',
        cpf: fiscal.cpf,
        email: fiscal.email,
        phone: fiscal.phone,
        role: fiscal.role,
        status: fiscal.status
      });
    } else {
      setEditingFiscal(null);
      setFiscalForm({
        name: '',
        postoGraduacao: '3º Sgt',
        warName: '',
        cpf: '',
        email: '',
        phone: '',
        role: 'titular',
        status: 'ativo'
      });
    }
    setIsFiscalModalOpen(true);
  };

  const handleSaveFiscal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiscalForm.name || !fiscalForm.cpf || !fiscalForm.email) {
      showToast('Informe os dados cadastrais obrigatórios.', 'error');
      return;
    }

    try {
      const payload = {
        ...fiscalForm,
        auditorUser: currentUser?.username || 'admin',
        auditorRole: currentUser?.role || 'admin'
      };

      let response;
      if (editingFiscal) {
        response = await fetch(`/api/fiscais/${editingFiscal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/fiscais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        showToast(editingFiscal ? 'Dados do fiscal militar atualizados.' : 'Novo fiscal militar e credencial de login ativados.', 'success');
        setIsFiscalModalOpen(false);
        fetchAllData();
      } else {
        const err = await response.json();
        showToast(err.error || 'Erro ao registrar fiscal.', 'error');
      }
    } catch (err) {
      showToast('Falha na comunicação offline.', 'error');
    }
  };

  const handleDeleteFiscal = async (id: string, name: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
      showToast('Apenas administradores e gestores podem remover fiscais.', 'error');
      return;
    }

    if (!confirm(`Confirma a exclusão do cadastro do fiscal militar: ${name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/fiscais/${id}?auditorUser=${currentUser.username}&auditorRole=${currentUser.role}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Fiscal militar removido com conformidade.', 'success');
        fetchAllData();
      } else {
        const err = await response.json();
        showToast(err.error || 'Não foi possível excluir o militar fiscal.', 'error');
      }
    } catch (err) {
      showToast('Erro de transmissão local.', 'error');
    }
  };

  // --- ADMIN MANAGEMENT HANDLERS ---
  const handleOpenAdminModal = (admin?: any) => {
    if (admin) {
      setEditingAdmin(admin);
      setAdminForm({
        name: admin.name || '',
        username: admin.username || '',
        cpf: admin.cpf || '',
        precCp: admin.precCp || '',
        email: admin.email || '',
        phone: admin.phone || '',
        identity: admin.identity || '',
        warName: admin.warName || '',
        rank: abreviarPosto(admin.rank) || '',
        password: '',
        active: admin.active !== false,
        role: admin.role || 'admin'
      });
    } else {
      setEditingAdmin(null);
      setAdminForm({
        name: '',
        username: '',
        cpf: '',
        precCp: '',
        email: '',
        phone: '',
        identity: '',
        warName: '',
        rank: '',
        password: '',
        active: true,
        role: 'admin'
      });
    }
    setIsAdminModalOpen(true);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !adminForm.name || 
      !adminForm.username || 
      !adminForm.cpf || 
      !adminForm.rank || 
      !adminForm.warName || 
      !adminForm.precCp || 
      !adminForm.identity || 
      !adminForm.email || 
      !adminForm.phone || 
      !adminForm.role
    ) {
      showToast('Todos os campos são obrigatórios.', 'error');
      return;
    }
    if (!editingAdmin && !adminForm.password) {
      showToast('A senha é obrigatória para um novo usuário.', 'error');
      return;
    }

    try {
      const payload = {
        ...adminForm
      };

      let response;
      if (editingAdmin) {
        response = await fetch(`/api/users/${editingAdmin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        showToast(editingAdmin ? 'Administrador atualizado.' : 'Novo administrador criado com sucesso.', 'success');
        setIsAdminModalOpen(false);
        fetchAllData();
      } else {
        const err = await response.json();
        showToast(err.error || 'Erro ao registrar administrador.', 'error');
      }
    } catch (err) {
      showToast('Falha na comunicação offline.', 'error');
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (currentUser?.id === id || currentUser?.username === name) {
      showToast('Você não pode excluir sua própria conta de administrador.', 'error');
      return;
    }

    if (!confirm(`Confirma a exclusão do administrador: ${name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Administrador removido com sucesso.', 'success');
        fetchAllData();
      } else {
        const err = await response.json();
        showToast(err.error || 'Não foi possível excluir o administrador.', 'error');
      }
    } catch (err) {
      showToast('Erro de transmissão local.', 'error');
    }
  };

  // Fiscal update contract notes/occurrence (When logged in as a Fiscal)
  const [fiscalOcorrenciaNote, setFiscalOcorrenciaNote] = useState('');
  const handleFiscalOccurrenceSubmit = async (contractId: string) => {
    if (!fiscalOcorrenciaNote.trim()) {
      showToast('Preencha a descrição do acompanhamento ou ocorrência.', 'error');
      return;
    }

    try {
      const currentContract = contracts.find(c => c.id === contractId);
      if (!currentContract) return;

      const updatedHistory = [...currentContract.history];
      
      const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const payload = {
        ...currentContract,
        auditorUser: currentUser?.name || 'Fiscal de Contrato',
        auditorRole: 'fiscal',
        observations: currentContract.observations + `\n\n[Ocorrência em ${todayStr} por ${currentUser?.name}]: ` + fiscalOcorrenciaNote
      };

      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('Ocorrência militar inserida com registro de autoria.', 'success');
        setFiscalOcorrenciaNote('');
        const refreshed = await response.json();
        setSelectedContract(refreshed);
        await fetchAllData();
      } else {
        showToast('Erro ao atualizar observações do fiscal.', 'error');
      }
    } catch (e) {
      showToast('Falha local ao salvar acompanhamento.', 'error');
    }
  };

  const handleSaveEditObservation = async (index: number) => {
    if (!selectedContract) return;
    if (!editingObsText.trim()) {
      showToast('A observação não pode estar vazia.', 'error');
      return;
    }

    try {
      const observationBlocks = selectedContract.observations
        ? selectedContract.observations.split('\n\n').filter(block => block.trim() !== '')
        : [];
      
      if (index < 0 || index >= observationBlocks.length) return;

      const originalValue = observationBlocks[index];
      observationBlocks[index] = editingObsText.trim();
      const newObservations = observationBlocks.join('\n\n');

      const payload = {
        ...selectedContract,
        auditorUser: currentUser?.name || 'Gestor de Contrato',
        auditorRole: currentUser?.role || 'gestor',
        observations: newObservations,
        _newHistoryAction: {
          action: 'Edição de Observação',
          detail: `Observação editada: "${originalValue.substring(0, 30)}..." alterada para "${editingObsText.trim().substring(0, 30)}..."`
        }
      };

      const response = await fetch(`/api/contracts/${selectedContract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('Observação atualizada com sucesso.', 'success');
        setEditingObsIndex(null);
        setEditingObsText('');
        const refreshed = await response.json();
        setSelectedContract(refreshed);
        await fetchAllData();
      } else {
        showToast('Erro ao salvar a observação modificada.', 'error');
      }
    } catch (e) {
      showToast('Falha local ao salvar a observação modificada.', 'error');
    }
  };

  const handleDeleteObservation = async (index: number) => {
    if (!selectedContract) return;
    if (!window.confirm('Tem certeza que deseja excluir esta observação/ocorrência?')) {
      return;
    }

    try {
      const observationBlocks = selectedContract.observations
        ? selectedContract.observations.split('\n\n').filter(block => block.trim() !== '')
        : [];
      
      if (index < 0 || index >= observationBlocks.length) return;

      const deletedValue = observationBlocks[index];
      observationBlocks.splice(index, 1);
      const newObservations = observationBlocks.join('\n\n');

      const payload = {
        ...selectedContract,
        auditorUser: currentUser?.name || 'Gestor de Contrato',
        auditorRole: currentUser?.role || 'gestor',
        observations: newObservations,
        _newHistoryAction: {
          action: 'Exclusão de Observação',
          detail: `Observação excluída: "${deletedValue.substring(0, 60)}..."`
        }
      };

      const response = await fetch(`/api/contracts/${selectedContract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('Observação excluída com sucesso.', 'success');
        const refreshed = await response.json();
        setSelectedContract(refreshed);
        await fetchAllData();
      } else {
        showToast('Erro ao excluir a observação.', 'error');
      }
    } catch (e) {
      showToast('Falha local ao excluir a observação.', 'error');
    }
  };

  const handleGenerateBackup = async () => {
    try {
      const response = await fetch('/api/backups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditorUser: currentUser?.username || 'admin',
          auditorRole: currentUser?.role || 'admin',
          type: 'manual'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const now = new Date().toLocaleString('pt-BR');
        showToast(`Backup gerado em ${now}. ${data.message}`, 'success');
        fetchAllData();
      } else {
        showToast('Não foi possível gerar backup no disco rígido.', 'error');
      }
    } catch (err) {
      showToast('Falha na criação de backup seguro.', 'error');
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (currentUser?.role !== 'admin') {
      showToast('Nível de acesso inadequado para alteração estrutural.', 'error');
      return;
    }

    if (!confirm(`Atenção: A restauração do backup "${filename}" substituirá todos os dados correntes da console. Confirma?`)) {
      return;
    }

    try {
      const response = await fetch('/api/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          auditorUser: currentUser?.username || 'admin',
          auditorRole: currentUser?.role || 'admin'
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        setActiveTab('dashboard');
        fetchAllData();
      } else {
        const err = await response.json();
        showToast(err.error || 'Falha na restauração do arquivo físico.', 'error');
      }
    } catch (err) {
      showToast('Falha de conformidade na restauração.', 'error');
    }
  };

  const handleResetDatabase = async () => {
    if (currentUser?.role !== 'admin') {
      showToast('Ação restrita ao Administrador Geral.', 'error');
      return;
    }

    if (!confirm('Deseja resetar o banco de dados local para o acervo inicial de homologação do 71º BATALHÃO DE INFANTARIA MOTORIZADO? Todos os registros atuais serão redefinidos.')) {
      return;
    }

    const adminPassword = window.prompt('Por medidas de segurança, digite sua senha de administrador para confirmar a reinicialização:');
    if (!adminPassword) {
      showToast('Ação cancelada. Senha não fornecida.', 'info');
      return;
    }

    try {
      const authResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser?.username, password: adminPassword })
      });
      if (!authResponse.ok) {
        showToast('Senha incorreta. Reinicialização bloqueada por segurança.', 'error');
        return;
      }
    } catch (e) {
      showToast('Erro ao validar credenciais de segurança.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditorUser: currentUser?.username || 'admin',
          auditorRole: currentUser?.role || 'admin'
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        setActiveTab('dashboard');
        fetchAllData();
      }
    } catch (e) {
      showToast('Erro de comunicação para redefinição do acervo.', 'error');
    }
  };

  // --- FILTERED COLLECTIONS ---
  const filteredContracts = contracts.filter(contract => {
    // Audit view constraints: If fiscal, they are restricted to show only contracts where they are listed as either Title or Sub
    if (currentUser?.role === 'fiscal') {
      // Find fiscal id linked to user's CPF or name
      const associatedFiscal = fiscais.find(f => f.cpf === currentUser.cpf);
      if (associatedFiscal) {
        const isTitular = contract.fiscalTitularId === associatedFiscal.id;
        const isSubstituto = contract.fiscalSubstitutoId === associatedFiscal.id;
        if (!isTitular && !isSubstituto) return false;
      } else {
        // If no linked fiscal but account role is fiscal, allow showing none or default
        return false;
      }
    }

    const matchesSearch = 
      contract.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.cnpj.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus;
    
    const matchesFiscal = filterFiscal === 'all' || 
      contract.fiscalTitularId === filterFiscal || 
      contract.fiscalSubstitutoId === filterFiscal;

    return matchesSearch && matchesStatus && matchesFiscal;
  });

  const sortedContracts = [...filteredContracts].sort((a, b) => {
    let aVal: any = a[sortContractsBy as keyof Contract];
    let bVal: any = b[sortContractsBy as keyof Contract];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortContractsOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortContractsOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedContracts = contractsPerPage === 'all' 
    ? sortedContracts 
    : sortedContracts.slice((contractsPage - 1) * (contractsPerPage as number), contractsPage * (contractsPerPage as number));

  const sortedFiscais = [...fiscais].sort((a, b) => {
    let aVal: any = a[sortFiscaisBy as keyof Fiscal];
    let bVal: any = b[sortFiscaisBy as keyof Fiscal];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortFiscaisOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortFiscaisOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedFiscais = fiscaisPerPage === 'all'
    ? sortedFiscais
    : sortedFiscais.slice((fiscaisPage - 1) * (fiscaisPerPage as number), fiscaisPage * (fiscaisPerPage as number));

  // --- REPORT GENERATION GENERATORS (Offline printable style with Ejército frame) ---
  const handlePrint = () => {
    window.print();
  };

  const getReportData = () => {
    let reportList: any[] = [];
    let title = '';

    switch (reportType) {
      case 'ativos':
        reportList = contracts.filter(c => c.status === 'ativo' || c.status === 'em_vencimento');
        title = 'Relatório de Contratos Administrativos Vigentes';
        break;
      case 'vencidos':
        reportList = contracts.filter(c => c.status === 'vencido');
        title = 'Relatório Geral de Contratos com Vigência Expirada';
        break;
      case 'por_fiscal':
        const fis = fiscais.find(f => f.id === reportFiscalId);
        reportList = contracts.filter(c => c.fiscalTitularId === reportFiscalId || c.fiscalSubstitutoId === reportFiscalId);
        title = `Controle de Contratos sob Fiscalização de: ${fis ? fis.postoGraduacao + ' ' + fis.name : 'Militar Não Identificado'}`;
        break;
      case 'proximos_vencimentos':
        const days = parseInt(reportDaysOut) || 90;
        const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        reportList = contracts.filter(c => {
          const end = new Date(c.endDate + 'T00:00:00Z');
          const base = new Date(todayStr + 'T00:00:00Z');
          const diff = Math.ceil((end.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
          return diff >= 0 && diff <= days && c.status !== 'encerrado';
        });
        title = `Prospecção de Términos Contratuais nos Próximos ${days} Dias`;
        break;
      case 'logs':
        reportList = logs.slice(0, 100);
        title = 'Auditoria Consolidada de Logs e Alterações Estruturais do Sistema';
        break;
      case 'efetivo_fiscais':
        reportList = fiscais;
        title = 'Relatório Geral do Efetivo de Fiscais Militares';
        break;
      case 'usuarios_sistema':
        reportList = admins;
        title = 'Relatório Geral de Usuários e Credenciais do Sistema';
        break;
      case 'designacao_fiscais':
        reportList = contracts.filter(c => c.status === 'ativo' || c.status === 'em_vencimento');
        title = 'Designação de Fiscais de Contrato (Art. 117, Lei nº 14.133/21)';
        break;
    }

    return { reportList, title };
  };

  // Convert report data format to localized XLSX
  const excelDownload = async () => {
    const { reportList, title } = getReportData();
    try {
      const XLSX = await import('xlsx');
      
      let wsData = [];
      if (reportType === 'logs') {
        wsData.push(["Data", "Militar Responsável", "Perfil", "Operação", "Detalhe"]);
        reportList.forEach((l: SystemLog) => {
          const adminMatch = admins.find(a => 
            a.username.toLowerCase() === l.user.toLowerCase() || 
            a.name.toLowerCase() === l.user.toLowerCase() ||
            l.user.toLowerCase().includes(a.username.toLowerCase()) ||
            (a.warName && l.user.toLowerCase().includes(a.warName.toLowerCase()))
          );
          const formatRank = (r: string) => {
            if (!r) return '';
            const map: Record<string, string> = {
              '1º sargento': '1º Sgt', '2º sargento': '2º Sgt', '3º sargento': '3º Sgt',
              'primeiro sargento': '1º Sgt', 'segundo sargento': '2º Sgt', 'terceiro sargento': '3º Sgt',
              'subtenente': 'S Ten', '1º tenente': '1º Ten', '2º tenente': '2º Ten',
              'primeiro tenente': '1º Ten', 'segundo tenente': '2º Ten',
              'tenente coronel': 'Ten Cel', 'tenente-coronel': 'Ten Cel',
              'capitão': 'Cap', 'capitao': 'Cap', 'major': 'Maj', 'coronel': 'Cel',
              'tenente': 'Ten', 'sargento': 'Sgt', 'cabo': 'Cb', 'soldado': 'Sd'
            };
            return map[r.toLowerCase().trim()] || r;
          };
          let standardizedUser = l.user.toUpperCase();
          if (adminMatch) {
            const rankAbbrev = adminMatch.rank ? formatRank(adminMatch.rank) + ' ' : '';
            const namePart = (adminMatch.warName || adminMatch.name).toUpperCase();
            standardizedUser = `${rankAbbrev}${namePart}`;
          }
          let formattedDate = l.date;
          if (formattedDate && formattedDate.length === 19 && formattedDate.includes(' ')) {
            const d = new Date(formattedDate.replace(' ', 'T') + 'Z');
            if (!isNaN(d.getTime())) formattedDate = d.toLocaleString('pt-BR');
          }
          wsData.push([formattedDate, standardizedUser, l.role, l.action, l.detail]);
        });
      } else if (reportType === 'efetivo_fiscais') {
        wsData.push(["P/G", "Nome Completo / Nome de Guerra", "CPF", "Email", "Telefone"]);
        reportList.forEach((f: Fiscal) => {
          wsData.push([f.postoGraduacao, f.name + (f.warName ? ` (${f.warName})` : ''), f.cpf, f.email, f.phone]);
        });
      } else if (reportType === 'usuarios_sistema') {
        wsData.push(["Status", "Identificacao", "Usuario/Login", "CPF", "Nivel de Acesso"]);
        reportList.forEach((a: User) => {
          wsData.push([a.active ? "ATIVO" : "INATIVO", a.name + (a.warName ? ` (${a.warName})` : ''), a.username, a.cpf, a.role.toUpperCase()]);
        });
      } else if (reportType === 'designacao_fiscais') {
        wsData.push(["Nº Contrato", "Razão Social Contratada", "CNPJ", "Fiscal de Contrato Titular", "Fiscal de Contrato Substituto"]);
        reportList.forEach((c: Contract) => {
          const titular = fiscais.find(f => f.id === c.fiscalTitularId);
          const substituto = fiscais.find(f => f.id === c.fiscalSubstitutoId);
          
          const formatFiscalName = (f: Fiscal | undefined) => {
            if (!f) return 'Não designado';
            const rank = f.postoGraduacao;
            const fullName = f.name.toUpperCase();
            const warName = f.warName ? f.warName.toUpperCase() : '';
            return `${rank} ${fullName}${warName ? ` (${rank} ${warName})` : ''}`;
          };

          wsData.push([
            c.number,
            c.contractorName.toUpperCase(),
            formatCpfCnpj(c.cnpj),
            formatFiscalName(titular),
            formatFiscalName(substituto)
          ]);
        });
      } else {
        wsData.push(["No. Contrato", "Razão Social Contratada", "CNPJ", "Objeto e Finalidade Militar", "Valor Homologado", "Vigência Término", "Situação"]);
        reportList.forEach((c: Contract) => {
          wsData.push([c.number, c.contractorName, c.cnpj, c.object, c.value, c.endDate, c.status.toUpperCase()]);
        });
      }

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
      
      XLSX.writeFile(wb, `71bi_relatorio_${reportType}_20260521.xlsx`);
      showToast('Relatório exportado em formato XLSX estruturado para Excel.', 'success');
    } catch (e) {
      showToast('Erro ao exportar XLSX, bibliotecas podem não estar carregadas localmente.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-4 text-sm font-mono text-slate-400">Carregando acervo do Batalhão...</p>
        </div>
      </div>
    );
  }

  if (isTransitioning) {
    const connectionActive = transitionProgress >= 25;
    const databaseActive = transitionProgress >= 50;
    const cryptographyActive = transitionProgress >= 75;
    const integrityActive = transitionProgress >= 100;

    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-4 relative font-sans select-none">
        {/* Style injection for modern high-tech animations */}
        <style>{`
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(250%); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.15; filter: blur(24px); }
            50% { opacity: 0.35; filter: blur(16px); }
          }
          @keyframes rotation-ring {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes rotation-ring-reverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          .animate-scanline {
            animation: scanline 4s linear infinite;
          }
          .animate-pulse-glow {
            animation: pulse-glow 3s ease-in-out infinite;
          }
          .animate-rotate-hud {
            animation: rotation-ring 25s linear infinite;
          }
          .animate-rotate-hud-reverse {
            animation: rotation-ring-reverse 15s linear infinite;
          }
        `}</style>

        {/* Decorative military background patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e3a1e_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(16,185,129,0.03)_50%,transparent)] h-2/3 w-full animate-scanline pointer-events-none" />
        
        {/* Glowing backdrop light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full animate-pulse-glow pointer-events-none" />

        <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_-12px_rgba(16,185,129,0.25)] text-center space-y-6 z-10 relative">
          
          {/* Tactical HUD Corner Decorations */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-500/40 rounded-tl" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-500/40 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-500/40 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-500/40 rounded-br" />

          {/* Glowing Circular HUD Loader */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
              {/* Outer Track */}
              <circle
                cx="60"
                cy="60"
                r="53"
                fill="none"
                stroke="#1e293b"
                strokeWidth="4"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="60"
                cy="60"
                r="53"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 53}
                strokeDashoffset={2 * Math.PI * 53 * (1 - transitionProgress / 100)}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="transition-all duration-100 ease-out"
                style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.6))' }}
              />
              {/* Outer Dashed HUD Ring */}
              <circle
                cx="60"
                cy="60"
                r="57"
                fill="none"
                stroke="rgba(16, 185, 129, 0.25)"
                strokeWidth="1.5"
                strokeDasharray="6, 12"
                className="animate-rotate-hud"
              />
              {/* Inner Dashed Accent Ring */}
              <circle
                cx="60"
                cy="60"
                r="47"
                fill="none"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth="1"
                strokeDasharray="20, 10"
                className="animate-rotate-hud-reverse"
              />
            </svg>
            
            {/* Center Logo with Pulse effect */}
            <div className="w-20 h-20 flex items-center justify-center p-2 z-10 bg-slate-950/40 rounded-full backdrop-blur-sm border border-slate-800">
              <img 
                src="/logo.png" 
                alt="71º BI Mtz Logo" 
                className="w-full h-full object-contain filter drop-shadow-md animate-pulse" 
              />
            </div>
            
            {/* Progress Percentage floating badge */}
            <div className="absolute -bottom-1.5 bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-mono text-xs font-semibold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              {transitionProgress}%
            </div>
          </div>

          {/* System Identity */}
          <div className="space-y-1">
            <h3 className="text-white font-display font-medium text-lg tracking-widest uppercase">
              Acesso Autorizado
            </h3>
            <p className="text-xs text-emerald-400 font-mono uppercase tracking-wider">
              71º Batalhão de Infantaria Motorizado
            </p>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">
              Sessão: <span className="text-white font-semibold">{tempUser?.name}</span> &bull; Nível: <span className="text-white font-semibold">{tempUser?.role.toUpperCase()}</span>
            </div>
          </div>

          {/* Checklist checkpoints */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
            <div className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all duration-300 ${
              connectionActive 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-350' 
                : 'bg-slate-950/20 border-slate-800 text-slate-500'
            }`}>
              <Shield className={`h-4 w-4 shrink-0 ${connectionActive ? 'text-emerald-400 animate-pulse' : 'text-slate-650'}`} />
              <div className="truncate">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Canal Seguro</span>
                <span className="font-semibold">{connectionActive ? 'VALIDADO' : 'AGUARDANDO'}</span>
              </div>
            </div>

            <div className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all duration-300 ${
              databaseActive 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-350' 
                : 'bg-slate-950/20 border-slate-800 text-slate-500'
            }`}>
              <Database className={`h-4 w-4 shrink-0 ${databaseActive ? 'text-emerald-400 animate-pulse' : 'text-slate-650'}`} />
              <div className="truncate">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Banco SQLite</span>
                <span className="font-semibold">{databaseActive ? 'CARREGADO' : 'AGUARDANDO'}</span>
              </div>
            </div>

            <div className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all duration-300 ${
              cryptographyActive 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-350' 
                : 'bg-slate-950/20 border-slate-800 text-slate-500'
            }`}>
              <Lock className={`h-4 w-4 shrink-0 ${cryptographyActive ? 'text-emerald-400 animate-pulse' : 'text-slate-650'}`} />
              <div className="truncate">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Criptografia</span>
                <span className="font-semibold">{cryptographyActive ? 'DECODIFICADA' : 'AGUARDANDO'}</span>
              </div>
            </div>

            <div className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all duration-300 ${
              integrityActive 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-350' 
                : 'bg-slate-950/20 border-slate-800 text-slate-500'
            }`}>
              <CheckCircle className={`h-4 w-4 shrink-0 ${integrityActive ? 'text-emerald-400 animate-pulse' : 'text-slate-650'}`} />
              <div className="truncate">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Integridade</span>
                <span className="font-semibold">{integrityActive ? 'VERIFICADA' : 'AGUARDANDO'}</span>
              </div>
            </div>
          </div>

          {/* Micro terminal updates */}
          <div className="space-y-1">
            <div className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-[10px] font-mono text-left text-slate-400 h-24 overflow-hidden relative select-none">
              {/* Dynamic flashing indicator */}
              <div className="absolute top-1 right-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[8px] text-slate-500 tracking-wider">OFFLINE MONITOR</span>
              </div>

              <div className="text-emerald-500/90 font-semibold mb-1 flex items-center justify-between border-b border-slate-900 pb-1">
                <span>CONSOLA GESTÃO CONTRATOS</span>
                <span className="text-slate-500 font-normal">v4.0.12</span>
              </div>

              <div className="space-y-0.5 overflow-y-auto h-14 pr-1">
                <div className="text-slate-500">[0.0s] SYS: Inicializando rotinas de auditoria...</div>
                {transitionProgress >= 15 && <div className="text-emerald-500/70">[0.8s] OK: Canal de autenticação local validado de forma autônoma.</div>}
                {transitionProgress >= 40 && <div className="text-emerald-500/70">[2.0s] OK: Localizando tabelas contratos, fiscais e logs na memória.</div>}
                {transitionProgress >= 60 && <div className="text-emerald-500/70">[3.0s] OK: Decodificação dos anexos do acervo militar concluída.</div>}
                {transitionProgress >= 85 && <div className="text-emerald-500/70">[4.3s] OK: Assinatura sha256 offline confirmada com sucesso.</div>}
                {transitionProgress >= 100 && <div className="text-emerald-400 font-semibold animate-pulse">[5.0s] OK: Liberando painel de controle administrativo.</div>}
              </div>
            </div>
            <div className="text-center text-[10px] font-mono text-slate-500 italic animate-pulse">
              {transitionMessage}
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-800 selection:text-white relative`}>
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl border shadow-2xl transition-all animate-bounce max-w-sm flex items-start gap-3 bg-slate-900 border-slate-700">
          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold leading-none ${
            toast.type === 'success' ? 'bg-emerald-950 text-emerald-450 border border-emerald-800' : toast.type === 'error' ? 'bg-red-950 text-red-500 border border-red-900' : 'bg-slate-800 text-sky-400 border border-slate-700'
          }`}>
            ✓
          </span>
          <div>
            <p className="text-white text-sm font-semibold">{toast.type === 'success' ? 'Sucesso Técnico' : toast.type === 'error' ? 'Atenção / Alerta' : 'Informativo Militar'}</p>
            <p className="text-slate-400 text-xs mt-0.5 leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Main Administrative Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-40 print:hidden shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Left Brand Area */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-12 flex items-center justify-center shrink-0 p-1">
                <img src="/logo.png" alt="71º BATALHÃO DE INFANTARIA MOTORIZADO Logo" className="w-full h-full object-contain filter drop-shadow-sm" />
              </div>
              <div>
                <span className="font-display font-bold text-white tracking-widest text-base block uppercase">71º BATALHÃO DE INFANTARIA MOTORIZADO</span>
                <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Controle de Contratos Administrativos</span>
              </div>
            </div>

            {/* Right User Panel Section */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1 justify-end">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {currentUser.rank && currentUser.warName ? `${abreviarPosto(currentUser.rank)} ${currentUser.warName}`.toUpperCase() : currentUser.name}
                  {currentUser.role === 'admin' && (
                    <span className="text-[10px] bg-red-950/80 border border-red-800 text-red-400 px-2 py-0.5 rounded ml-2 flex items-center gap-1.5 font-mono" title="Tempo restante de inatividade (Sessão máx: 20 min)">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                      EXPIRA: {Math.floor(idleCountdown / 60)}:{(idleCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                  Função: {currentUser.role === 'admin' ? 'Administrador Master' : currentUser.role === 'gestor' ? 'Gestor de Contratos' : 'OFICIAL/PRAÇA FISCAL'}
                </span>
              </div>

              <div className="h-8 w-px bg-slate-800 hidden md:block"></div>

              <div className="flex items-center gap-1">
                {currentUser && currentUser.role === 'admin' && (
                  <span className="md:hidden text-[10px] bg-red-950/80 border border-red-800 text-red-400 px-1.5 py-0.5 rounded font-mono mr-1" title="Tempo de inatividade (Sessão máx: 20 min)">
                    {Math.floor(idleCountdown / 60)}:{(idleCountdown % 60).toString().padStart(2, '0')}
                  </span>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  title="Encerrar sessão com auditoria"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span className="hidden sm:inline">Encerrar</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Navigation Sub-Header Bar (Desktop) */}
      <nav className="bg-slate-900/60 border-b border-slate-800/80 shrink-0 py-2 sticky top-16 z-30 print:hidden backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto gap-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedContract(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-display tracking-wider uppercase rounded-md transition-all cursor-pointer grow text-center justify-center shrink-0 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Activity className="h-4 w-4 text-emerald-400" />
              Painel Geral
            </button>
            
            <button
              onClick={() => { setActiveTab('contracts'); setSelectedContract(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-display tracking-wider uppercase rounded-md transition-all cursor-pointer grow text-center justify-center shrink-0 ${activeTab === 'contracts' ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              Contratos {currentUser.role === 'fiscal' && 'Vinculados'}
            </button>

            {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
              <>
                <button
                  onClick={() => { setActiveTab('fiscais'); setSelectedContract(null); }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-display tracking-wider uppercase rounded-md transition-all cursor-pointer grow text-center justify-center shrink-0 ${activeTab === 'fiscais' ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Users className="h-4 w-4 text-emerald-400" />
                  Fiscais de Contratos
                </button>
              </>
            )}

            <button
              onClick={() => { setActiveTab('reports'); setSelectedContract(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-display tracking-wider uppercase rounded-md transition-all cursor-pointer grow text-center justify-center shrink-0 ${activeTab === 'reports' ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              Relatórios
            </button>

            {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
              <>
                <button
                  onClick={() => { setActiveTab('logs'); setSelectedContract(null); }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-display tracking-wider uppercase rounded-md transition-all cursor-pointer grow text-center justify-center shrink-0 ${activeTab === 'logs' ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Logs Auditoria
                </button>

                <button
                  onClick={() => { setActiveTab('backups'); setSelectedContract(null); }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-display tracking-wider uppercase rounded-md transition-all cursor-pointer grow text-center justify-center shrink-0 ${activeTab === 'backups' ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Database className="h-4 w-4 text-emerald-400" />
                  Backup Local
                </button>

                <button
                  onClick={() => { setActiveTab('admins'); setSelectedContract(null); }}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-display tracking-wider uppercase rounded-md transition-all cursor-pointer grow text-center justify-center shrink-0 ${activeTab === 'admins' ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <ShieldAlert className="h-4 w-4 text-emerald-400" />
                  Administradores
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0">
        
        {/* TAB 1: DASHBOARD VIEW */}
        {activeTab === 'dashboard' && dashboardData && (
          <Dashboard 
            data={dashboardData} 
            contracts={contracts} 
            onNavigateToContracts={() => setActiveTab('contracts')}
            onSelectContractId={(id) => {
              const contract = contracts.find(c => c.id === id);
              if (contract) {
                setSelectedContract(contract);
                setActiveTab('contracts');
              }
            }}
          />
        )}

        {/* TAB 2: CONTRACTS INDEX VIEW / DETALHES */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            
            {/* Sub-view switcher: If contract detail view is active */}
            {selectedContract ? (
              <div className="bg-slate-850 p-6 rounded-xl border border-slate-700 shadow-md space-y-6">
                
                {/* Contract Detail Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-4">
                  <div>
                    <button 
                      onClick={() => setSelectedContract(null)}
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 uppercase tracking-wider mb-2"
                    >
                      &larr; Voltar para a listagem
                    </button>
                    <h2 className="text-xl md:text-2xl font-display font-semibold text-white tracking-tight flex items-center gap-2.5">
                      <FileText className="h-6 w-6 text-emerald-400" />
                      Contrato Administrativo {selectedContract.number}
                    </h2>
                    <p className="text-xs font-sans text-slate-400 uppercase tracking-wider mt-1 font-mono">
                      Homologado sob CNPJ: {selectedContract.cnpj} &bull; ID: {selectedContract.id}
                    </p>
                  </div>
                  
                  {/* Status badge and actions */}
                  <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
                    <span className={`inline-flex px-3 py-1 text-xs font-bold font-mono border rounded-full uppercase ${
                      selectedContract.status === 'ativo' 
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-900' 
                        : selectedContract.status === 'vencido' 
                        ? 'bg-red-950 text-red-550 border-red-900' 
                        : 'bg-yellow-950 text-yellow-501 border-yellow-902'
                    }`}>
                      {selectedContract.status.replace('_', ' ')}
                    </span>
                    
                    {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleOpenContractModal(selectedContract);
                          }}
                          className="px-3 py-1.5 bg-slate-800 text-xs font-semibold text-white border border-slate-700 rounded-lg hover:bg-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5 text-sky-400" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteContract(selectedContract.id, selectedContract.number)}
                          className="px-3 py-1.5 bg-red-950/40 text-xs font-semibold text-red-400 border border-red-900 rounded-lg hover:bg-red-900 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main detail content info card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Contract Core specs Column */}
                  <div className="lg:col-span-2 space-y-5 bg-slate-900 p-5 rounded-lg border border-slate-800">
                    <div>
                      <h3 className="text-xs font-display text-slate-400 uppercase tracking-widest">Objeto Militar do Contrato</h3>
                      <p className="text-sm font-semibold text-white mt-1.5 leading-relaxed bg-slate-950 p-3 rounded border border-slate-850">
                        {selectedContract.object}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs text-slate-400 uppercase tracking-wider font-mono">Empresa Contratada</h4>
                        <p className="text-sm font-medium text-slate-200 mt-1">{selectedContract.contractorName}</p>
                      </div>
                      <div>
                        <h4 className="text-xs text-slate-400 uppercase tracking-wider font-mono">CNPJ / CPF da Contratada</h4>
                        <p className="text-sm font-mono text-slate-200 mt-1">{selectedContract.cnpj}</p>
                      </div>
                      <div>
                        <h4 className="text-xs text-slate-400 uppercase tracking-wider font-mono">Valor Total do Contrato</h4>
                        <p className="text-base font-bold text-emerald-400 mt-1 font-mono">
                          {selectedContract.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs text-slate-400 uppercase tracking-wider font-mono">Vigência Aproximada</h4>
                        <p className="text-sm font-medium text-slate-200 mt-1">{selectedContract.termMonths} meses</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                      <div>
                        <h4 className="text-xs text-slate-400 uppercase tracking-wider font-mono">Data de Início</h4>
                        <p className="text-sm font-medium text-slate-200 mt-1 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-emerald-500" />
                          {selectedContract.startDate.split('-').reverse().join('/')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs text-slate-400 uppercase tracking-wider font-mono">Data de Término</h4>
                        <p className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-yellow-501" />
                          {selectedContract.endDate.split('-').reverse().join('/')}
                        </p>
                      </div>
                    </div>

                    {/* Fiscais names explicitly */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
                      <div>
                        <h4 className="text-xs text-amber-500 uppercase tracking-widest font-mono flex items-center gap-1 font-semibold">
                          <UserCheck className="h-4 w-4" />
                          Fiscal Titular
                        </h4>
                        <p className="text-sm font-bold text-white mt-1">
                          {fiscais.find(f => f.id === selectedContract.fiscalTitularId)?.postoGraduacao} {fiscais.find(f => f.id === selectedContract.fiscalTitularId)?.name || 'Nenhum cadastrado'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Email: {fiscais.find(f => f.id === selectedContract.fiscalTitularId)?.email || 'N/D'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Fiscal Substituto
                        </h4>
                        <p className="text-sm font-bold text-white mt-1">
                          {fiscais.find(f => f.id === selectedContract.fiscalSubstitutoId)?.postoGraduacao} {fiscais.find(f => f.id === selectedContract.fiscalSubstitutoId)?.name || 'Nenhum cadastrado'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Email: {fiscais.find(f => f.id === selectedContract.fiscalSubstitutoId)?.email || 'N/D'}
                        </p>
                      </div>
                    </div>

                    {/* Observations */}
                    <div className="space-y-2">
                      <h4 className="text-xs text-slate-400 uppercase tracking-wider font-mono">Observações Administrativas Internas</h4>
                      {(() => {
                        const observationBlocks = selectedContract.observations
                          ? selectedContract.observations.split('\n\n').filter(block => block.trim() !== '')
                          : [];
                        
                        if (observationBlocks.length === 0) {
                          return (
                            <div className="text-xs text-slate-500 italic bg-slate-950 border border-slate-850 p-3 rounded-md min-h-[80px] flex items-center justify-center">
                              Nenhum detalhe administrativo foi inserido até o momento.
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-2">
                            {observationBlocks.map((block, idx) => (
                              <div key={idx} className="relative">
                                {editingObsIndex === idx ? (
                                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-md space-y-2">
                                    <textarea
                                      value={editingObsText}
                                      onChange={(e) => setEditingObsText(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[70px]"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => handleSaveEditObservation(idx)}
                                        className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-[10px] uppercase font-semibold cursor-pointer"
                                      >
                                        Salvar
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingObsIndex(null);
                                          setEditingObsText('');
                                        }}
                                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] uppercase font-semibold cursor-pointer"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-slate-950 border border-slate-850 hover:border-slate-700 p-3 rounded-md group transition-all relative">
                                    <div className="text-xs text-slate-300 font-sans whitespace-pre-wrap pr-16 leading-relaxed">
                                      {block}
                                    </div>
                                    
                                    {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
                                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 pl-2 rounded">
                                        <button
                                          onClick={() => {
                                            setEditingObsIndex(idx);
                                            setEditingObsText(block);
                                          }}
                                          title="Editar observação"
                                          className="p-1 hover:bg-slate-800 text-sky-400 hover:text-sky-300 rounded cursor-pointer transition-colors"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteObservation(idx)}
                                          title="Excluir observação"
                                          className="p-1 hover:bg-slate-800 text-red-400 hover:text-red-305 rounded cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right hand columns: Attachments & Occurrences flow */}
                  <div className="space-y-5">
                    
                    {/* Digitized Documents list */}
                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-lg">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                        <Paperclip className="h-4 w-4 text-emerald-400" />
                        Documentos Assinados PDF ({selectedContract.documents.length})
                      </h3>
                      
                      <div className="mt-3 space-y-2">
                        {selectedContract.documents.length === 0 ? (
                          <p className="text-xs text-slate-505 font-mono text-center py-4">Nenhum anexo digitalizado neste contrato.</p>
                        ) : (
                          selectedContract.documents.map((doc) => (
                            <div key={doc.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded flex justify-between items-center text-xs">
                              <div className="truncate max-w-[170px]" title={doc.name}>
                                <p className="font-semibold text-slate-200 select-all">{doc.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.size} &bull; {doc.uploadDate.split('-').reverse().join('/')}</p>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/80 border border-emerald-900/60 text-emerald-400 rounded">
                                Audito
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Fiscal Occurrence updates (Audited occurrence ledger) */}
                    <div className="bg-slate-900 border border-slate-850 p-4 rounded-lg space-y-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-emerald-400" />
                        Acompanhamento Técnico de Campo
                      </h3>

                      {/* Log occurrence input */}
                      {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
                        <div className="space-y-2">
                          <textarea
                            placeholder="Registrar nova vistoria, notificação à empresa contratada ou alteração no cronograma operacional..."
                            value={fiscalOcorrenciaNote}
                            onChange={(e) => setFiscalOcorrenciaNote(e.target.value)}
                            className="w-full bg-slate-950 text-xs border border-slate-800 rounded-lg p-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[70px]"
                          />
                          <button
                            onClick={() => handleFiscalOccurrenceSubmit(selectedContract.id)}
                            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 rounded-md transition-colors font-display uppercase tracking-wider cursor-pointer"
                          >
                            Salvar Ocorrência Oficial
                          </button>
                        </div>
                      )}

                      {/* Display log occurrences sequence (using Contract.history) */}
                      <div className="space-y-3 pt-3 border-t border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Histórico de Movimentações</p>
                        <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                          {selectedContract.history.map((h, i) => (
                            <div key={h.id || i} className="p-2 bg-slate-950 rounded text-[11px] space-y-1.5 border border-slate-850">
                              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>{h.user}</span>
                                <span>{h.date.substring(0, 16)}</span>
                              </div>
                              <p className="text-slate-200 font-medium">{h.action}</p>
                              <p className="text-slate-400 leading-tight block">{h.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

              </div>
            ) : (
              // Contract List Index
              <div className="space-y-6">
                
                {/* Search & Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-850 p-4 rounded-xl border border-slate-700">
                  
                  {/* Filter form Inputs */}
                  <div className="flex flex-wrap gap-2.5 flex-1 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Pesquisar por Contrato, Objeto, Fornecedor ou CNPJ..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-500 text-sm pl-10 pr-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-slate-700 border border-slate-500 text-xs py-3.5 px-3 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">Situação (Todas)</option>
                      <option value="ativo">Ativo</option>
                      <option value="vencido">Vencido</option>
                      <option value="em_vencimento">Em Vencimento</option>
                    </select>

                    <select
                      value={filterFiscal}
                      onChange={(e) => setFilterFiscal(e.target.value)}
                      className="bg-slate-700 border border-slate-500 text-xs py-3.5 px-3 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">Fiscais (Todos)</option>
                      {[...fiscais]
                        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                        .map(f => (
                          <option key={f.id} value={f.id}>{f.postoGraduacao} {f.name}</option>
                        ))}
                    </select>

                    <select
                      value={`${sortContractsBy}-${sortContractsOrder}`}
                      onChange={(e) => {
                        const [by, order] = e.target.value.split('-');
                        setSortContractsBy(by);
                        setSortContractsOrder(order as 'asc' | 'desc');
                      }}
                      className="bg-slate-700 border border-slate-500 text-xs py-3.5 px-3 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="number-asc">Contrato (Cresc)</option>
                      <option value="number-desc">Contrato (Decresc)</option>
                      <option value="contractorName-asc">Empresa (A-Z)</option>
                      <option value="contractorName-desc">Empresa (Z-A)</option>
                      <option value="endDate-asc">Término (Cresc)</option>
                      <option value="endDate-desc">Término (Decresc)</option>
                      <option value="value-asc">Valor (Menor-Maior)</option>
                      <option value="value-desc">Valor (Maior-Menor)</option>
                    </select>
                  </div>

                  {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
                    <button
                      onClick={() => handleOpenContractModal()}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold font-display tracking-wider text-xs uppercase px-4 py-3 pb-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
                    >
                      <Plus className="h-4 w-4 text-white" />
                      Novo Contrato
                    </button>
                  )}
                </div>

                {/* Contracts Table Layout */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md overflow-hidden">
                  <div className="p-4 bg-slate-900/60 uppercase text-[10px] font-bold font-mono tracking-wider text-slate-400 border-b border-slate-700 flex justify-between items-center">
                    <span>Acervo de Contratos Administrativos ({sortedContracts.length})</span>
                    {contractsPerPage !== 'all' && <span>Exibindo {(contractsPage - 1) * (contractsPerPage as number) + 1} a {Math.min(contractsPage * (contractsPerPage as number), sortedContracts.length)}</span>}
                  </div>

                  <div className="overflow-x-auto">
                    {paginatedContracts.length === 0 ? (
                      <div className="text-center py-16 text-slate-500 font-sans">
                        Nenhum contrato corresponde aos filtros solicitados.
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-slate-700 text-sm">
                        <thead className="bg-slate-900/30">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Contrato / Objeto</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Empresa Fornecedora</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Valor Homologado</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Término</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Fiscais Militares</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Situação</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {paginatedContracts.map((contract) => {
                            const tit = fiscais.find(f => f.id === contract.fiscalTitularId);
                            const sub = fiscais.find(f => f.id === contract.fiscalSubstitutoId);
                            return (
                              <tr key={contract.id} className="hover:bg-slate-700/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-mono text-emerald-400 font-bold text-sm tracking-wide">{contract.number}</div>
                                  <div className="text-xs text-white font-semibold line-clamp-1 max-w-[200px] xl:max-w-[250px] mt-0.5" title={contract.object}>
                                    {contract.object}
                                  </div>
                                </td>
                                <td className="px-4 py-3 max-w-[200px]">
                                  <div className="text-xs font-medium text-white truncate" title={contract.contractorName}>{contract.contractorName}</div>
                                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">CNPJ: {contract.cnpj}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-xs font-bold font-mono text-sky-400 text-right">
                                  {contract.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-300 text-center">
                                  {contract.endDate.split('-').reverse().join('/')}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                                  <div className="text-[10px] font-sans">
                                    <span className="text-amber-500 font-semibold font-mono">T:</span> {tit ? `${tit.postoGraduacao} ${(tit.warName || tit.name.split(' ')[0]).toUpperCase()}` : 'N/D'}
                                  </div>
                                  <div className="text-[10px] font-sans mt-0.5">
                                    <span className="text-slate-400 font-semibold font-mono">S:</span> {sub ? `${sub.postoGraduacao} ${(sub.warName || sub.name.split(' ')[0]).toUpperCase()}` : 'N/D'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wide border ${
                                    contract.status === 'ativo' 
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-900/60' 
                                      : contract.status === 'vencido' 
                                      ? 'bg-red-950 text-red-500 border-red-900/60' 
                                      : 'bg-yellow-950 text-yellow-501 border-yellow-902/60'
                                  }`}>
                                    {contract.status.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => setSelectedContract(contract)}
                                      className="p-1.5 text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 hover:bg-emerald-900 hover:text-white rounded transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Visualizar/Detalhar"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    {currentUser.role === 'admin' && (
                                      <>
                                        <button
                                          onClick={() => handleOpenContractModal(contract)}
                                          className="p-1.5 text-sky-400 bg-sky-950/50 border border-sky-900/50 hover:bg-sky-900 hover:text-white rounded transition-colors flex items-center gap-1 cursor-pointer"
                                          title="Editar"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteContract(contract.id, contract.number)}
                                          className="p-1.5 text-red-400 bg-red-950/50 border border-red-900/50 hover:bg-red-900 hover:text-white rounded transition-colors flex items-center gap-1 cursor-pointer"
                                          title="Excluir"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  <div className="p-4 bg-slate-850 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Exibir registros:</span>
                      <select
                        value={contractsPerPage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContractsPerPage(val === 'all' ? 'all' : Number(val));
                          setContractsPage(1);
                        }}
                        className="bg-slate-700 border border-slate-500 text-xs py-1.5 px-2 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="all">Todos</option>
                      </select>
                    </div>
                    {contractsPerPage !== 'all' && (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={contractsPage === 1}
                          onClick={() => setContractsPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1 bg-slate-700 disabled:opacity-50 text-white text-xs rounded hover:bg-slate-600 transition-colors cursor-pointer"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-slate-400">
                          Página {contractsPage} de {Math.ceil(sortedContracts.length / (contractsPerPage as number))}
                        </span>
                        <button
                          disabled={contractsPage >= Math.ceil(sortedContracts.length / (contractsPerPage as number))}
                          onClick={() => setContractsPage(prev => prev + 1)}
                          className="px-3 py-1 bg-slate-700 disabled:opacity-50 text-white text-xs rounded hover:bg-slate-600 transition-colors cursor-pointer"
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 3: FISCAIS LIST VIEW (Admin Only) */}
        {activeTab === 'fiscais' && (currentUser.role === 'admin' || currentUser.role === 'gestor') && (
          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-850 p-4 rounded-xl border border-slate-700">
              <div>
                <h2 className="text-lg font-display font-semibold text-white tracking-tight">Quadro Geral de Fiscais</h2>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={`${sortFiscaisBy}-${sortFiscaisOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortFiscaisBy(by);
                    setSortFiscaisOrder(order as 'asc' | 'desc');
                  }}
                  className="bg-slate-700 border border-slate-500 text-xs py-2.5 px-3 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="name-asc">Nome (A-Z)</option>
                  <option value="name-desc">Nome (Z-A)</option>
                  <option value="postoGraduacao-asc">Posto/Grad (Cresc)</option>
                  <option value="postoGraduacao-desc">Posto/Grad (Decresc)</option>
                  <option value="role-asc">Comissão (A-Z)</option>
                  <option value="role-desc">Comissão (Z-A)</option>
                  <option value="status-asc">Situação (A-Z)</option>
                  <option value="status-desc">Situação (Z-A)</option>
                </select>

                <button
                  onClick={() => handleOpenFiscalModal()}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold font-display tracking-wider text-xs uppercase px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shrink-0"
                >
                  <UserPlus className="h-4 w-4" />
                  Cadastrar Fiscal
                </button>
              </div>
            </div>

            {/* Fiscais Table Layout */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md overflow-hidden">
              <div className="p-4 bg-slate-900/60 uppercase text-[10px] font-bold font-mono tracking-wider text-slate-400 border-b border-slate-700 flex justify-between items-center">
                <span>Efetivo Fiscal ({sortedFiscais.length})</span>
                {fiscaisPerPage !== 'all' && <span>Exibindo {(fiscaisPage - 1) * (fiscaisPerPage as number) + 1} a {Math.min(fiscaisPage * (fiscaisPerPage as number), sortedFiscais.length)}</span>}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700 text-sm">
                  <thead className="bg-slate-900/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Identificação Militar</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Contato / CPF</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Comissão</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Contratos Ativos</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Situação</th>
                      {currentUser.role === 'admin' && (
                        <th className="px-4 py-3 text-center text-xs font-semibold font-sans uppercase tracking-wider text-slate-400">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {paginatedFiscais.map((fiscal) => {
                      const activeTit = contracts.filter(c => c.status === 'ativo' && c.fiscalTitularId === fiscal.id).length;
                      const activeSub = contracts.filter(c => c.status === 'ativo' && c.fiscalSubstitutoId === fiscal.id).length;
                      return (
                        <tr key={fiscal.id} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-mono text-emerald-400 font-bold text-sm tracking-wide">
                              {fiscal.postoGraduacao} {fiscal.warName || fiscal.name.split(' ').slice(-1)[0]}
                            </div>
                            <div className="text-xs text-white font-semibold line-clamp-1 max-w-[250px] mt-0.5" title={fiscal.name}>
                              {fiscal.name}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[10px] font-mono text-slate-300">CPF: {fiscal.cpf}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[150px]" title={fiscal.email}>{fiscal.email || 'Não informado'}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{fiscal.phone || 'Não listado'}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wide border ${
                              fiscal.role === 'titular' ? 'bg-amber-950 text-amber-500 border-amber-900/60' : 
                              fiscal.role === 'substituto' ? 'bg-purple-950 text-purple-400 border-purple-900/60' : 
                              'bg-blue-950 text-blue-400 border-blue-900/60'
                            }`}>
                              {fiscal.role === 'titular' ? 'Titular' : fiscal.role === 'substituto' ? 'Substituto' : 'Titular/Subst'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-mono text-slate-300 text-center">
                            <span className="text-emerald-400 font-bold">{activeTit}</span> T / <span className="text-sky-400 font-bold">{activeSub}</span> S
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wide border ${
                              fiscal.status === 'ativo' ? 'bg-emerald-950 text-emerald-400 border-emerald-900/60' : 'bg-red-950 text-red-500 border-red-900/60'
                            }`}>
                              {fiscal.status.toUpperCase()}
                            </span>
                          </td>
                          {currentUser.role === 'admin' && (
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenFiscalModal(fiscal)}
                                  className="p-1.5 text-sky-400 bg-sky-950/50 border border-sky-900/50 hover:bg-sky-900 hover:text-white rounded transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFiscal(fiscal.id, fiscal.name)}
                                  className="p-1.5 text-red-400 bg-red-950/50 border border-red-900/50 hover:bg-red-900 hover:text-white rounded transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-850 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Exibir registros:</span>
                  <select
                    value={fiscaisPerPage}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFiscaisPerPage(val === 'all' ? 'all' : Number(val));
                      setFiscaisPage(1);
                    }}
                    className="bg-slate-700 border border-slate-500 text-xs py-1.5 px-2 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
                {fiscaisPerPage !== 'all' && (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={fiscaisPage === 1}
                      onClick={() => setFiscaisPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1 bg-slate-700 disabled:opacity-50 text-white text-xs rounded hover:bg-slate-600 transition-colors cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-slate-400">
                      Página {fiscaisPage} de {Math.ceil(sortedFiscais.length / (fiscaisPerPage as number))}
                    </span>
                    <button
                      disabled={fiscaisPage >= Math.ceil(sortedFiscais.length / (fiscaisPerPage as number))}
                      onClick={() => setFiscaisPage(prev => prev + 1)}
                      className="px-3 py-1 bg-slate-700 disabled:opacity-50 text-white text-xs rounded hover:bg-slate-600 transition-colors cursor-pointer"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3.1: ADMINS LIST VIEW (Admin Only) */}
        {activeTab === 'admins' && currentUser.role === 'admin' && (
          <div className="space-y-6">
            
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-850 p-4 rounded-xl border border-slate-700">
              <div>
                <h2 className="text-lg font-display font-semibold text-white tracking-tight">Quadro Geral de Administradores</h2>
              </div>

              <button
                onClick={() => handleOpenAdminModal()}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold font-display tracking-wider text-xs uppercase px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                Cadastrar Usuário
              </button>
            </div>

            {/* Admins Cards Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="admins-grid">
              {admins.map((admin) => (
                <div key={admin.id} className="bg-slate-700 border border-slate-500 hover:border-slate-600 rounded-xl p-5 shadow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-0.5 text-[9px] font-bold font-mono uppercase tracking-wider bg-slate-700 border border-slate-500 text-slate-300 rounded-full">
                        Admin Master
                      </span>
                      <span className={`h-2.5 w-2.5 rounded-full ${admin.active ? 'bg-emerald-500' : 'bg-red-500'}`} title={admin.active ? 'Ativo' : 'Inativo'} />
                    </div>

                    <h3 className="text-base font-display font-bold text-white mt-3 truncate">{admin.name}</h3>
                    <p className="text-xs font-mono text-slate-400 mt-1">CPF: {admin.cpf}</p>
                    
                    <div className="mt-4 space-y-1.5 text-xs text-slate-300 font-sans">
                      <div className="truncate">Login (Username): <span className="font-mono text-slate-400">{admin.username}</span></div>
                      <div className="uppercase tracking-wide text-[10px] font-mono text-amber-500 mt-2 font-bold">
                        Acesso Total Autorizado
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-700/70 flex justify-end gap-2 bg-transparent">
                    <button
                      onClick={() => handleOpenAdminModal(admin)}
                      className="p-1 px-2.5 bg-slate-900 text-[11px] text-sky-400 border border-slate-700 rounded hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                    >
                      Editar
                    </button>
                    {currentUser.id !== admin.id && currentUser.username !== admin.username && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        className="p-1 px-2.5 bg-red-950/40 text-[11px] text-red-400 border border-red-900 rounded hover:bg-red-900 hover:text-white transition-all cursor-pointer"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 4: MILITARY STYLE PRINTABLE REPORT BUILDER */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            
            {/* Options configuration panel (Not printed) */}
            <div className="bg-slate-850 p-6 rounded-xl border border-slate-700 shadow-md flex flex-wrap gap-4 items-end justify-between print:hidden">
              <div className="flex flex-wrap gap-4">
                
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Categoria do Relatório</label>
                  <select
                    value={reportType}
                    onChange={(e: any) => setReportType(e.target.value)}
                    className="bg-slate-700 border border-slate-500 text-xs py-2 px-3 rounded-lg text-white font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="ativos">Contratos Ativos (Vigentes)</option>
                    <option value="vencidos">Contratos Vencidos (Expirados)</option>
                    <option value="por_fiscal">Contratos por Fiscal</option>
                    <option value="proximos_vencimentos">Contratos Próximos do Vencimento</option>
                    <option value="designacao_fiscais">Designação de Fiscais (Art. 117)</option>
                    <option value="efetivo_fiscais">Efetivo de Fiscais Militares</option>
                    <option value="usuarios_sistema">Usuários e Credenciais do Sistema</option>
                    <option value="logs">Logs Administrativos Recentes</option>
                  </select>
                </div>

                {reportType === 'por_fiscal' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Selecionar Fiscal</label>
                    <select
                      value={reportFiscalId}
                      onChange={(e) => setReportFiscalId(e.target.value)}
                      className="bg-slate-700 border border-slate-500 text-xs py-2 px-3 rounded-lg text-white font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">Escolha o militar...</option>
                      {[...fiscais]
                        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                        .map(f => (
                          <option key={f.id} value={f.id}>{f.postoGraduacao} {f.name}</option>
                        ))}
                    </select>
                  </div>
                )}

                {reportType === 'proximos_vencimentos' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Horizonte de Dias</label>
                    <select
                      value={reportDaysOut}
                      onChange={(e) => setReportDaysOut(e.target.value)}
                      className="bg-slate-700 border border-slate-500 text-xs py-2 px-3 rounded-lg text-white font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="15">Próximos 15 dias</option>
                      <option value="30">Próximos 30 dias</option>
                      <option value="60">Próximos 60 dias</option>
                      <option value="90">Próximos 90 dias</option>
                    </select>
                  </div>
                )}

              </div>

              {/* Action operations buttons */}
              <div className="flex gap-2">
                <button
                  onClick={excelDownload}
                  className="px-4 py-2 bg-slate-800 text-xs text-sky-400 font-bold uppercase tracking-wider border border-slate-700 hover:border-sky-500 hover:text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Download className="h-4.5 w-4.5" />
                  Planilha Excel
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-800 text-xs text-white font-bold uppercase tracking-wider hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-600 shadow-md"
                >
                  <Printer className="h-4.5 w-4.5" />
                  Imprimir/PDF
                </button>
              </div>
            </div>

            {/* Officially formatted Brazilian Army Report (A4 stylized) */}
            <div className="bg-white text-slate-900 p-8 md:p-12 rounded-xl shadow-2xl border border-slate-700/20 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:my-0 space-y-8 animate-fadeIn" id="printable-area" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '10pt' }}>
              
              {/* Printable military official coat styling */}
              <div className="text-center text-slate-900 border-b-2 border-slate-950 pb-4 flex flex-col items-center" style={{ lineHeight: '1.0' }}>
                <img src="/brasao.png" alt="Brasão das Armas do Brasil" className="h-16 w-auto mb-2" />
                <p className="font-bold uppercase tracking-widest text-[12pt]">MINISTÉRIO DA DEFESA</p>
                <p className="font-bold uppercase tracking-widest text-[12pt]">EXÉRCITO BRASILEIRO</p>
                <p className="uppercase font-bold text-[12pt]">71º BATALHÃO DE INFANTARIA MOTORIZADO</p>
                <p className="uppercase font-bold text-[12pt] text-slate-700">(BATALHÃO DUARTE COELHO/1993)</p>
                <div className="pt-2">
                  <div className="h-1 w-20 bg-slate-900 mx-auto" />
                </div>
              </div>

              {/* Report Title */}
              <div className="space-y-2">
                <h2 className="text-center text-[12pt] font-bold uppercase tracking-wide">
                  {getReportData().title}
                </h2>
              </div>

              {/* Report Content representation */}
              {reportType === 'designacao_fiscais' ? (
                <div className="text-slate-900 space-y-6" id="report-text-content">
                  <p className="text-justify" style={{ lineHeight: '1.25' }}>
                    Conforme prescreve o Art nº 117, da Lei nº 14.133 de 1º de abril de 2021, designo os militares abaixo relacionados, para cumprir as atribuições de Fiscal de Contrato, celebrado com os respectivos prestadores de serviços:
                  </p>
                  
                  <div className="space-y-4 text-left font-normal text-slate-900">
                    {getReportData().reportList.length === 0 ? (
                      <p className="text-center py-6 text-slate-500 italic border border-slate-300">
                        Nenhum contrato passível de designação sob os critérios especificados.
                      </p>
                    ) : (() => {
                      interface ContractGroup {
                        fiscalTitularId: string;
                        fiscalSubstitutoId: string;
                        contracts: Contract[];
                      }
                      const groups: ContractGroup[] = [];
                      getReportData().reportList.forEach(c => {
                        let group = groups.find(g => g.fiscalTitularId === c.fiscalTitularId && g.fiscalSubstitutoId === c.fiscalSubstitutoId);
                        if (!group) {
                          group = {
                            fiscalTitularId: c.fiscalTitularId,
                            fiscalSubstitutoId: c.fiscalSubstitutoId,
                            contracts: []
                          };
                          groups.push(group);
                        }
                        group.contracts.push(c);
                      });

                      return groups.map((g: ContractGroup, groupIdx: number) => {
                        const titular = fiscais.find(f => f.id === g.fiscalTitularId);
                        const substituto = fiscais.find(f => f.id === g.fiscalSubstitutoId);
                        
                        const formatFiscalName = (f: Fiscal | undefined) => {
                          if (!f) return 'Não designado';
                          const rank = f.postoGraduacao;
                          const fullName = f.name.toUpperCase();
                          const warName = f.warName ? f.warName.toUpperCase() : '';
                          return `${rank} ${fullName}${warName ? ` (${rank} ${warName})` : ''}`;
                        };

                        return (
                          <div key={`${g.fiscalTitularId}-${g.fiscalSubstitutoId}-${groupIdx}`} className="space-y-3">
                            <div className="space-y-3" style={{ lineHeight: '1.0' }}>
                              {g.contracts.map((c: Contract) => (
                                <div key={c.id} className="space-y-1">
                                  <p><span className="font-bold">Nr Contrato:</span> {c.number}</p>
                                  <p><span className="font-bold">Empresa:</span> <span className="font-bold uppercase">{c.contractorName.toUpperCase()}</span></p>
                                  <p><span className="font-bold">CNPJ:</span> {formatCpfCnpj(c.cnpj)}</p>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1" style={{ lineHeight: '1.25' }}>
                              <p className="pl-6">
                                a) Fiscal de Contrato Titular: {formatFiscalName(titular)}
                              </p>
                              <p className="pl-6">
                                b) Fiscal de Contrato Substituto: {formatFiscalName(substituto)}
                              </p>
                            </div>
                            {groupIdx < groups.length - 1 && (
                              <div className="py-2">
                                <div className="border-t border-slate-900 my-2" />
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y-2 divide-slate-950 border-collapse border border-slate-350 text-[10pt] leading-[1.25]" id="report-table">
                  <thead className="bg-slate-100 font-bold">
                    {reportType === 'logs' ? (
                      <tr>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">Data/Horário</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">Militar Responsável</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">Ação Operada</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">Detalhe Estrutural</th>
                      </tr>
                    ) : reportType === 'efetivo_fiscais' ? (
                      <tr>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold w-1/12" title="Posto/Graduação">P/G</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold w-1/3">Identificação Militar</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold w-1/6">CPF</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold w-1/3">Contato (Email/Tel)</th>
                      </tr>
                    ) : reportType === 'usuarios_sistema' ? (
                      <tr>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold w-1/12">Status</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold w-1/3">Identificação e Credenciais</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold w-1/6">CPF</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold w-1/4">Nível de Acesso</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">No. Contrato</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">Razão Social Contratada</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">Objeto e Finalidade Militar</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">Valor Homologado</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">Vigência Término</th>
                        <th className="border border-slate-400 p-2 text-center uppercase font-bold">Situação</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-250">
                    {getReportData().reportList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-500 italic border border-slate-300">
                          Nenhum registro militar passível de auditoria sob os critérios especificados.
                        </td>
                      </tr>
                    ) : (
                      getReportData().reportList.map((item: any, idx: number) => {
                        if (reportType === 'logs') {
                          const adminMatch = admins.find(a => 
                            a.username.toLowerCase() === item.user.toLowerCase() || 
                            a.name.toLowerCase() === item.user.toLowerCase() ||
                            item.user.toLowerCase().includes(a.username.toLowerCase()) ||
                            (a.warName && item.user.toLowerCase().includes(a.warName.toLowerCase()))
                          );
                          const formatRank = (r: string) => {
                            if (!r) return '';
                            const map: Record<string, string> = {
                              '1º sargento': '1º Sgt', '2º sargento': '2º Sgt', '3º sargento': '3º Sgt',
                              'primeiro sargento': '1º Sgt', 'segundo sargento': '2º Sgt', 'terceiro sargento': '3º Sgt',
                              'subtenente': 'S Ten', '1º tenente': '1º Ten', '2º tenente': '2º Ten',
                              'primeiro tenente': '1º Ten', 'segundo tenente': '2º Ten',
                              'tenente coronel': 'Ten Cel', 'tenente-coronel': 'Ten Cel',
                              'capitão': 'Cap', 'capitao': 'Cap', 'major': 'Maj', 'coronel': 'Cel',
                              'tenente': 'Ten', 'sargento': 'Sgt', 'cabo': 'Cb', 'soldado': 'Sd'
                            };
                            return map[r.toLowerCase().trim()] || r;
                          };
                          let standardizedUser = item.user.toUpperCase();
                          if (adminMatch) {
                            const rankAbbrev = adminMatch.rank ? formatRank(adminMatch.rank) + ' ' : '';
                            const namePart = (adminMatch.warName || adminMatch.name).toUpperCase();
                            standardizedUser = `${rankAbbrev}${namePart}`;
                          }
                          let formattedDate = item.date;
                          if (formattedDate && formattedDate.length === 19 && formattedDate.includes(' ')) {
                            const d = new Date(formattedDate.replace(' ', 'T') + 'Z');
                            if (!isNaN(d.getTime())) formattedDate = d.toLocaleString('pt-BR');
                          }
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="border border-slate-300 p-2 whitespace-nowrap text-center font-mono">{formattedDate}</td>
                              <td className="border border-slate-300 p-2 font-semibold text-center">
                                <span className="block font-bold">{standardizedUser}</span>
                                <span className="text-[9px] text-slate-500 uppercase block">({item.role})</span>
                              </td>
                              <td className="border border-slate-300 p-2 font-bold text-amber-900 text-center">{item.action}</td>
                              <td className="border border-slate-300 p-2 text-[10px]">{item.detail}</td>
                            </tr>
                          );
                        } else if (reportType === 'efetivo_fiscais') {
                          return (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="border border-slate-300 p-2 text-center whitespace-nowrap font-bold">{item.postoGraduacao}</td>
                              <td className="border border-slate-300 p-2 whitespace-normal break-words">
                                {item.name}
                                {item.warName && (
                                  <span className="block font-bold mt-0.5">({item.warName})</span>
                                )}
                              </td>
                              <td className="border border-slate-300 p-2 text-center whitespace-nowrap">{item.cpf}</td>
                              <td className="border border-slate-300 p-2 text-center text-[10px] whitespace-normal break-words">{item.email}<br/>{item.phone}</td>
                            </tr>
                          );
                        } else if (reportType === 'usuarios_sistema') {
                          return (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="border border-slate-300 p-2 text-center whitespace-nowrap font-bold text-[10px]">
                                <span className={item.active ? 'text-emerald-700' : 'text-red-700'}>
                                  {item.active ? 'ATIVO' : 'INATIVO'}
                                </span>
                              </td>
                              <td className="border border-slate-300 p-2 whitespace-normal break-words">
                                {item.name}
                                {item.warName && (
                                  <span className="block font-bold mt-0.5">({item.warName})</span>
                                )}
                                <span className="block text-[10px] text-slate-500 mt-1 font-mono uppercase">LGN: {item.username}</span>
                              </td>
                              <td className="border border-slate-300 p-2 text-center whitespace-nowrap">{item.cpf}</td>
                              <td className="border border-slate-300 p-2 text-center whitespace-nowrap font-bold uppercase text-[10px]">{item.role}</td>
                            </tr>
                          );
                        } else {
                          return (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="border border-slate-300 p-2 font-bold whitespace-nowrap">{item.number}</td>
                              <td className="border border-slate-300 p-2">{item.contractorName} <span className="text-[9px] block text-slate-500">CNPJ: {item.cnpj}</span></td>
                              <td className="border border-slate-300 p-2 leading-tight">{item.object}</td>
                              <td className="border border-slate-300 p-2 text-right font-bold whitespace-nowrap">
                                {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="border border-slate-300 p-2 text-center whitespace-nowrap">
                                {item.endDate.split('-').reverse().join('/')}
                              </td>
                              <td className="border border-slate-300 p-2 text-center font-bold text-[9.5px]">
                                {item.status.toUpperCase().replace('_', ' ')}
                              </td>
                            </tr>
                          );
                        }
                      })
                    )}
                  </tbody>
                </table>
              </div>
              )}

              {/* Total Aggregate math footer for printable format */}
              {reportType !== 'logs' && reportType !== 'efetivo_fiscais' && reportType !== 'designacao_fiscais' && getReportData().reportList.length > 0 && (
                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 text-right space-y-1 rounded">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Metrificação da Amostra</p>
                    <p className="font-bold text-slate-900 text-xs">
                      Valor Geral Consolidado: {getReportData().reportList.reduce((sum, item) => sum + item.value, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              )}

              {/* Standard military signature field */}
              <div className="pt-16 pb-8 text-center flex flex-col items-center">
                <div className="w-64 border-t border-slate-900 mb-1" />
                <p className="font-semibold uppercase tracking-wide text-[10px]">{currentUser.name}</p>
                <p className="text-[9px] text-slate-600 tracking-wider">Matrícula SGC-71BIMTZ / {currentUser.role === 'admin' || currentUser.role === 'gestor' ? 'GESTOR MASTER DE CONTRATOS' : 'FISCAL DESIGNADO'}</p>
                <p className="text-[8px] text-slate-500 italic mt-0.5">Assinado digitalmente por auditoria corporativa interna.</p>
              </div>

            </div>

          </div>
        )}

        {/* TAB 5: SYSTEM LOGS TAB (Admin only) */}
        {activeTab === 'logs' && (currentUser.role === 'admin' || currentUser.role === 'gestor') && (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <h2 className="text-lg font-display font-semibold text-white">Logs de Auditoria e Conformidade</h2>
                <p className="text-xs text-slate-400 mt-1">Registros de segurança rastreados para auditorias físicas externas do Batalhão.</p>
              </div>
              <button 
                onClick={async () => {
                  await fetchAllData();
                  showToast('Logs de auditoria sincronizados com sucesso.', 'success');
                }}
                className="px-3 py-1.5 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Sincronizar Logs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700 text-xs font-mono">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider">Ip Address</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider">Usuario / Rol</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider">Operacao</th>
                    <th className="px-4 py-3 text-left font-bold text-slate-400 uppercase tracking-wider">Detalhe das Modificoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-750/70">
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                        {(() => {
                          if (log.date && log.date.length === 19 && log.date.includes(' ')) {
                            const isoStr = log.date.replace(' ', 'T') + 'Z';
                            const d = new Date(isoStr);
                            if (!isNaN(d.getTime())) return d.toLocaleString('pt-BR');
                          }
                          return log.date;
                        })()}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{log.ipAddress}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {(() => {
                          const adminMatch = admins.find(a => 
                            a.username.toLowerCase() === log.user.toLowerCase() || 
                            a.name.toLowerCase() === log.user.toLowerCase() ||
                            log.user.toLowerCase().includes(a.username.toLowerCase()) ||
                            (a.warName && log.user.toLowerCase().includes(a.warName.toLowerCase()))
                          );
                          
                          const formatRank = (r: string) => {
                            if (!r) return '';
                            const map: Record<string, string> = {
                              '1º sargento': '1º Sgt', '2º sargento': '2º Sgt', '3º sargento': '3º Sgt',
                              'primeiro sargento': '1º Sgt', 'segundo sargento': '2º Sgt', 'terceiro sargento': '3º Sgt',
                              'subtenente': 'S Ten', '1º tenente': '1º Ten', '2º tenente': '2º Ten',
                              'primeiro tenente': '1º Ten', 'segundo tenente': '2º Ten',
                              'tenente coronel': 'Ten Cel', 'tenente-coronel': 'Ten Cel',
                              'capitão': 'Cap', 'capitao': 'Cap', 'major': 'Maj', 'coronel': 'Cel',
                              'tenente': 'Ten', 'sargento': 'Sgt', 'cabo': 'Cb', 'soldado': 'Sd'
                            };
                            const lower = r.toLowerCase().trim();
                            return map[lower] || r;
                          };

                          let standardizedUser = log.user.toUpperCase();
                          if (adminMatch) {
                            const rankAbbrev = adminMatch.rank ? formatRank(adminMatch.rank) + ' ' : '';
                            const namePart = (adminMatch.warName || adminMatch.name).toUpperCase();
                            standardizedUser = `${rankAbbrev}${namePart}`;
                          }
                          
                          return (
                            <>
                              <span className="font-bold text-emerald-450">{standardizedUser}</span>
                              <span className="text-[10px] text-slate-500 block">({log.role.toUpperCase()})</span>
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          log.action.includes('EXCLUIDO') || log.action.includes('FALHA')
                            ? 'bg-red-950/60 text-red-400 border-red-900/50' 
                            : log.action.includes('CADASTRADO') 
                            ? 'bg-emerald-950 text-emerald-440 border-emerald-900/50' 
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 leading-tight">{log.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: BACKUP & DATABASE MANAGEMENT */}
        {activeTab === 'backups' && (currentUser.role === 'admin' || currentUser.role === 'gestor') && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Backups Panel Actions */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md space-y-4">
                <h2 className="text-lg font-display font-semibold text-white border-b border-slate-700 pb-2.5 flex items-center gap-1.5">
                  <Database className="h-5 w-5 text-emerald-400" />
                  Operações de Backup
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gere backups físicos completos na pasta institucional local. Os backups registram todos os contratos, fiscais e logs do sistema, blindando contra perdas.
                </p>

                <div className="space-y-3.5 pt-3">
                  <button
                    onClick={handleGenerateBackup}
                    className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg font-display uppercase tracking-wider transition-colors cursor-pointer block border border-emerald-600 text-center shadow-md"
                  >
                    Gerar Novo Backup Local
                  </button>

                  <a
                    href="/api/database/export"
                    download
                    onClick={() => {
                      const now = new Date().toLocaleString('pt-BR');
                      showToast(`Exportação do banco iniciada em: ${now}`, 'info');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-750 text-sky-400 font-bold text-xs py-3 rounded-lg font-display uppercase tracking-wider transition-colors cursor-pointer border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Download className="h-4.5 w-4.5" />
                    Exportar SQLite JSON
                  </a>
                </div>
              </div>

              {/* Maintenance & Dangerous Operations */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md space-y-4 md:col-span-2 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-display font-semibold text-white border-b border-slate-700 pb-2.5 flex items-center gap-1.5">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    Manutenção & Ambientes de Testes
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sendo este um sistema militar focado no funcionamento offline e local absoluto, você pode redefinir o banco de dados principal para o estado limpo inicial a qualquer momento do fluxo de validação.
                  </p>

                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-300 space-y-1.5 mt-4">
                    <p className="font-semibold text-slate-200">Aviso Militar de Segurança:</p>
                    <p>O reset limpará novos contratos customizados e restabelecerá a carga de semeadura do 71º BATALHÃO DE INFANTARIA MOTORIZADO.</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleResetDatabase}
                    className="px-4 py-2 bg-red-955/20 border border-red-900 hover:bg-red-900/80 hover:text-white text-red-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Reinicializar Banco de Dados
                  </button>
                </div>
              </div>

            </div>

            {/* List of existing physical backup dumps */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md overflow-hidden">
              <div className="p-4 bg-slate-900/60 uppercase text-[10px] font-bold font-mono tracking-wider text-slate-400 border-b border-slate-700">
                Histórico de Cópias Físicas Encontradas em Backups/ ({backups.length})
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700 text-sm">
                  <thead className="bg-slate-900/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase font-sans text-slate-400">Nome do Arquivo Físico</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase font-sans text-slate-400">Data de Geração</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase font-sans text-slate-400">Tamanho</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase font-sans text-slate-400">Tipo</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 font-mono text-xs">
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500 font-sans">
                          Nenhum arquivo de backup físico foi detectado no diretório local.
                        </td>
                      </tr>
                    ) : (
                      backups.map((b) => (
                        <tr key={b.filename} className="hover:bg-slate-700/50">
                          <td className="px-6 py-3.5 text-white select-all">{b.filename}</td>
                          <td className="px-6 py-3.5 text-slate-300">
                            {(() => {
                              const m = b.filename.match(/backup_contratos_(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.sqlite/);
                              if (m) {
                                const d = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`);
                                return d.toLocaleString('pt-BR');
                              }
                              return b.date;
                            })()}
                          </td>
                          <td className="px-6 py-3.5 text-slate-400">{b.size}</td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.type === 'manual' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                              {b.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <button
                              onClick={() => handleRestoreBackup(b.filename)}
                              className="px-3 py-1 bg-amber-950/80 text-amber-400 border border-amber-900 rounded hover:bg-amber-900 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer font-sans"
                            >
                              Restaurar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* --- FORM MODALS --- */}

      {/* MODAL 1: CONTRACT ADD/EDIT FORM MODAL */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-750 flex justify-between items-center">
              <h3 className="text-base font-display font-semibold text-white uppercase tracking-wide">
                {editingContract ? `Modificar Contrato Administrativo ${editingContract.number}` : 'Homologar Novo Contrato Administrativo'}
              </h3>
              <button 
                onClick={() => setIsContractModalOpen(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Nº do Contrato</label>
                  <input
                    type="text"
                    required
                    value={contractForm.number}
                    onChange={(e) => setContractForm(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="Ex: 12/2026-71BIMTz"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Razão Social Contratada</label>
                  <input
                    type="text"
                    required
                    value={contractForm.contractorName}
                    onChange={(e) => setContractForm(prev => ({ ...prev, contractorName: e.target.value }))}
                    placeholder="Nome fantasia ou razão comercial"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Objeto Contratual / Finalidade</label>
                <textarea
                  required
                  rows={2}
                  value={contractForm.object}
                  onChange={(e) => setContractForm(prev => ({ ...prev, object: e.target.value }))}
                  placeholder="Descreva minuciosamente a finalidade do contrato e sua dotação orçamentária do Batalhão..."
                  className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">CNPJ / CPF da Contratada</label>
                  <input
                    type="text"
                    required
                    value={contractForm.cnpj}
                    onChange={(e) => setContractForm(prev => ({ ...prev, cnpj: formatCpfCnpj(e.target.value) }))}
                    placeholder="Ex: 00.000.000/0000-00 ou 000.000.000-00"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Valor Total do Contrato (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={contractForm.value}
                    onChange={(e) => setContractForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                    placeholder="0.00"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Data de Início da Vigência</label>
                  <input
                    type="date"
                    required
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Data Limite de Término</label>
                  <input
                    type="date"
                    required
                    value={contractForm.endDate}
                    onChange={(e) => setContractForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Fiscais designations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-500 font-sans">Fiscal Titular Designado</label>
                  <select
                    value={contractForm.fiscalTitularId}
                    onChange={(e) => setContractForm(prev => ({ ...prev, fiscalTitularId: e.target.value }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-xs px-3 py-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="">Selecione o militar titular...</option>
                    {[...fiscais]
                      .filter(f => f.role === 'titular' || f.role === 'ambos' || f.id === contractForm.fiscalTitularId)
                      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                      .map(f => (
                        <option key={f.id} value={f.id}>{f.postoGraduacao} {f.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Fiscal Substituto</label>
                  <select
                    value={contractForm.fiscalSubstitutoId}
                    onChange={(e) => setContractForm(prev => ({ ...prev, fiscalSubstitutoId: e.target.value }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-xs px-3 py-2.5 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="">Selecione o militar substituto eventual...</option>
                    {[...fiscais]
                      .filter(f => f.role === 'substituto' || f.role === 'ambos' || f.id === contractForm.fiscalSubstitutoId)
                      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                      .map(f => (
                        <option key={f.id} value={f.id}>{f.postoGraduacao} {f.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Upload pdf segment */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Documentos Digitalizados PDF</label>
                <div className="mt-1 flex gap-3 items-center">
                  <input
                    type="file"
                    accept=".pdf"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-900 text-xs border border-slate-700 text-slate-305 font-semibold rounded-lg hover:bg-slate-755 flex items-center gap-1 cursor-pointer"
                  >
                    <Paperclip className="h-4.5 w-4.5" />
                    Adicionar Anexo PDF
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {contractForm.selectedFiles.length} arquivo(s) prontos para gravação física
                  </span>
                </div>

                {contractForm.selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {contractForm.selectedFiles.map((f, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 truncate font-mono">{f.name} ({f.size})</span>
                        <button
                          type="button"
                          onClick={() => setContractForm(prev => ({ ...prev, selectedFiles: prev.selectedFiles.filter((_, i) => i !== idx) }))}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Anotações Diversas de Lançamento</label>
                <textarea
                  rows={2}
                  value={contractForm.observations}
                  onChange={(e) => setContractForm(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Informações adicionais do batalhão..."
                  className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2 text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-750">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border border-emerald-600"
                >
                  Confirmar e Gravar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FISCAL MATRICULA ADD/EDIT FORM MODAL */}
      {isFiscalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-750 flex justify-between items-center">
              <h3 className="text-base font-display font-semibold text-white uppercase tracking-wide">
                {editingFiscal ? 'Modificar Registro de Fiscal' : 'Cadastro de Fiscal'}
              </h3>
              <button 
                onClick={() => setIsFiscalModalOpen(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFiscal} className="p-6 space-y-4">
              
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Posto/Grad</label>
                  <select
                    value={fiscalForm.postoGraduacao}
                    onChange={(e: any) => setFiscalForm(prev => ({ ...prev, postoGraduacao: e.target.value }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-xs px-2.5 py-3 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Cel">Cel</option>
                    <option value="TC">TC</option>
                    <option value="Maj">Maj</option>
                    <option value="Cap">Cap</option>
                    <option value="1º Ten">1º Ten</option>
                    <option value="2º Ten">2º Ten</option>
                    <option value="Subten">Subten</option>
                    <option value="1º Sgt">1º Sgt</option>
                    <option value="2º Sgt">2º Sgt</option>
                    <option value="3º Sgt">3º Sgt</option>
                    <option value="Cb">Cb</option>
                    <option value="Sd">Sd</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={fiscalForm.name}
                    onChange={(e) => setFiscalForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Carlos Alberto Silva"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">CPF</label>
                  <input
                    type="text"
                    required
                    value={fiscalForm.cpf}
                    onChange={(e) => setFiscalForm(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                    placeholder="Ex: 111.222.333-44"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Nome de Guerra</label>
                  <input
                    type="text"
                    required
                    value={fiscalForm.warName}
                    onChange={(e) => setFiscalForm(prev => ({ ...prev, warName: e.target.value }))}
                    placeholder="Ex: Silva"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans font-mono text-[10.5px]">Email Institucional</label>
                  <input
                    type="email"
                    required
                    value={fiscalForm.email}
                    onChange={(e) => setFiscalForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Ex: silva.carlos@eb.mil.br"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Telefone/Whatsapp</label>
                  <input
                    type="text"
                    value={fiscalForm.phone}
                    onChange={(e) => setFiscalForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                    placeholder="(87) 99122-3344"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Tipo de comissão</label>
                  <select
                    value={fiscalForm.role}
                    onChange={(e: any) => setFiscalForm(prev => ({ ...prev, role: e.target.value }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-xs px-3 py-3 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="titular">Titular Nato</option>
                    <option value="substituto">Substituto Eventual</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Status Inicial</label>
                  <select
                    value={fiscalForm.status}
                    onChange={(e: any) => setFiscalForm(prev => ({ ...prev, status: e.target.value }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-xs px-3 py-3 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo / Afastado</option>
                  </select>
                </div>
              </div>

              {!editingFiscal && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-900 rounded-lg text-slate-300 text-[11px] leading-relaxed">
                  <div className="flex gap-2">
                    <Info className="h-4.5 w-4.5 text-emerald-450 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-350">Credencial automática</p>
                      <p className="mt-0.5">Ao cadastrar o fiscal, um usuário de acesso é criado. O login será o <span className="font-bold text-emerald-400">nome de guerra</span> (em letras minúsculas) e a senha inicial será o nome de guerra seguido por <span className="font-bold font-mono text-emerald-400">123</span>.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-750">
                <button
                  type="button"
                  onClick={() => setIsFiscalModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border border-emerald-600"
                >
                  Registrar Fiscal
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Admin Modal Form */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 z-50 print:hidden overflow-y-auto">
          <div className="bg-slate-850 rounded-xl max-w-2xl w-full border border-slate-700 shadow-2xl relative my-6">
            
            <div className="absolute top-4 right-4 cursor-pointer text-slate-400 hover:text-white bg-slate-800 p-1 rounded-md" onClick={() => setIsAdminModalOpen(false)}>
              <X className="h-5 w-5" />
            </div>

            <div className="p-6 border-b border-slate-750">
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-emerald-500" />
                {editingAdmin ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                {editingAdmin ? `Atualizando informações de ${editingAdmin.name}` : 'Preencha todos os dados do novo usuário.'}
              </p>
            </div>

            <form onSubmit={handleSaveAdmin} className="p-6 space-y-5" autoComplete="off">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={adminForm.name}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo do administrador"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">CPF</label>
                  <input
                    type="text"
                    required
                    value={adminForm.cpf}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                    placeholder="Ex: 111.222.333-44"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Posto/Graduação</label>
                  <select
                    required
                    value={adminForm.rank}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, rank: e.target.value }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>Selecione o Posto/Graduação</option>
                    <option value="Gen Ex">Gen Ex</option>
                    <option value="Gen Div">Gen Div</option>
                    <option value="Gen Bda">Gen Bda</option>
                    <option value="Cel">Cel</option>
                    <option value="TC">TC</option>
                    <option value="Maj">Maj</option>
                    <option value="Cap">Cap</option>
                    <option value="1º Ten">1º Ten</option>
                    <option value="2º Ten">2º Ten</option>
                    <option value="Asp">Asp</option>
                    <option value="Subten">Subten</option>
                    <option value="1º Sgt">1º Sgt</option>
                    <option value="2º Sgt">2º Sgt</option>
                    <option value="3º Sgt">3º Sgt</option>
                    <option value="Cb">Cb</option>
                    <option value="Sd">Sd</option>
                    <option value="Sv Civ">Sv Civ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Nome de Guerra</label>
                  <input
                    type="text"
                    required
                    value={adminForm.warName}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, warName: e.target.value }))}
                    placeholder="Nome de Guerra"
                    autoComplete="off"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Prec-CP</label>
                  <input
                    type="text"
                    required
                    value={adminForm.precCp}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, precCp: e.target.value }))}
                    placeholder="Prec-CP do administrador"
                    autoComplete="off"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Identidade Militar</label>
                  <input
                    type="text"
                    required
                    value={adminForm.identity}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, identity: e.target.value }))}
                    placeholder="Ex: 000000000-0"
                    autoComplete="off"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">E-mail</label>
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exercito.eb.mil.br"
                    autoComplete="off"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Telefone de Contato</label>
                  <input
                    type="text"
                    required
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                    autoComplete="off"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Nome de Usuário (Login)</label>
                  <input
                    type="text"
                    required
                    value={adminForm.username}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Ex: admin_silva"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Senha</label>
                  <input
                    key={editingAdmin ? editingAdmin.id : 'new'}
                    type="password"
                    required={!editingAdmin}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editingAdmin ? 'Deixe em branco para manter a senha atual' : 'Senha do usuário'}
                    autoComplete="new-password"
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Tipo de Perfil</label>
                  <select
                    required
                    value={adminForm.role}
                    onChange={(e: any) => setAdminForm(prev => ({ ...prev, role: e.target.value }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-sm px-3 py-2.5 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="admin">Administrador Master (Acesso Total)</option>
                    <option value="gestor">Gestor (Admin sem cadastro de usuários)</option>
                    <option value="fiscal">Fiscal (Somente Leitura)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Define os privilégios de acesso do usuário no sistema.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">Status Inicial</label>
                  <select
                    value={adminForm.active ? 'true' : 'false'}
                    onChange={(e: any) => setAdminForm(prev => ({ ...prev, active: e.target.value === 'true' }))}
                    className="mt-1 block w-full bg-slate-700 border border-slate-500 rounded-lg text-xs px-3 py-3 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="true">Ativo (Acesso Liberado)</option>
                    <option value="false">Inativo (Acesso Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-750">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border border-emerald-600"
                >
                  Salvar Usuário
                </button>
              </div>

            </form>
          </div>
        </div>
      )}



      {/* Military Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 pb-4 px-4 text-center text-xs font-mono text-slate-500 shrink-0 print:hidden shadow-inner space-y-1">
        <div>
          71º BATALHÃO DE INFANTARIA MOTORIZADO
        </div>
        <div className="text-[9px] text-slate-600">
          Rodovia BR 423, Km 96, s/n - Heliópolis, Garanhuns - PE, 55296-630 &bull; Versão {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.5.0'} (Build {typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'local'} - {typeof __GIT_DATE__ !== 'undefined' ? __GIT_DATE__ : 'dev'})
        </div>
        <div className="text-[10px] text-slate-500">
          Direitos Autorais Reservados &copy; 2026 71º BI Mtz &bull; Desenvolvido por 1º Sgt Gaudencio
        </div>
      </footer>

    </div>
  );
}
