import { useState, useCallback } from "react";

interface PaginationState {
  page: number;
  pageSize: number;
}

interface PaginationActions {
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

/**
 * Manages pagination state for list views.
 * Resets to page 1 when page size changes.
 */
export function usePagination(
  initialPage = 1,
  initialPageSize = 20
): PaginationState & PaginationActions {
  const [page, setPageState] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);

  const setPage = useCallback((p: number) => setPageState(p), []);
  const nextPage = useCallback(() => setPageState((p) => p + 1), []);
  const prevPage = useCallback(() => setPageState((p) => Math.max(1, p - 1)), []);
  const reset = useCallback(() => setPageState(1), []);

  return { page, pageSize, setPage, nextPage, prevPage, reset };
}
