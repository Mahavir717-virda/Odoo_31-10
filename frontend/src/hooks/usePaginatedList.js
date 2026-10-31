import { useCallback, useEffect, useRef, useState } from 'react';

export default function usePaginatedList(fetchFn, { page_size = 10, enabled = true } = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(page_size);
  const [search, setSearchState] = useState('');
  const [filters, setFiltersState] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  const cancel = useCallback(() => {
    requestIdRef.current += 1;
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = null;
  }, []);

  const fetchList = useCallback(
    async (currentPage, currentPageSize, currentSearch, currentFilters) => {
      const requestId = ++requestIdRef.current;
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const params = {
          page: currentPage,
          page_size: currentPageSize,
          search: currentSearch,
          ...currentFilters,
        };
        const response = await fetchFn(params, { signal: controller.signal });

        if (requestId !== requestIdRef.current) {
          return;
        }

        const items = response?.data ?? response ?? [];
        const count = response?.total ?? items.length;

        if (requestId !== requestIdRef.current) {
          return;
        }

        setData(Array.isArray(items) ? items : []);
        setTotal(Number(count) || 0);
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }
        if (err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setData([]);
        setTotal(0);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          abortRef.current = null;
        }
      }
    },
    [fetchFn]
  );

  const load = useCallback(() => {
    cancel();
    fetchList(page, pageSize, search, filters);
  }, [page, pageSize, search, filters, cancel, fetchList]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    load();
  }, [load, enabled]);

  const setPage = useCallback((value) => setPageState(value), []);
  const setPageSize = useCallback((value) => {
    setPageSizeState(value);
    setPageState(1);
  }, [setPageState]);
  const setSearch = useCallback((value) => {
    setSearchState(value);
    setPageState(1);
  }, [setPageState]);
  const setFilters = useCallback((nextFilters) => {
    setFiltersState(nextFilters);
    setPageState(1);
  }, [setPageState]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  const mutate = useCallback((nextData) => {
    setData(Array.isArray(nextData) ? nextData : []);
  }, []);

  const setMeta = useCallback(
    (next) => {
      setPageState(1);
      if (next.page_size) {
        setPageSizeState(next.page_size);
      }
      if (next.search !== undefined) {
        setSearchState(next.search);
      }
      if (next.filters) {
        setFiltersState(next.filters);
      }
    },
    [setPageState, setPageSizeState, setSearchState, setFiltersState]
  );

  return {
    data,
    total,
    page,
    page_size: pageSize,
    search,
    filters,
    loading,
    error,
    set_page: setPage,
    set_page_size: setPageSize,
    set_search: setSearch,
    set_filters: setFilters,
    set_meta: setMeta,
    refresh,
    load,
    mutate,
    cancel,
  };
}
