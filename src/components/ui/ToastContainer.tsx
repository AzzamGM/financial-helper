import { IoCheckmarkCircle, IoCloseCircle, IoInformationCircle, IoClose } from 'react-icons/io5';
import { useApp } from '../../context/AppContext';

const icons = {
  success: <IoCheckmarkCircle className="text-green-500" size={20} />,
  error: <IoCloseCircle className="text-red-500" size={20} />,
  info: <IoInformationCircle className="text-brand-500" size={20} />,
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <span className="mt-0.5">{icons[t.type]}</span>
          <p className="flex-1 text-sm">{t.message}</p>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Dismiss"
          >
            <IoClose size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
