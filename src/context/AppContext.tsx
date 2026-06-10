import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_DATA, STORAGE_KEY } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { uid } from '../utils/format';
import type {
  AppData,
  Budget,
  Category,
  SavingsGoal,
  Settings,
  Transaction,
  TransactionTemplate,
} from '../types';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextValue {
  data: AppData;

  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  upsertBudget: (b: Omit<Budget, 'id'> & { id?: string }) => void;
  deleteBudget: (id: string) => void;

  addGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt' | 'completed'>) => void;
  updateGoal: (id: string, patch: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  toggleGoalComplete: (id: string) => void;

  addCategory: (name: string, color: string) => void;
  deleteCategory: (id: string) => void;

  addTemplate: (t: Omit<TransactionTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;

  toggleDarkMode: () => void;

  replaceAll: (data: AppData) => void;
  mergeData: (incoming: AppData) => void;
  clearAll: () => void;
  markBackup: () => void;

  toasts: Toast[];
  notify: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData, onPersist] = useLocalStorage<AppData>(STORAGE_KEY, DEFAULT_DATA);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = uid('toast');
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => onPersist(() => notify('Changes saved', 'info')), [onPersist, notify]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.settings.darkMode);
  }, [data.settings.darkMode]);

  const addTransaction = useCallback<AppContextValue['addTransaction']>((t) => {
    setData((d) => ({
      ...d,
      transactions: [
        { ...t, id: uid('tx'), createdAt: new Date().toISOString() },
        ...d.transactions,
      ],
    }));
  }, [setData]);

  const updateTransaction = useCallback<AppContextValue['updateTransaction']>((id, patch) => {
    setData((d) => ({
      ...d,
      transactions: d.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, [setData]);

  const deleteTransaction = useCallback<AppContextValue['deleteTransaction']>((id) => {
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
  }, [setData]);

  const upsertBudget = useCallback<AppContextValue['upsertBudget']>((b) => {
    setData((d) => {

      const existing = d.budgets.find(
        (x) => x.category === b.category && x.month === b.month && x.year === b.year,
      );
      if (existing) {
        return {
          ...d,
          budgets: d.budgets.map((x) =>
            x.id === existing.id ? { ...x, amount: b.amount } : x,
          ),
        };
      }
      return { ...d, budgets: [...d.budgets, { ...b, id: b.id ?? uid('bud') }] };
    });
  }, [setData]);

  const deleteBudget = useCallback<AppContextValue['deleteBudget']>((id) => {
    setData((d) => ({ ...d, budgets: d.budgets.filter((b) => b.id !== id) }));
  }, [setData]);

  const addGoal = useCallback<AppContextValue['addGoal']>((g) => {
    setData((d) => ({
      ...d,
      savingsGoals: [
        ...d.savingsGoals,
        { ...g, id: uid('goal'), createdAt: new Date().toISOString(), completed: false },
      ],
    }));
  }, [setData]);

  const updateGoal = useCallback<AppContextValue['updateGoal']>((id, patch) => {
    setData((d) => ({
      ...d,
      savingsGoals: d.savingsGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  }, [setData]);

  const deleteGoal = useCallback<AppContextValue['deleteGoal']>((id) => {
    setData((d) => ({ ...d, savingsGoals: d.savingsGoals.filter((g) => g.id !== id) }));
  }, [setData]);

  const toggleGoalComplete = useCallback<AppContextValue['toggleGoalComplete']>((id) => {
    setData((d) => ({
      ...d,
      savingsGoals: d.savingsGoals.map((g) =>
        g.id === id ? { ...g, completed: !g.completed } : g,
      ),
    }));
  }, [setData]);

  const addCategory = useCallback<AppContextValue['addCategory']>((name, color) => {
    setData((d) => {
      const trimmed = name.trim();
      if (!trimmed) return d;
      if (d.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return d;
      return {
        ...d,
        categories: [...d.categories, { id: uid('cat'), name: trimmed, color, isCustom: true }],
      };
    });
  }, [setData]);

  const deleteCategory = useCallback<AppContextValue['deleteCategory']>((id) => {
    setData((d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }));
  }, [setData]);

  const addTemplate = useCallback<AppContextValue['addTemplate']>((t) => {
    setData((d) => ({ ...d, templates: [...d.templates, { ...t, id: uid('tpl') }] }));
  }, [setData]);

  const deleteTemplate = useCallback<AppContextValue['deleteTemplate']>((id) => {
    setData((d) => ({ ...d, templates: d.templates.filter((t) => t.id !== id) }));
  }, [setData]);

  const toggleDarkMode = useCallback(() => {
    setData((d) => ({ ...d, settings: { ...d.settings, darkMode: !d.settings.darkMode } }));
  }, [setData]);

  const markBackup = useCallback(() => {
    setData((d) => ({ ...d, settings: { ...d.settings, lastBackupDate: new Date().toISOString() } }));
  }, [setData]);

  const replaceAll = useCallback<AppContextValue['replaceAll']>((incoming) => {
    setData(() => normalize(incoming));
  }, [setData]);

  const mergeData = useCallback<AppContextValue['mergeData']>((incoming) => {
    setData((d) => {
      const norm = normalize(incoming);
      return {
        transactions: dedupeById([...d.transactions, ...norm.transactions]),
        budgets: dedupeById([...d.budgets, ...norm.budgets]),
        savingsGoals: dedupeById([...d.savingsGoals, ...norm.savingsGoals]),
        categories: dedupeByName([...d.categories, ...norm.categories]),
        templates: dedupeById([...d.templates, ...norm.templates]),
        settings: d.settings,
      };
    });
  }, [setData]);

  const clearAll = useCallback(() => {
    setData((d) => ({ ...DEFAULT_DATA, settings: d.settings }));
  }, [setData]);

  const value = useMemo<AppContextValue>(() => ({
    data,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    upsertBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalComplete,
    addCategory,
    deleteCategory,
    addTemplate,
    deleteTemplate,
    toggleDarkMode,
    replaceAll,
    mergeData,
    clearAll,
    markBackup,
    toasts,
    notify,
    dismissToast,
  }), [
    data, addTransaction, updateTransaction, deleteTransaction, upsertBudget, deleteBudget,
    addGoal, updateGoal, deleteGoal, toggleGoalComplete, addCategory, deleteCategory,
    addTemplate, deleteTemplate,
    toggleDarkMode, replaceAll, mergeData, clearAll, markBackup, toasts, notify, dismissToast,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function dedupeByName(items: Category[]): Category[] {
  const seen = new Set<string>();
  const out: Category[] = [];
  for (const c of items) {
    const key = c.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

function normalize(incoming: AppData): AppData {
  const settings: Settings = {
    darkMode: Boolean(incoming.settings?.darkMode),
    lastBackupDate: incoming.settings?.lastBackupDate ?? null,
  };
  return {
    transactions: Array.isArray(incoming.transactions) ? incoming.transactions : [],
    budgets: Array.isArray(incoming.budgets) ? incoming.budgets : [],
    savingsGoals: Array.isArray(incoming.savingsGoals) ? incoming.savingsGoals : [],
    categories:
      Array.isArray(incoming.categories) && incoming.categories.length > 0
        ? incoming.categories
        : DEFAULT_DATA.categories,
    templates: Array.isArray(incoming.templates) ? incoming.templates : [],
    settings,
  };
}
