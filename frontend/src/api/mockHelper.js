/**
 * Helper utilities for delayed mock API responses during development and testing.
 */

export function isMockEnabled() {
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return true;
  }
  return (
    import.meta.env.VITE_USE_MOCK === 'true' ||
    import.meta.env.VITE_USE_MOCK === true ||
    import.meta.env.MODE === 'test'
  );
}

/**
 * Returns a delayed promise resolving with provided data, or rejecting with an error.
 */
export function mockResponse(data, delay = 300, shouldFail = false, errorMessage = 'Mock request failed') {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        const error = new Error(errorMessage);
        error.status = 400;
        reject(error);
      } else {
        // Deep clone data if JSON serializable so mutations don't alter fixtures
        try {
          resolve(structuredClone ? structuredClone(data) : JSON.parse(JSON.stringify(data)));
        } catch {
          resolve(data);
        }
      }
    }, delay);
  });
}

/**
 * Simulates a paginated API response matching usePaginatedList's expectations.
 */
export function mockPaginatedResponse(
  items = [],
  { page = 1, page_size = 10, search = '', filterFn = null } = {},
  delay = 300
) {
  let list = Array.isArray(items) ? [...items] : [];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((item) => {
      return Object.values(item || {}).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }

  if (typeof filterFn === 'function') {
    list = list.filter(filterFn);
  }

  const total = list.length;
  const p = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(page_size) || 10);
  const start = (p - 1) * size;
  const pagedItems = list.slice(start, start + size);

  return mockResponse(
    {
      data: pagedItems,
      total,
      page: p,
      page_size: size,
      total_pages: Math.ceil(total / size) || 1,
    },
    delay
  );
}

/**
 * Simulates an error response after a delay.
 */
export function mockError(message = 'Mock Error', status = 400, delay = 300) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const err = new Error(message);
      err.status = status;
      reject(err);
    }, delay);
  });
}

