import { useMemo, useState } from 'react';

export interface UseClientPaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function useClientPagination<T>(
  items: T[],
  options: UseClientPaginationOptions = {},
) {
  const { initialPage = 1, initialPageSize = 10 } = options;
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const setSafePage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
  };

  return {
    page: safePage,
    setPage: setSafePage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    pageItems,
  };
}
