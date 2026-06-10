# Finance Helper — Personal Finance Dashboard

A modern, single-page personal finance dashboard that runs **entirely in your browser**. Track income, expenses, budgets, and savings goals — with all data stored locally in `localStorage` and full **PDF export/import** for backup and migration.

No accounts, no servers, no tracking. Your data never leaves your device unless you export it.

---

## ✨ Features

- **Dashboard** — Summary cards (total balance, monthly income/expenses, savings rate), quick stats for the current month, and a preview of your 5 most recent transactions.
- **Transactions** — Add, edit, and delete income/expense entries. Sort by date, amount, or category; filter by date range, category, and type; search by description.
- **Budgets** — Set monthly spending limits per category, with progress bars and over-budget alerts (highlighted in red).
- **Savings Goals** — Create goals with a target amount and deadline, track progress (%), see the monthly amount needed, and mark goals complete.
- **Data Visualization** (Recharts) — Interactive pie chart (expenses by category), bar chart (income vs. expenses, last 12 months), and line chart (spending trend).
- **Categories** — Color-coded categories, plus create/delete your own custom categories.
- **Auto-save** — Every change is persisted to `localStorage` immediately, with a "saved" notification.
- **PDF Export** — A formatted, human-readable report (summary, transactions, budgets, goals, and charts as images) **with an embedded, encoded data payload** for re-import. Name the file before download.
- **PDF Import** — Upload a previously exported PDF to restore data. Validates the file, shows a summary, and lets you **merge** or **replace** existing data. Corrupt/invalid files are handled gracefully.
- **Dark / Light mode** — Toggle saved to `localStorage`.
- **Responsive** — Works on mobile, tablet, and desktop with a collapsible sidebar.
- **Safety** — Form validation, empty states, confirmation dialogs before destructive actions, and a "clear all data" option with a warning.

---

## 🧱 Tech Stack

| Concern | Library |
|---|---|
| UI | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS (class-based dark mode) |
| Charts | Recharts |
| Forms | React Hook Form |
| PDF export | jsPDF + jspdf-autotable + html2canvas |
| PDF import | pdfjs-dist |
| Icons | React Icons |
| Persistence | Browser `localStorage` |

---

## 🚀 Setup

Requires **Node.js 18+**.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev

# 3. Type-check
npm run typecheck

# 4. Production build (outputs to ./dist)
npm run build

# 5. Preview the production build locally
npm run preview
```

---

## 🗂 Project Structure

```
src/
├── components/
│   ├── charts/Charts.tsx        # Pie, bar, and line charts (Recharts)
│   ├── layout/                  # Sidebar + navigation config
│   ├── ui/                      # Modal, ConfirmDialog, Toast, ProgressBar, StatCard, EmptyState
│   └── TransactionForm.tsx      # Shared add/edit form (React Hook Form)
├── constants/                   # Storage keys, default categories, color palette
├── context/AppContext.tsx       # Central state store + all CRUD actions + toasts
├── hooks/useLocalStorage.ts      # Typed localStorage sync hook
├── pages/                       # Dashboard, Transactions, Budgets, Goals, Categories, Settings
├── types/                       # Shared TypeScript types
├── utils/
│   ├── calculations.ts          # Totals, budget/goal math, chart aggregations
│   ├── format.ts                # Currency/date/percent formatting, id generation
│   └── pdf.ts                   # PDF export + import/validation
├── App.tsx                      # App shell, top bar, page routing
└── main.tsx                     # Entry point
```

---

## 🧭 How to Use

1. **Add transactions** on the Transactions page (or via the Dashboard's "Add" button). Pick a type, amount, category, description, and date.
2. **Set budgets** per category for a given month on the Budgets page. Progress bars turn **red** when you exceed a limit.
3. **Create savings goals** with a target and deadline on the Goals page; log how much you've saved and the app shows the monthly amount needed.
4. **Customize categories** with your own names and colors on the Categories page.
5. **Back up** your data on the Settings page → *Export to PDF*. Store the PDF somewhere safe.
6. **Restore** by importing that PDF on another device or browser → choose **Replace** or **Merge**.
7. Toggle **dark mode** from the top bar or Settings.

### How PDF backup works

The exported PDF is a normal, readable report **and** a backup file at the same time. After the visible report pages, the app appends an encoded JSON snapshot of your data (wrapped in marker tokens, rendered as near-invisible text). On import, the app reads the PDF text with `pdfjs-dist`, extracts that payload, validates its structure and version, and restores your data. Files that aren't valid Finance Helper exports are rejected with a clear message.

> Note: the embedded data is Base64-encoded for transport, **not encrypted**. Treat exported PDFs as you would any file containing your financial information.

---

## ☁️ Deployment

This is a static site — any static host works.

### Vercel
1. Push the repo to GitHub.
2. Import the project in Vercel. It auto-detects Vite.
3. Build command: `npm run build` · Output directory: `dist`.
   (`vercel.json` is included with these settings + SPA rewrites.)

### Netlify
1. Push to GitHub and "Add new site → Import an existing project".
2. Build command: `npm run build` · Publish directory: `dist`.
   (`netlify.toml` is included.)

### Manual / any static host
```bash
npm run build
# then serve the ./dist folder with any static file server
```

---

## 🔒 Privacy

All data lives in your browser's `localStorage` under the key `finance-helper:data:v1`. Clearing your browser data — or using the **Clear all data** button — removes it. Export a PDF first if you want a backup.

---

## 📄 License

MIT — free to use, modify, and learn from.
