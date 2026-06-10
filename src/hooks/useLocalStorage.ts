import { useCallback, useEffect, useRef, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      const parsed = JSON.parse(raw) as T;

      if (isPlainObject(parsed) && isPlainObject(initialValue)) {
        return { ...initialValue, ...parsed };
      }
      return parsed;
    } catch (err) {
      console.warn(`useLocalStorage: failed to read "${key}"`, err);
      return initialValue;
    }
  });

  const listeners = useRef(new Set<() => void>());
  const isFirstRun = useRef(true);

  useEffect(() => {

    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      listeners.current.forEach((fn) => fn());
    } catch (err) {
      console.error(`useLocalStorage: failed to write "${key}"`, err);
    }
  }, [key, value]);

  const onPersist = useCallback((fn: () => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  return [value, setValue, onPersist] as const;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
