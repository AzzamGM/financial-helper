import { formatAmount } from '../../utils/format';

interface MoneyProps {
  value: number;

  prefix?: string;
  className?: string;
}

export default function Money({ value, prefix, className }: MoneyProps) {
  return (
    <span className={`whitespace-nowrap ${className ?? ''}`}>
      {prefix}
      <span className="icon-saudi_riyal_new" role="img" aria-label="Saudi Riyal" />{' '}
      {formatAmount(value)}
    </span>
  );
}
