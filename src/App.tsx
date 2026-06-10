import { useState } from 'react';
import { IoMenu, IoMoon, IoSunny } from 'react-icons/io5';
import { useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import { NAV_ITEMS, type PageId } from './components/layout/nav';
import ToastContainer from './components/ui/ToastContainer';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Categories from './pages/Categories';
import Settings from './pages/Settings';

export default function App() {
  const { data, toggleDarkMode } = useApp();
  const [page, setPage] = useState<PageId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (p: PageId) => {
    setPage(p);
    setMobileOpen(false);
  };

  const title = NAV_ITEMS.find((n) => n.id === page)?.label ?? 'Dashboard';

  return (
    <div className="flex h-full">
      <Sidebar
        current={page}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Open menu"
            >
              <IoMenu size={22} />
            </button>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>

          <button
            onClick={toggleDarkMode}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
            title={data.settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {data.settings.darkMode ? <IoSunny size={20} /> : <IoMoon size={20} />}
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {page === 'transactions' && <Transactions />}
          {page === 'budgets' && <Budgets />}
          {page === 'goals' && <Goals />}
          {page === 'categories' && <Categories />}
          {page === 'settings' && <Settings />}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
