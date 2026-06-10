import { useMemo, useState } from 'react';
import {
  IoWallet,
  IoArrowUpCircle,
  IoArrowDownCircle,
  IoTrendingUp,
  IoAddCircleOutline,
  IoCalendarOutline,
} from 'react-icons/io5';
import { useApp } from '../context/AppContext';
import type { PageId } from '../components/layout/nav';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import {
  ExpensePieChart,
  IncomeExpenseBarChart,
  SpendingTrendLineChart,
} from '../components/charts/Charts';
import { computeTotals } from '../utils/calculations';
import { formatDate, formatPercent } from '../utils/format';
import Money from '../components/ui/Money';

type PeriodId = 'thisMonth' | '3m' | '6m' | '12m' | 'thisYear' | 'all' | 'custom';

const PERIOD_PRESETS: { id: PeriodId; label: string }[] = [
  { id: 'thisMonth', label: 'This month' },
  { id: '3m', label: 'Last 3M' },
  { id: '6m', label: 'Last 6M' },
  { id: '12m', label: 'Last 12M' },
  { id: 'thisYear', label: 'This year' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function Dashboard({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { data } = useApp();
  const { transactions, categories } = data;

  const [period, setPeriod] = useState<PeriodId>('12m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();

    const earliest = transactions.reduce(
      (min, t) => (t.date < min ? t.date : min),
      transactions[0]?.date ?? iso(today),
    );
    const latest = transactions.reduce(
      (max, t) => (t.date > max ? t.date : max),
      transactions[0]?.date ?? iso(today),
    );

    const endOfMonth = (yr: number, mo: number) => new Date(yr, mo + 1, 0);
    const monthEnd = endOfMonth(y, m);

    let start: Date;
    let end: Date = monthEnd;

    switch (period) {
      case 'thisMonth':
        start = new Date(y, m, 1);
        break;
      case '3m':
        start = new Date(y, m - 2, 1);
        break;
      case '6m':
        start = new Date(y, m - 5, 1);
        break;
      case '12m':
        start = new Date(y, m - 11, 1);
        break;
      case 'thisYear':
        start = new Date(y, 0, 1);
        end = new Date(y, 11, 31);
        break;
      case 'all':
        start = new Date(earliest);
        end = new Date(latest) > monthEnd ? new Date(latest) : monthEnd;
        break;
      case 'custom':
        start = customFrom ? new Date(customFrom) : new Date(earliest);
        end = customTo ? new Date(customTo) : monthEnd;
        break;
    }
    if (start > end) [start, end] = [end, start];
    return { start, end, startISO: iso(start), endISO: iso(end) };
  }, [period, customFrom, customTo, transactions]);

  const periodTx = useMemo(
    () => transactions.filter((t) => t.date >= range.startISO && t.date <= range.endISO),
    [transactions, range],
  );

  const periodLabel =
    period === 'custom'
      ? `${formatDate(range.startISO)} – ${formatDate(range.endISO)}`
      : PERIOD_PRESETS.find((p) => p.id === period)?.label ?? '';

  const periodTotals = useMemo(() => computeTotals(periodTx), [periodTx]);

  const recentInPeriod = useMemo(
    () =>
      [...periodTx]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [periodTx],
  );

  const colorFor = (name: string) => categories.find((c) => c.name === name)?.color ?? '#6b7280';

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<IoWallet />}
        title="Welcome to your finance dashboard"
        description="Add your first transaction to start tracking income, expenses, budgets, and savings goals."
        action={
          <button className="btn-primary" onClick={() => onNavigate('transactions')}>
            <IoAddCircleOutline size={18} /> Add a transaction
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
            <IoCalendarOutline size={16} /> Period
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  period === p.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {period === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
            <div>
              <label className="label">From</label>
              <input type="date" className="input-base" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input-base" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Showing {periodTx.length} transaction{periodTx.length === 1 ? '' : 's'} · {periodLabel}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net Balance"
          value={<Money value={Math.abs(periodTotals.balance)} prefix={periodTotals.balance < 0 ? '−' : undefined} />}
          icon={<IoWallet />}
          accent={periodTotals.balance >= 0 ? 'brand' : 'expense'}
          hint={periodLabel}
        />
        <StatCard
          label="Income"
          value={<Money value={periodTotals.income} />}
          icon={<IoArrowUpCircle />}
          accent="income"
          hint={periodLabel}
        />
        <StatCard
          label="Expenses"
          value={<Money value={periodTotals.expenses} />}
          icon={<IoArrowDownCircle />}
          accent="expense"
          hint={periodLabel}
        />
        <StatCard
          label="Savings Rate"
          value={formatPercent(periodTotals.savingsRate, 1)}
          icon={<IoTrendingUp />}
          accent="neutral"
          hint="Income saved"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Expense breakdown</h2>
          <ExpensePieChart transactions={periodTx} categories={categories} />
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">Income vs Expenses</h2>
          <IncomeExpenseBarChart transactions={periodTx} range={{ start: range.start, end: range.end }} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Spending trend</h2>
        <SpendingTrendLineChart transactions={periodTx} />
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent transactions</h2>
          <button
            className="text-sm font-medium text-brand-600 hover:underline"
            onClick={() => onNavigate('transactions')}
          >
            View all
          </button>
        </div>
        {recentInPeriod.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">No transactions in this period.</p>
        ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {recentInPeriod.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorFor(t.category) }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.description || t.category}</p>
                  <p className="text-xs text-gray-500">
                    {t.category} • {formatDate(t.date)}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${
                  t.type === 'income' ? 'text-income' : 'text-expense'
                }`}
              >
                <Money value={t.amount} prefix={t.type === 'income' ? '+' : '−'} />
              </span>
            </li>
          ))}
        </ul>
        )}
      </div>
    </div>
  );
}
