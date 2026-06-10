import { useState } from 'react';
import {
  IoAddCircleOutline,
  IoTrash,
  IoPencil,
  IoCheckmarkCircle,
  IoFlagOutline,
  IoWarning,
} from 'react-icons/io5';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import type { SavingsGoal } from '../types';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import { goalProgress } from '../utils/calculations';
import { formatDate, todayISO } from '../utils/format';
import Money from '../components/ui/Money';

interface GoalFormValues {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export default function Goals() {
  const { data, addGoal, updateGoal, deleteGoal, toggleGoalComplete, notify } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalFormValues>();

  const openAdd = () => {
    setEditing(undefined);
    reset({ name: '', targetAmount: undefined, currentAmount: 0, deadline: todayISO() });
    setFormOpen(true);
  };
  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    reset({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline,
    });
    setFormOpen(true);
  };

  const onSubmit = (v: GoalFormValues) => {
    const payload = {
      name: v.name.trim(),
      targetAmount: Number(v.targetAmount),
      currentAmount: Number(v.currentAmount) || 0,
      deadline: v.deadline,
    };
    if (editing) {
      updateGoal(editing.id, payload);
      notify('Goal updated');
    } else {
      addGoal(payload);
      notify('Goal created');
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.savingsGoals.length} savings goals</p>
        <button className="btn-primary" onClick={openAdd}>
          <IoAddCircleOutline size={18} /> New goal
        </button>
      </div>

      {data.savingsGoals.length === 0 ? (
        <EmptyState
          icon={<IoFlagOutline />}
          title="No savings goals yet"
          description="Create a goal with a target amount and deadline to track your progress."
          action={
            <button className="btn-primary" onClick={openAdd}>
              <IoAddCircleOutline size={18} /> New goal
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.savingsGoals.map((g) => {
            const p = goalProgress(g);
            return (
              <div
                key={g.id}
                className={`card ${g.completed ? 'border-green-300 dark:border-green-800' : ''}`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold">
                      {g.completed && <IoCheckmarkCircle className="text-income" />}
                      {g.name}
                    </h3>
                    <p className="text-xs text-gray-500">Due {formatDate(g.deadline)}</p>
                  </div>
                  <div className="flex">
                    <button
                      onClick={() => openEdit(g)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-700"
                      aria-label="Edit goal"
                    >
                      <IoPencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingId(g.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                      aria-label="Delete goal"
                    >
                      <IoTrash size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-semibold"><Money value={g.currentAmount} /></span>
                  <span className="text-gray-500">of <Money value={g.targetAmount} /></span>
                </div>

                <ProgressBar percent={p.percent} color="#16a34a" />

                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{p.percent.toFixed(0)}% complete</span>
                  {g.completed ? (
                    <span className="font-medium text-income">Completed 🎉</span>
                  ) : p.isOverdue ? (
                    <span className="inline-flex items-center gap-1 font-medium text-expense">
                      <IoWarning size={13} /> Past deadline
                    </span>
                  ) : (
                    <span>
                      <Money value={p.monthlyNeeded} />/mo
                      {p.monthsLeft > 0 ? ` · ${p.monthsLeft} mo left` : ' needed'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    toggleGoalComplete(g.id);
                    notify(g.completed ? 'Goal reopened' : 'Goal marked complete');
                  }}
                  className="mt-3 w-full rounded-lg border border-gray-300 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {g.completed ? 'Mark as in progress' : 'Mark as completed'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Edit goal' : 'New savings goal'}
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Goal name</label>
            <input
              className="input-base"
              placeholder="e.g. Emergency fund, New laptop…"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-base"
                placeholder="0.00"
                {...register('targetAmount', {
                  required: 'Required',
                  valueAsNumber: true,
                  validate: (v) => v > 0 || 'Must be greater than 0',
                })}
              />
              {errors.targetAmount && <p className="mt-1 text-xs text-red-600">{errors.targetAmount.message}</p>}
            </div>
            <div>
              <label className="label">Saved so far</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-base"
                placeholder="0.00"
                {...register('currentAmount', { valueAsNumber: true, min: { value: 0, message: 'Cannot be negative' } })}
              />
              {errors.currentAmount && <p className="mt-1 text-xs text-red-600">{errors.currentAmount.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input
              type="date"
              className="input-base"
              {...register('deadline', { required: 'Deadline is required' })}
            />
            {errors.deadline && <p className="mt-1 text-xs text-red-600">{errors.deadline.message}</p>}
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary">
              {editing ? 'Save changes' : 'Create goal'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete goal?"
        message="This savings goal will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingId) {
            deleteGoal(deletingId);
            notify('Goal deleted', 'info');
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
