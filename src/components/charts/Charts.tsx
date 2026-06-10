import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Category, Transaction } from '../../types';
import {
  expensesByCategory,
  monthlyBuckets,
  monthlyBucketsBetween,
  spendingTrend,
} from '../../utils/calculations';
import { formatDate } from '../../utils/format';
import Money from '../ui/Money';

function colorFor(categories: Category[], name: string, fallback: string): string {
  return categories.find((c) => c.name === name)?.color ?? fallback;
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  fontSize: 13,
};

export function ExpensePieChart({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  const byCat = expensesByCategory(transactions);
  const chartData = Object.entries(byCat)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return <EmptyChart label="No expenses to chart yet" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={95}
          innerRadius={50}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={colorFor(categories, entry.name, '#6b7280')} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => <Money value={v} />} contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseBarChart({
  transactions,
  range,
}: {
  transactions: Transaction[];
  range?: { start: Date; end: Date };
}) {
  const data = range
    ? monthlyBucketsBetween(transactions, range.start, range.end)
    : monthlyBuckets(transactions, 12);
  const hasData = data.some((d) => d.income > 0 || d.expenses > 0);
  if (!hasData) return <EmptyChart label="No monthly data yet" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="key" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} width={48} />
        <Tooltip formatter={(v: number) => <Money value={v} />} contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SpendingTrendLineChart({ transactions }: { transactions: Transaction[] }) {
  const data = spendingTrend(transactions).map((d) => ({ ...d, label: formatDate(d.date) }));
  if (data.length === 0) return <EmptyChart label="No spending trend yet" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} width={48} />
        <Tooltip formatter={(v: number) => <Money value={v} />} contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="amount"
          name="Spending"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center text-sm text-gray-400">
      {label}
    </div>
  );
}
