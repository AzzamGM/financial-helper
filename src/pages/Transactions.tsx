import { useMemo, useState, type ReactNode } from 'react';
import {
  IoAddCircleOutline,
  IoSearch,
  IoPencil,
  IoTrash,
  IoArrowUp,
  IoArrowDown,
  IoSwapHorizontal,
  IoChevronBack,
  IoChevronForward,
  IoArrowUpCircle,
  IoArrowDownCircle,
  IoWalletOutline,
  IoCloseCircle,
  IoFlashOutline,
  IoClose,
} from 'react-icons/io5';
import { useApp } from '../context/AppContext';
import type { Transaction, TransactionType } from '../types';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import TransactionForm from '../components/TransactionForm';
import { computeTotals } from '../utils/calculations';
import { formatCurrencyText, formatDate, todayISO } from '../utils/format';
import Money from '../components/ui/Money';

type SortKey = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

export default function Transactions() {
  const { data, addTransaction, deleteTransaction, addTemplate, deleteTemplate, notify } = useApp();
  const { transactions, categories, templates } = data;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();

  const emptyTpl = {
    label: '',
    type: 'expense' as TransactionType,
    amount: '',
    category: categories[0]?.name ?? 'Other',
    description: '',
    dayOfMonth: '',
  };
  const [tplOpen, setTplOpen] = useState(false);
  const [tpl, setTpl] = useState(emptyTpl);
  const [tplError, setTplError] = useState('');
  const [deletingTplId, setDeletingTplId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (month && t.date.slice(0, 7) !== month) return false;
      if (year && t.date.slice(0, 4) !== year) return false;
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;
      if (q && !t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q))
        return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'amount') cmp = a.amount - b.amount;
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
      else cmp = a.date.localeCompare(b.date);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [transactions, search, typeFilter, categoryFilter, month, year, fromDate, toDate, sortKey, sortDir]);

  const summary = useMemo(() => computeTotals(filtered), [filtered]);

  const filtersActive =
    !!search || typeFilter !== 'all' || categoryFilter !== 'all' || !!month || !!year || !!fromDate || !!toDate;

  const shiftMonth = (delta: number) => {
    const base = month || todayISO().slice(0, 7);
    const [y, m] = base.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  
  const shiftYear = (delta: number) => {
    const base = Number(year) || new Date().getFullYear();
    setYear(String(base + delta));
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'category' ? 'asc' : 'desc');
    }
  };

  const colorFor = (name: string) => categories.find((c) => c.name === name)?.color ?? '#6b7280';

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (t: Transaction) => {
    setEditing(t);
    setFormOpen(true);
  };
  
  const openTemplateModal = () => {
    setTpl(emptyTpl);
    setTplError('');
    setTplOpen(true);
  };

  const saveTemplate = () => {
    const label = tpl.label.trim();
    const amount = Number(tpl.amount);
    if (!label) {
      setTplError('Give the template a name (e.g. Salary).');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setTplError('Enter an amount greater than 0.');
      return;
    }
    let dayOfMonth: number | undefined;
    if (tpl.dayOfMonth !== '') {
      const day = Number(tpl.dayOfMonth);
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        setTplError('Day of month must be between 1 and 31.');
        return;
      }
      dayOfMonth = day;
    }
    addTemplate({
      label,
      type: tpl.type,
      amount,
      category: tpl.category,
      description: tpl.description.trim(),
      dayOfMonth,
    });
    notify('Template saved');
    setTplOpen(false);
  };

  
  
  
  
  const quickAdd = (t: (typeof templates)[number]) => {
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();
    if (month) {
      const [y, m] = month.split('-').map(Number);
      targetYear = y;
      targetMonth = m - 1;
    } else if (year) {
      targetYear = Number(year);
    }
    const date = clampDate(targetYear, targetMonth, t.dayOfMonth ?? now.getDate());
    addTransaction({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description || t.label,
      date,
    });
    notify(
      `Added "${t.label}" · ${t.type === 'income' ? '+' : '−'}${formatCurrencyText(t.amount)} · ${formatDate(date)}`,
    );
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setMonth('');
    setYear('');
    setFromDate('');
    setToDate('');
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? (
      <IoSwapHorizontal className="rotate-90 opacity-30" size={13} />
    ) : sortDir === 'asc' ? (
      <IoArrowUp size={13} />
    ) : (
      <IoArrowDown size={13} />
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">All transactions</h2>
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700 dark:text-gray-300">{filtered.length}</span> of{' '}
            {transactions.length}
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <IoAddCircleOutline size={18} /> Add transaction
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryTile
          label="Income"
          value={<Money value={summary.income} />}
          icon={<IoArrowUpCircle />}
          tone="income"
        />
        <SummaryTile
          label="Expenses"
          value={<Money value={summary.expenses} />}
          icon={<IoArrowDownCircle />}
          tone="expense"
        />
        <SummaryTile
          label="Net"
          value={<Money value={Math.abs(summary.balance)} prefix={summary.balance < 0 ? '−' : undefined} />}
          icon={<IoWalletOutline />}
          tone={summary.balance < 0 ? 'expense' : 'brand'}
        />
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IoFlashOutline className="text-brand-600" size={18} />
            <h2 className="font-semibold">Quick add</h2>
          </div>
          <button className="btn-secondary !py-1.5 text-sm" onClick={openTemplateModal}>
            <IoAddCircleOutline size={16} /> New template
          </button>
        </div>

        {templates.length === 0 ? (
          <p className="text-sm text-gray-500">
            Save presets for entries you record every month — like Salary or Rent — then add them
            for today in a single click.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <div key={t.id} className="group relative">
                <button
                  onClick={() => quickAdd(t)}
                  title={`Add ${t.label} for today`}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-4 text-left shadow-sm transition hover:border-brand-400 hover:shadow dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base ${
                      t.type === 'income'
                        ? 'bg-green-100 text-income dark:bg-green-500/15'
                        : 'bg-red-100 text-expense dark:bg-red-500/15'
                    }`}
                  >
                    {t.type === 'income' ? <IoArrowUpCircle /> : <IoArrowDownCircle />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium leading-tight">{t.label}</span>
                    <span className="block text-xs text-gray-500">
                      {t.category} ·{' '}
                      <span className={t.type === 'income' ? 'text-income' : 'text-expense'}>
                        <Money value={t.amount} prefix={t.type === 'income' ? '+' : '−'} />
                      </span>
                      {t.dayOfMonth ? ` · ${ordinal(t.dayOfMonth)}` : ''}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => setDeletingTplId(t.id)}
                  aria-label={`Delete ${t.label} template`}
                  className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-white shadow group-hover:flex hover:bg-red-600"
                >
                  <IoClose size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="search"
            placeholder="Search by description or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="label mb-0">Year</span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  className="font-medium text-brand-600 hover:underline"
                  onClick={() => setYear(String(new Date().getFullYear()))}
                >
                  This year
                </button>
                {year && (
                  <button
                    type="button"
                    className="text-gray-500 hover:underline"
                    onClick={() => setYear('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => shiftYear(-1)}
                className="border-r border-gray-300 px-2.5 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                aria-label="Previous year"
              >
                <IoChevronBack size={16} />
              </button>
              <div className="relative flex min-w-0 flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder=""
                  className="w-full bg-transparent px-2 py-2 text-center text-sm text-gray-900 outline-none [appearance:textfield] dark:text-gray-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={year}
                  onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                {!year && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white text-sm text-gray-400 dark:bg-gray-900">
                    All Years
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => shiftYear(1)}
                className="border-l border-gray-300 px-2.5 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                aria-label="Next year"
              >
                <IoChevronForward size={16} />
              </button>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="label mb-0">Month</span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  className="font-medium text-brand-600 hover:underline"
                  onClick={() => setMonth(todayISO().slice(0, 7))}
                >
                  This month
                </button>
                {month && (
                  <button
                    type="button"
                    className="text-gray-500 hover:underline"
                    onClick={() => setMonth('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30 dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="border-r border-gray-300 px-2.5 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                aria-label="Previous month"
              >
                <IoChevronBack size={16} />
              </button>
              <div className="relative flex min-w-0 flex-1">
                <input
                  type="month"
                  className="w-full bg-transparent px-2 py-2 text-center text-sm text-gray-900 outline-none dark:text-gray-100 dark:[color-scheme:dark]"
                  value={month}
                  onClick={(e) => {
                    
                    const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                    try {
                      el.showPicker?.();
                    } catch {
                     
                    }
                  }}
                  onChange={(e) => setMonth(e.target.value)}
                />
                {!month && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white text-sm text-gray-400 dark:bg-gray-900">
                    All Months
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="border-l border-gray-300 px-2.5 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                aria-label="Next month"
              >
                <IoChevronForward size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From</label>
              <input type="date" className="input-base" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input-base" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input-base"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input-base"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

        </div>

        {filtersActive && (
          <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
            <button
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
              onClick={resetFilters}
            >
              <IoCloseCircle size={16} /> Reset filters
            </button>
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Add your first income or expense to get started."
          action={
            <button className="btn-primary" onClick={openAdd}>
              <IoAddCircleOutline size={18} /> Add transaction
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<IoSearch />}
          title="No matches"
          description="Try adjusting your filters or search."
          action={
            <button className="btn-secondary" onClick={resetFilters}>
              Reset filters
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="px-4 py-3">
                    <SortButton label="Date" onClick={() => toggleSort('date')} icon={<SortIcon k="date" />} />
                  </th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">
                    <SortButton label="Category" onClick={() => toggleSort('category')} icon={<SortIcon k="category" />} />
                  </th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">
                    <SortButton label="Amount" onClick={() => toggleSort('amount')} icon={<SortIcon k="amount" />} align="right" />
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((t) => (
                  <tr key={t.id} className="group transition-colors hover:bg-brand-50/50 dark:hover:bg-gray-800/40">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${t.type === 'income'
                            ? 'bg-green-100 text-income dark:bg-green-500/15'
                            : 'bg-red-100 text-expense dark:bg-red-500/15'
                          }`}
                      >
                        {t.type === 'income' ? <IoArrowUpCircle size={13} /> : <IoArrowDownCircle size={13} />}
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-medium">
                        <span className="h-2.5 w-2.5 rounded-full ring-2 ring-inset ring-black/5" style={{ backgroundColor: colorFor(t.category) }} />
                        {t.category}
                      </span>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-gray-600 dark:text-gray-300">
                      {t.description || <span className="text-gray-400">—</span>}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right text-[15px] font-semibold tabular-nums ${t.type === 'income' ? 'text-income' : 'text-expense'
                        }`}
                    >
                      <Money value={t.amount} prefix={t.type === 'income' ? '+' : '−'} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(t)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-700"
                          aria-label="Edit"
                        >
                          <IoPencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            deleteTransaction(t.id);
                            notify('Transaction deleted', 'info');
                          }}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                          aria-label="Delete"
                        >
                          <IoTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Edit transaction' : 'Add transaction'}
        onClose={() => setFormOpen(false)}
      >
        <TransactionForm initial={editing} onSubmitted={() => setFormOpen(false)} />
      </Modal>

      <Modal
        open={tplOpen}
        title="New quick-add template"
        onClose={() => setTplOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setTplOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveTemplate}>Save template</button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Templates store a fixed amount and category. One click adds them dated today.
          </p>

          <div>
            <span className="label">Type</span>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm font-medium has-[:checked]:border-income has-[:checked]:bg-green-50 has-[:checked]:text-income dark:border-gray-700 dark:has-[:checked]:bg-green-500/10">
                <input
                  type="radio"
                  className="accent-income"
                  checked={tpl.type === 'income'}
                  onChange={() => setTpl((p) => ({ ...p, type: 'income' }))}
                />
                Income
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm font-medium has-[:checked]:border-expense has-[:checked]:bg-red-50 has-[:checked]:text-expense dark:border-gray-700 dark:has-[:checked]:bg-red-500/10">
                <input
                  type="radio"
                  className="accent-expense"
                  checked={tpl.type === 'expense'}
                  onChange={() => setTpl((p) => ({ ...p, type: 'expense' }))}
                />
                Expense
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Template name</label>
              <input
                className="input-base"
                placeholder="e.g. Salary, Rent"
                value={tpl.label}
                onChange={(e) => {
                  setTpl((p) => ({ ...p, label: e.target.value }));
                  setTplError('');
                }}
              />
            </div>
            <div>
              <label className="label">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-base"
                placeholder="0.00"
                value={tpl.amount}
                onChange={(e) => {
                  setTpl((p) => ({ ...p, amount: e.target.value }));
                  setTplError('');
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category</label>
              <select
                className="input-base"
                value={tpl.category}
                onChange={(e) => setTpl((p) => ({ ...p, category: e.target.value }))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Day of month (optional)</label>
              <input
                type="number"
                min="1"
                max="31"
                className="input-base"
                placeholder="e.g. 27"
                value={tpl.dayOfMonth}
                onChange={(e) => {
                  setTpl((p) => ({ ...p, dayOfMonth: e.target.value.replace(/\D/g, '').slice(0, 2) }));
                  setTplError('');
                }}
              />
              <p className="mt-1 text-xs text-gray-400">
                Leave empty to add for today's date.
              </p>
            </div>
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <input
              className="input-base"
              placeholder="Defaults to the template name"
              value={tpl.description}
              onChange={(e) => setTpl((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          {tplError && <p className="text-xs text-red-600">{tplError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={deletingTplId !== null}
        title="Delete template?"
        message={`Remove the "${templates.find((t) => t.id === deletingTplId)?.label ?? ''}" quick-add template? Your transactions are not affected.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingTplId) {
            deleteTemplate(deletingTplId);
            notify('Template removed', 'info');
            setDeletingTplId(null);
          }
        }}
        onCancel={() => setDeletingTplId(null)}
      />
    </div>
  );
}



function clampDate(year: number, monthIndex: number, day: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const d = Math.min(Math.max(1, day), lastDay);
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}



function SummaryTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone: 'income' | 'expense' | 'brand';
}) {
  const tones = {
    income: 'text-income bg-green-100 dark:bg-green-500/15',
    expense: 'text-expense bg-red-100 dark:bg-red-500/15',
    brand: 'text-brand-600 bg-brand-100 dark:bg-brand-500/15',
  };
  return (
    <div className="card flex items-center gap-3 p-3 sm:p-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${tones[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="truncate text-sm font-bold tabular-nums sm:text-base">{value}</p>
      </div>
    </div>
  );
}

function SortButton({
  label,
  onClick,
  icon,
  align = 'left',
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <button
      className={`inline-flex items-center gap-1 transition-colors hover:text-gray-800 dark:hover:text-gray-200 ${align === 'right' ? 'flex-row-reverse' : ''
        }`}
      onClick={onClick}
    >
      {label} {icon}
    </button>
  );
}
