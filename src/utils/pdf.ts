import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  APP_NAME,
  DEFAULT_DATA,
  EXPORT_VERSION,
  PDF_DATA_PREFIX,
  PDF_DATA_SUFFIX,
} from '../constants';
import type { AppData, ExportPayload } from '../types';
import { computeTotals } from './calculations';

import { formatCurrencyText as formatCurrency, formatDate } from './format';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}
function decodeBase64(b64: string): string {
  return decodeURIComponent(escape(atob(b64)));
}

export interface ExportOptions {
  data: AppData;
  note?: string;

  chartElementIds?: string[];
}

export async function buildExportPdf({ data, note, chartElementIds = [] }: ExportOptions): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const exportedAt = new Date();
  let y = margin;

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_NAME, margin, 34);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Personal Finance Report', margin, 52);
  doc.setFontSize(10);
  doc.text(`Exported: ${exportedAt.toLocaleString()}`, pageWidth - margin, 34, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  y = 90;

  if (note) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    const lines = doc.splitTextToSize(`Note: ${note}`, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 14 + 6;
    doc.setFont('helvetica', 'normal');
  }

  // ---- Summary ----
  const totals = computeTotals(data.transactions);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, y);
  y += 8;
  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['Metric', 'Value']],
    body: [
      ['Total Balance', formatCurrency(totals.balance)],
      ['Total Income', formatCurrency(totals.income)],
      ['Total Expenses', formatCurrency(totals.expenses)],
      ['Savings Rate', `${totals.savingsRate.toFixed(1)}%`],
      ['Transactions', String(data.transactions.length)],
    ],
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: margin, right: margin },
  });
  y = afterTableY(doc, y);

  // ---- Charts as images ----
  for (const id of chartElementIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      if (y + imgHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
      y += imgHeight + 16;
    } catch (err) {
      console.warn('Failed to capture chart', id, err);
    }
  }

  // ---- Transactions table ----
  if (data.transactions.length) {
    doc.addPage();
    y = margin;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transactions', margin, y);
    autoTable(doc, {
      startY: y + 8,
      theme: 'striped',
      head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
      body: data.transactions
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((t) => [
          formatDate(t.date),
          t.type,
          t.category,
          t.description,
          `${t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)}`,
        ]),
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin },
    });
    y = afterTableY(doc, y);
  }

  // ---- Budgets table ----
  if (data.budgets.length) {
    ensureSpace(doc, y, 120);
    y = currentY(doc, y);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Budgets', margin, y);
    autoTable(doc, {
      startY: y + 8,
      theme: 'grid',
      head: [['Category', 'Month/Year', 'Limit']],
      body: data.budgets.map((b) => [
        b.category,
        new Date(b.year, b.month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        formatCurrency(b.amount),
      ]),
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: margin, right: margin },
    });
    y = afterTableY(doc, y);
  }

  // ---- Goals table ----
  if (data.savingsGoals.length) {
    ensureSpace(doc, y, 120);
    y = currentY(doc, y);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Savings Goals', margin, y);
    autoTable(doc, {
      startY: y + 8,
      theme: 'grid',
      head: [['Goal', 'Target', 'Saved', 'Progress', 'Deadline', 'Status']],
      body: data.savingsGoals.map((g) => {
        const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
        return [
          g.name,
          formatCurrency(g.targetAmount),
          formatCurrency(g.currentAmount),
          `${pct.toFixed(0)}%`,
          formatDate(g.deadline),
          g.completed ? 'Completed' : 'In progress',
        ];
      }),
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin },
    });
  }

  // ---- Footer on every page ----
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `${APP_NAME} • Generated ${exportedAt.toLocaleDateString()} • Page ${i} of ${total}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 18,
      { align: 'center' },
    );
  }

  // ---- Hidden JSON payload for re-import ----
  appendHiddenPayload(doc, data, exportedAt);

  return doc;
}

function appendHiddenPayload(doc: jsPDF, data: AppData, exportedAt: Date) {
  const payload: ExportPayload = {
    app: 'finance-helper',
    version: EXPORT_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: {
      transactions: data.transactions,
      budgets: data.budgets,
      savingsGoals: data.savingsGoals,
      categories: data.categories,
      templates: data.templates,
      settings: data.settings,
    },
  };
  const encoded = PDF_DATA_PREFIX + encodeBase64(JSON.stringify(payload)) + PDF_DATA_SUFFIX;

  doc.addPage();
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Backup data', 40, 40);
  doc.setFontSize(6);
  // Very light gray so it stays unobtrusive but remains real, selectable text.
  doc.setTextColor(225, 225, 225);
  const lines = doc.splitTextToSize(encoded, doc.internal.pageSize.getWidth() - 80);
  doc.text(lines, 40, 56);
  doc.setTextColor(0, 0, 0);
}

// ---- table layout helpers -------------------------------------------------
interface DocWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}
function afterTableY(doc: jsPDF, fallback: number): number {
  const f = (doc as DocWithAutoTable).lastAutoTable?.finalY;
  return (f ?? fallback) + 24;
}
function currentY(doc: jsPDF, y: number): number {
  return (doc as DocWithAutoTable).lastAutoTable?.finalY
    ? Math.max(y, (doc as DocWithAutoTable).lastAutoTable!.finalY + 24)
    : y;
}
function ensureSpace(doc: jsPDF, y: number, needed: number) {
  if (y + needed > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
  }
}

// ---- Import ---------------------------------------------------------------

export interface ImportResult {
  payload: ExportPayload;
  data: AppData;
  summary: {
    transactions: number;
    budgets: number;
    goals: number;
    categories: number;
  };
}

export async function parseImportPdf(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => ('str' in item ? item.str : '')).join('');
  }

  const compact = fullText.replace(/\s+/g, '');
  const start = compact.indexOf(PDF_DATA_PREFIX);
  const end = compact.indexOf(PDF_DATA_SUFFIX);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No Finance Helper backup data found in this PDF. It may not be an export file.');
  }

  const encoded = compact.slice(start + PDF_DATA_PREFIX.length, end);
  let payload: ExportPayload;
  try {
    payload = JSON.parse(decodeBase64(encoded)) as ExportPayload;
  } catch {
    throw new Error('The backup data in this PDF is corrupted and could not be read.');
  }

  validatePayload(payload);

  const data: AppData = {
    transactions: payload.data.transactions ?? [],
    budgets: payload.data.budgets ?? [],
    savingsGoals: payload.data.savingsGoals ?? [],
    categories:
      payload.data.categories?.length ? payload.data.categories : DEFAULT_DATA.categories,
    templates: payload.data.templates ?? [],
    settings: payload.data.settings ?? DEFAULT_DATA.settings,
  };

  return {
    payload,
    data,
    summary: {
      transactions: data.transactions.length,
      budgets: data.budgets.length,
      goals: data.savingsGoals.length,
      categories: data.categories.length,
    },
  };
}

function validatePayload(payload: unknown): asserts payload is ExportPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid backup: unexpected format.');
  }
  const p = payload as Partial<ExportPayload>;
  if (p.app !== 'finance-helper') {
    throw new Error('Invalid backup: this file was not created by Finance Helper.');
  }
  if (typeof p.version !== 'number' || p.version > EXPORT_VERSION) {
    throw new Error(`Unsupported backup version (${String(p.version)}). Please update the app.`);
  }
  if (!p.data || typeof p.data !== 'object') {
    throw new Error('Invalid backup: missing data section.');
  }
  const d = p.data as Record<string, unknown>;
  for (const key of ['transactions', 'budgets', 'savingsGoals', 'categories'] as const) {
    if (d[key] !== undefined && !Array.isArray(d[key])) {
      throw new Error(`Invalid backup: "${key}" is malformed.`);
    }
  }
}
