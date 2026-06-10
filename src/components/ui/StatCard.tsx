import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: 'income' | 'expense' | 'brand' | 'neutral';
  hint?: string;
}

const accents: Record<NonNullable<StatCardProps['accent']>, string> = {
  income: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400',
  expense: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  brand: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-500',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-300',
};

export default function StatCard({ label, value, icon, accent = 'neutral', hint }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${accents[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="truncate text-xl font-bold">{value}</p>
        {hint && <p className="truncate text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}
