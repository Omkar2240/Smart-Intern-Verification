import { useState, useEffect } from "react";

/**
 * Debounces a value by the given delay (default 300ms).
 * Use for search inputs to avoid excessive API calls.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
