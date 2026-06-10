import { useRef, useState } from 'react';
import {
  IoMoon,
  IoSunny,
  IoDownloadOutline,
  IoCloudUploadOutline,
  IoTrashBinOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5';
import { useApp } from '../context/AppContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { ExpensePieChart, IncomeExpenseBarChart } from '../components/charts/Charts';
import { buildExportPdf, parseImportPdf, type ImportResult } from '../utils/pdf';
import { formatDate } from '../utils/format';

export default function Settings() {
  const { data, toggleDarkMode, replaceAll, mergeData, clearAll, markBackup, notify } = useApp();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('finance-helper-backup');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportNote, setExportNote] = useState('');
  const [clearOpen, setClearOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const lastBackup = data.settings.lastBackupDate;

  const runExport = async () => {
    setExporting(true);
    setExportModalOpen(false);
    try {

      await new Promise((r) => setTimeout(r, 150));
      const doc = await buildExportPdf({
        data,
        note: exportNote.trim() || undefined,
        chartElementIds: ['export-pie', 'export-bar'],
      });
      const safe = (fileName.trim() || 'finance-helper-backup').replace(/[^\w.-]+/g, '-');
      doc.save(`${safe}.pdf`);
      markBackup();
      notify('PDF exported successfully');
    } catch (err) {
      console.error(err);
      notify('Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const result = await parseImportPdf(file);
      setImportResult(result);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not read this PDF.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const doImport = (mode: 'replace' | 'merge') => {
    if (!importResult) return;
    if (mode === 'replace') replaceAll(importResult.data);
    else mergeData(importResult.data);
    notify(mode === 'replace' ? 'Data replaced from backup' : 'Data merged from backup');
    setImportResult(null);
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="mb-1 font-semibold">Appearance</h2>
        <p className="mb-4 text-sm text-gray-500">Choose how Finance Helper looks. Your choice is saved.</p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            {data.settings.darkMode ? <IoMoon /> : <IoSunny />}
            {data.settings.darkMode ? 'Dark mode' : 'Light mode'}
          </span>
          <button
            onClick={toggleDarkMode}
            role="switch"
            aria-checked={data.settings.darkMode}
            className={`relative h-6 w-11 rounded-full transition ${
              data.settings.darkMode ? 'bg-brand-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                data.settings.darkMode ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-1 font-semibold">Export data (PDF)</h2>
        <p className="mb-4 text-sm text-gray-500">
          Download a formatted PDF report. It also embeds your data so it can be re-imported later.
          {lastBackup && (
            <span className="ml-1 text-gray-400">Last export: {formatDate(lastBackup)}.</span>
          )}
        </p>
        <button className="btn-primary" onClick={() => setExportModalOpen(true)} disabled={exporting}>
          <IoDownloadOutline size={18} />
          {exporting ? 'Generating PDF…' : 'Export to PDF'}
        </button>
      </div>

      <div className="card">
        <h2 className="mb-1 font-semibold">Import data (PDF)</h2>
        <p className="mb-4 text-sm text-gray-500">
          Upload a previously exported Finance Helper PDF to restore your data.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={onFilePicked}
        />
        <button
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          <IoCloudUploadOutline size={18} />
          {importing ? 'Reading PDF…' : 'Choose PDF to import'}
        </button>
      </div>

      <div className="card border-red-200 dark:border-red-900/50">
        <h2 className="mb-1 font-semibold text-expense">Danger zone</h2>
        <p className="mb-4 text-sm text-gray-500">
          Permanently delete all transactions, budgets, and goals from this browser. Consider
          exporting a backup first.
        </p>
        <button className="btn-danger" onClick={() => setClearOpen(true)}>
          <IoTrashBinOutline size={18} /> Clear all data
        </button>
      </div>

      <Modal
        open={exportModalOpen}
        title="Export to PDF"
        onClose={() => setExportModalOpen(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setExportModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={runExport}>
              <IoDownloadOutline size={18} /> Download
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">File name</label>
            <div className="flex items-center gap-2">
              <input
                className="input-base"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="finance-helper-backup"
              />
              <span className="text-sm text-gray-400">.pdf</span>
            </div>
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input
              className="input-base"
              value={exportNote}
              onChange={(e) => setExportNote(e.target.value)}
              placeholder="e.g. Backup before tax season"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={importResult !== null}
        title="Import backup"
        onClose={() => setImportResult(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setImportResult(null)}>Cancel</button>
            <button className="btn-secondary" onClick={() => doImport('merge')}>Merge</button>
            <button className="btn-primary" onClick={() => doImport('replace')}>Replace all</button>
          </>
        }
      >
        {importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <IoDocumentTextOutline size={18} />
              Exported {formatDate(importResult.payload.exportedAt)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SummaryStat label="Transactions" value={importResult.summary.transactions} />
              <SummaryStat label="Budgets" value={importResult.summary.budgets} />
              <SummaryStat label="Goals" value={importResult.summary.goals} />
              <SummaryStat label="Categories" value={importResult.summary.categories} />
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <strong>Replace all</strong> overwrites your current data. <strong>Merge</strong> adds
              the imported items to what you already have (duplicates are skipped).
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={clearOpen}
        title="Clear all data?"
        message="This permanently deletes every transaction, budget, and savings goal stored in this browser. This cannot be undone."
        confirmLabel="Yes, delete everything"
        onConfirm={() => {
          clearAll();
          notify('All data cleared', 'info');
          setClearOpen(false);
        }}
        onCancel={() => setClearOpen(false)}
      />

      <div aria-hidden className="pointer-events-none fixed -left-[10000px] top-0" style={{ width: 720 }}>
        <div id="export-pie" style={{ width: 720, background: '#fff', padding: 16 }}>
          <ExpensePieChart transactions={data.transactions} categories={data.categories} />
        </div>
        <div id="export-bar" style={{ width: 720, background: '#fff', padding: 16 }}>
          <IncomeExpenseBarChart transactions={data.transactions} />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 text-center dark:border-gray-800">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
