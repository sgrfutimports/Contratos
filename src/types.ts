/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'fiscal';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  active: boolean;
  cpf?: string;
  rank?: string;
  warName?: string;
}

export type PostoGraduacao = 
  | 'Cel' 
  | 'TC' 
  | 'Maj' 
  | 'Cap' 
  | '1º Ten' 
  | '2º Ten' 
  | 'Subten' 
  | '1º Sgt' 
  | '2º Sgt' 
  | '3º Sgt' 
  | 'Cb' 
  | 'Sd';

export interface Fiscal {
  id: string;
  name: string;
  postoGraduacao: PostoGraduacao;
  warName: string;
  cpf: string;
  email: string;
  phone: string;
  role: 'titular' | 'substituto' | 'ambos';
  status: 'ativo' | 'inativo';
}

export type ContractStatus = 'ativo' | 'suspenso' | 'encerrado' | 'vencido' | 'em_vencimento';

export interface ContractHistoryItem {
  id: string;
  date: string;
  user: string;
  action: string;
  detail: string;
}

export interface ContractDocument {
  id: string;
  name: string;
  filename: string;
  uploadDate: string;
  size: string;
  content?: string; // base64 representation if sent inline
}

export interface Contract {
  id: string;
  number: string; // e.g. "05/2026-71BIMTz"
  object: string;
  contractorName: string;
  cnpj: string;
  value: number;
  startDate: string;
  endDate: string;
  termMonths: number;
  status: ContractStatus;
  fiscalTitularId: string;
  fiscalSubstitutoId: string;
  observations: string;
  documents: ContractDocument[];
  history: ContractHistoryItem[];
}

export interface Notification {
  id: string;
  contractId: string;
  contractNumber: string;
  message: string;
  severity: 'green' | 'yellow' | 'red'; // representing safety standard alerts
  daysRemaining: number;
  read: boolean;
  date: string;
}

export interface SystemLog {
  id: string;
  date: string;
  user: string;
  role: string;
  action: string;
  detail: string;
  ipAddress: string;
}

export interface BackupInfo {
  filename: string;
  date: string;
  size: string;
  type: 'manual' | 'automatico';
}
