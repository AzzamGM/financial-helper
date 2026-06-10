import { useForm } from 'react-hook-form';
import type { Transaction, TransactionType } from '../types';
import { useApp } from '../context/AppContext';
import { todayISO } from '../utils/format';

interface FormValues {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface TransactionFormProps {

  initial?: Transaction;
  onSubmitted: () => void;
}

export default function TransactionForm({ initial, onSubmitted }: TransactionFormProps) {
  const { data, addTransaction, updateTransaction, notify } = useApp();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      type: initial?.type ?? 'expense',
      amount: initial?.amount ?? undefined,
      category: initial?.category ?? data.categories[0]?.name ?? 'Other',
      description: initial?.description ?? '',
      date: initial?.date ?? todayISO(),
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload = {
      type: values.type,
      amount: Number(values.amount),
      category: values.category,
      description: values.description.trim(),
      date: values.date,
    };
    if (initial) {
      updateTransaction(initial.id, payload);
      notify('Transaction updated');
    } else {
      addTransaction(payload);
      notify('Transaction added');
    }
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <span className="label">Type</span>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm font-medium has-[:checked]:border-income has-[:checked]:bg-green-50 has-[:checked]:text-income dark:border-gray-700 dark:has-[:checked]:bg-green-500/10">
            <input type="radio" value="income" className="accent-income" {...register('type')} />
            Income
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm font-medium has-[:checked]:border-expense has-[:checked]:bg-red-50 has-[:checked]:text-expense dark:border-gray-700 dark:has-[:checked]:bg-red-500/10">
            <input type="radio" value="expense" className="accent-expense" {...register('type')} />
            Expense
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="input-base"
            {...register('amount', {
              required: 'Amount is required',
              valueAsNumber: true,
              validate: (v) => (Number.isFinite(v) && v > 0) || 'Enter an amount greater than 0',
            })}
          />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            className="input-base"
            {...register('date', { required: 'Date is required' })}
          />
          {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="category">Category</label>
        <select id="category" className="input-base" {...register('category', { required: true })}>
          {data.categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <input
          id="description"
          type="text"
          placeholder="e.g. Monthly salary, Grocery run…"
          className="input-base"
          {...register('description', {
            required: 'Description is required',
            maxLength: { value: 120, message: 'Keep it under 120 characters' },
          })}
        />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="btn-primary">
          {initial ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}
