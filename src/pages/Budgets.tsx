import { useMemo, useState } from 'react';
import { IoAddCircleOutline, IoTrash, IoWarning } from 'react-icons/io5';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import { budgetStatuses } from '../utils/calculations';
import { formatMonthYear, formatPercent } from '../utils/format';
import Money from '../components/ui/Money';

export default function Budgets() {
  const { data, upsertBudget, deleteBudget, notify } = useApp();
  const { categories } = data;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState(categories[0]?.name ?? 'Other');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const statuses = useMemo(
    () => budgetStatuses(data.budgets, data.transactions, month, year),
    [data.budgets, data.transactions, month, year],
  );

  const colorFor = (name: string) => categories.find((c) => c.name === name)?.color ?? '#6b7280';

  const submit = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a budget amount greater than 0');
      return;
    }
    upsertBudget({ category, amount: value, month, year });
    notify('Budget saved');
    setFormOpen(false);
    setAmount('');
    setError('');
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            className="input-base w-auto"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            className="input-base w-auto"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          <IoAddCircleOutline size={18} /> Set budget
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Budgets for {formatMonthYear(month, year)}
      </p>

      {statuses.length === 0 ? (
        <EmptyState
          icon={<IoAddCircleOutline />}
          title="No budgets set for this month"
          description="Set a monthly limit per category to track your spending against your plan."
          action={
            <button className="btn-primary" onClick={() => setFormOpen(true)}>
              <IoAddCircleOutline size={18} /> Set budget
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {statuses.map((s) => (
            <div
              key={s.budget.id}
              className={`card ${s.overBudget ? 'border-red-300 dark:border-red-800' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-medium">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colorFor(s.budget.category) }} />
                  {s.budget.category}
                </span>
                <button
                  onClick={() => {
                    deleteBudget(s.budget.id);
                    notify('Budget removed', 'info');
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                  aria-label="Delete budget"
                >
                  <IoTrash size={16} />
                </button>
              </div>

              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className={s.overBudget ? 'font-semibold text-expense' : 'text-gray-600 dark:text-gray-300'}>
                  <Money value={s.spent} /> spent
                </span>
                <span className="text-gray-500">of <Money value={s.budget.amount} /></span>
              </div>

              <ProgressBar percent={s.percent} color={colorFor(s.budget.category)} danger={s.overBudget} />

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">{formatPercent(s.percent)} used</span>
                {s.overBudget ? (
                  <span className="inline-flex items-center gap-1 font-medium text-expense">
                    <IoWarning size={14} /> Over by <Money value={-s.remaining} />
                  </span>
                ) : (
                  <span className="text-gray-500"><Money value={s.remaining} /> left</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        title="Set monthly budget"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submit}>Save budget</button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">For {formatMonthYear(month, year)}</p>
          <div>
            <label className="label">Category</label>
            <select className="input-base" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Monthly limit</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input-base"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
