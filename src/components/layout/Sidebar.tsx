import { IoClose, IoTrendingUp } from 'react-icons/io5';
import { APP_NAME } from '../../constants';
import { NAV_ITEMS, type PageId } from './nav';

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  const content = (
    <div className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <IoTrendingUp size={20} />
          </span>
          <span className="text-lg font-bold">{APP_NAME}</span>
        </div>
        <button
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          aria-label="Close menu"
        >
          <IoClose size={22} />
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <p className="mt-auto px-2 pt-4 text-xs text-gray-400">
        Data stays in your browser.
      </p>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block dark:border-gray-800 dark:bg-gray-900">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} aria-hidden />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
