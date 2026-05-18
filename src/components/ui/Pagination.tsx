import Link from "next/link";
import type { PaginatedResult } from "@/services/pagination";

type PaginationProps<T> = {
  result: PaginatedResult<T>;
  basePath: string;
  params?: Record<string, string | number | null | undefined>;
};

export function Pagination<T>({ result, basePath, params = {} }: PaginationProps<T>) {
  const { count, page, pageSize, totalPages, data } = result;
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = count === 0 ? 0 : start + data.length - 1;

  if (count === 0) {
    return null;
  }

  return (
    <nav
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Paginacao"
    >
      <p>
        Mostrando <span className="font-semibold text-slate-950">{start}</span>-
        <span className="font-semibold text-slate-950">{end}</span> de{" "}
        <span className="font-semibold text-slate-950">{count}</span>
      </p>
      <div className="flex items-center gap-2">
        <PageLink disabled={page <= 1} href={buildHref(basePath, params, page - 1)}>
          Anterior
        </PageLink>
        <span className="rounded-md bg-slate-100 px-3 py-2 font-semibold text-slate-700">
          {page} / {totalPages}
        </span>
        <PageLink disabled={page >= totalPages} href={buildHref(basePath, params, page + 1)}>
          Proxima
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  children,
  disabled,
  href
}: {
  children: React.ReactNode;
  disabled: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span className="rounded-md border border-slate-200 px-3 py-2 text-slate-400">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-md border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-700"
    >
      {children}
    </Link>
  );
}

function buildHref(
  basePath: string,
  params: Record<string, string | number | null | undefined>,
  page: number
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const text = String(value ?? "").trim();

    if (text && key !== "page") {
      searchParams.set(key, text);
    }
  });

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}
