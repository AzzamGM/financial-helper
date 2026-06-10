import type { Budget, SavingsGoal, Transaction } from '../types';

export interface Totals {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export function computeTotals(transactions: Transaction[]): Totals {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else expenses += t.amount;
  }
  const balance = income - expenses;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;
  return { income, expenses, balance, savingsRate };
}

export function isSameMonth(iso: string, month: number, year: number): boolean {
  const d = new Date(iso);
  return d.getMonth() === month && d.getFullYear() === year;
}

export function filterByMonth(transactions: Transaction[], month: number, year: number): Transaction[] {
  return transactions.filter((t) => isSameMonth(t.date, month, year));
}

export function expensesByCategory(transactions: Transaction[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
  }
  return acc;
}

export interface MonthlyBucket {
  key: string;
  month: number;
  year: number;
  income: number;
  expenses: number;
}

export function monthlyBuckets(transactions: Transaction[], count = 12, ref = new Date()): MonthlyBucket[] {
  const buckets: MonthlyBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    buckets.push({
      key: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      month: d.getMonth(),
      year: d.getFullYear(),
      income: 0,
      expenses: 0,
    });
  }
  const index = new Map(buckets.map((b) => [`${b.year}-${b.month}`, b]));
  for (const t of transactions) {
    const d = new Date(t.date);
    const b = index.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!b) continue;
    if (t.type === 'income') b.income += t.amount;
    else b.expenses += t.amount;
  }
  return buckets;
}

export function monthlyBucketsBetween(
  transactions: Transaction[],
  start: Date,
  end: Date,
): MonthlyBucket[] {
  const buckets: MonthlyBucket[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  let guard = 0;
  while (cursor <= last && guard < 600 /* ~50 years safety cap */) {
    buckets.push({
      key: cursor.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      month: cursor.getMonth(),
      year: cursor.getFullYear(),
      income: 0,
      expenses: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
    guard++;
  }
  const index = new Map(buckets.map((b) => [`${b.year}-${b.month}`, b]));
  for (const t of transactions) {
    const d = new Date(t.date);
    const b = index.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!b) continue;
    if (t.type === 'income') b.income += t.amount;
    else b.expenses += t.amount;
  }
  return buckets;
}

export function spendingTrend(transactions: Transaction[]): { date: string; amount: number }[] {
  const byDay = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percent: number; // can exceed 100
  overBudget: boolean;
}

export function budgetStatuses(
  budgets: Budget[],
  transactions: Transaction[],
  month: number,
  year: number,
): BudgetStatus[] {
  const monthTx = filterByMonth(transactions, month, year);
  const spentByCat = expensesByCategory(monthTx);
  return budgets
    .filter((b) => b.month === month && b.year === year)
    .map((budget) => {
      const spent = spentByCat[budget.category] ?? 0;
      const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return {
        budget,
        spent,
        remaining: budget.amount - spent,
        percent,
        overBudget: spent > budget.amount,
      };
    });
}

export interface GoalProgress {
  percent: number; // 0-100, clamped
  monthsLeft: number;
  monthlyNeeded: number;
  isOverdue: boolean;
}

export function goalProgress(goal: SavingsGoal, ref = new Date()): GoalProgress {
  const percent = goal.targetAmount > 0
    ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    : 0;
  const deadline = new Date(goal.deadline);
  const monthsLeft = Math.max(
    0,
    (deadline.getFullYear() - ref.getFullYear()) * 12 + (deadline.getMonth() - ref.getMonth()),
  );
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
  const isOverdue = !goal.completed && deadline.getTime() < ref.getTime() && remaining > 0;
  return { percent, monthsLeft, monthlyNeeded, isOverdue };
}
