import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/50 p-10 text-center dark:border-gray-700 dark:bg-gray-900/40">
      {icon && <div className="mb-3 text-4xl text-gray-400">{icon}</div>}
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
