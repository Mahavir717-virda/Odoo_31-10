export function getPayload(response) {
  return response?.data ?? response;
}

export function normalizeListResponse(response) {
  const payload = getPayload(response);
  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const meta = response?.meta ?? payload?.meta ?? {};

  return {
    data,
    total: Number(meta.total ?? response?.total ?? payload?.total ?? data.length),
    limit: Number(meta.limit ?? response?.limit ?? payload?.limit ?? data.length),
    meta,
  };
}

export async function fetchAllPages(fetchPage, pageSize = 100) {
  const records = [];
  let page = 1;
  let total = 0;

  do {
    const response = await fetchPage({ page, limit: pageSize });
    const normalized = normalizeListResponse(response);
    records.push(...normalized.data);
    total = normalized.total;
    page += 1;
  } while (records.length < total && page <= Math.ceil(total / pageSize) + 1);

  return records;
}
