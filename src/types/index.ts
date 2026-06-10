

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: TransactionType;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
  completed: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isCustom: boolean;
}

export interface TransactionTemplate {
  id: string;
  label: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;

  dayOfMonth?: number;
}

export interface Settings {
  darkMode: boolean;
  lastBackupDate: string | null;
}

export interface AppData {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  categories: Category[];
  templates: TransactionTemplate[];
  settings: Settings;
}

export interface ExportPayload {
  app: 'finance-helper';
  version: number;
  exportedAt: string;
  data: Omit<AppData, 'settings'> & { settings: Settings };
}
