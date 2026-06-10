import { useMemo, useState } from 'react';
import { IoAddCircleOutline, IoTrash } from 'react-icons/io5';
import { useApp } from '../context/AppContext';
import { COLOR_PALETTE } from '../constants';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function Categories() {
  const { data, addCategory, deleteCategory, notify } = useApp();
  const { categories, transactions } = data;

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const usage = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) map[t.category] = (map[t.category] ?? 0) + 1;
    return map;
  }, [transactions]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Category name is required');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A category with that name already exists');
      return;
    }
    addCategory(trimmed, color);
    notify('Category added');
    setName('');
    setError('');
  };

  const deletingCat = categories.find((c) => c.id === deletingId);

  return (
    <div className="space-y-5">
      {}
      <div className="card">
        <h2 className="mb-3 font-semibold">Create a custom category</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="label">Name</label>
            <input
              className="input-base"
              placeholder="e.g. Subscriptions"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          <div>
            <span className="label">Color</span>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition ${
                    color === c ? 'ring-2 ring-offset-2 ring-brand-500 dark:ring-offset-gray-900' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={submit}>
            <IoAddCircleOutline size={18} /> Add
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">All categories ({categories.length})</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2.5 dark:border-gray-800"
            >
              <span className="flex items-center gap-3">
                <span className="h-5 w-5 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-gray-400">
                  {usage[c.name] ? `${usage[c.name]} used` : 'unused'}
                </span>
              </span>
              <button
                onClick={() => {
                  if (usage[c.name]) {
                    setDeletingId(c.id);
                  } else {
                    deleteCategory(c.id);
                    notify('Category deleted', 'info');
                  }
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                aria-label="Delete category"
              >
                <IoTrash size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete category?"
        message={
          deletingCat && usage[deletingCat.name]
            ? `"${deletingCat.name}" is used by ${usage[deletingCat.name]} transaction(s). Those transactions will keep the category name, but it will no longer appear in dropdowns.`
            : 'This category will be removed.'
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deletingId) {
            deleteCategory(deletingId);
            notify('Category deleted', 'info');
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
