export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PaginationParams = {
  page?: number | string | null;
  pageSize?: number | string | null;
  search?: string | null;
};

export type PaginatedResult<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type NormalizedPagination = {
  page: number;
  pageSize: number;
  search: string;
  from: number;
  to: number;
};

export function normalizePagination(
  params: PaginationParams = {},
  defaultPageSize = DEFAULT_PAGE_SIZE
): NormalizedPagination {
  const page = normalizePositiveInteger(params.page, DEFAULT_PAGE);
  const requestedPageSize = normalizePositiveInteger(params.pageSize, defaultPageSize);
  const safeDefaultPageSize = clampPageSize(defaultPageSize);
  const pageSize = clampPageSize(requestedPageSize || safeDefaultPageSize);
  const search = String(params.search ?? "").trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return { page, pageSize, search, from, to };
}

export function buildPaginatedResult<T>({
  data,
  count,
  page,
  pageSize
}: {
  data: T[];
  count: number | null;
  page: number;
  pageSize: number;
}): PaginatedResult<T> {
  const safeCount = Math.max(0, count ?? 0);
  const totalPages = Math.max(1, Math.ceil(safeCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  return {
    data,
    count: safeCount,
    page: safePage,
    pageSize,
    totalPages
  };
}

export function emptyPaginatedResult<T>(
  params: PaginationParams = {},
  defaultPageSize = DEFAULT_PAGE_SIZE
): PaginatedResult<T> {
  const { page, pageSize } = normalizePagination(params, defaultPageSize);
  return buildPaginatedResult<T>({ data: [], count: 0, page, pageSize });
}

function normalizePositiveInteger(value: number | string | null | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function clampPageSize(value: number) {
  return Math.min(Math.max(value, 1), MAX_PAGE_SIZE);
}
