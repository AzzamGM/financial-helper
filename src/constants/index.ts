import type { AppData, Category } from '../types';

export const STORAGE_KEY = 'finance-helper:data:v1';

export const EXPORT_VERSION = 1;

export const PDF_DATA_PREFIX = '@@FINANCE_HELPER_DATA_START@@';
export const PDF_DATA_SUFFIX = '@@FINANCE_HELPER_DATA_END@@';

export const APP_NAME = 'Finance Helper';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-salary', name: 'Salary', color: '#16a34a', isCustom: false },
  { id: 'cat-freelance', name: 'Freelance', color: '#0d9488', isCustom: false },
  { id: 'cat-groceries', name: 'Groceries', color: '#f59e0b', isCustom: false },
  { id: 'cat-utilities', name: 'Utilities', color: '#3b82f6', isCustom: false },
  { id: 'cat-entertainment', name: 'Entertainment', color: '#8b5cf6', isCustom: false },
  { id: 'cat-healthcare', name: 'Healthcare', color: '#ec4899', isCustom: false },
  { id: 'cat-transport', name: 'Transport', color: '#06b6d4', isCustom: false },
  { id: 'cat-dining', name: 'Dining', color: '#ef4444', isCustom: false },
  { id: 'cat-shopping', name: 'Shopping', color: '#d946ef', isCustom: false },
  { id: 'cat-other', name: 'Other', color: '#6b7280', isCustom: false },
];

export const INCOME_CATEGORY_NAMES = ['Salary', 'Freelance'];

export const COLOR_PALETTE = [
  '#16a34a', '#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6',
  '#ec4899', '#06b6d4', '#ef4444', '#d946ef', '#6b7280',
  '#84cc16', '#f97316', '#14b8a6', '#a855f7', '#0ea5e9',
];

export const DEFAULT_DATA: AppData = {
  transactions: [],
  budgets: [],
  savingsGoals: [],
  categories: DEFAULT_CATEGORIES,
  templates: [],
  settings: { darkMode: false, lastBackupDate: null },
};
