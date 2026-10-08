import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  /** If false, won't auto-fetch on mount */
  immediate?: boolean;
}

/**
 * Generic hook for client-side API fetching with loading/error state.
 * Prevents stale state by tracking the latest request.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: UseApiOptions = { immediate: true }
): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: !!options.immediate,
    error: null,
  });
  const latestRef = useRef(0);

  const fetch = useCallback(async () => {
    const requestId = ++latestRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      if (requestId === latestRef.current) {
        setState({ data, loading: false, error: null });
      }
    } catch (err) {
      if (requestId === latestRef.current) {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (options.immediate !== false) fetch();
  }, [fetch, options.immediate]);

  return { ...state, refetch: fetch };
}
