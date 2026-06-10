interface ProgressBarProps {
  percent: number;
  color?: string;
  danger?: boolean;
}

export default function ProgressBar({ percent, color, danger }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const fill = danger ? '#dc2626' : color ?? '#2563eb';
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: fill }}
      />
    </div>
  );
}
