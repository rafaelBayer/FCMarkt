import Link from "next/link";

type ListingFiltersProps = {
  action: string;
  clearHref: string;
  hasActiveFilters: boolean;
  children: React.ReactNode;
};

export function ListingFilters({
  action,
  clearHref,
  hasActiveFilters,
  children
}: ListingFiltersProps) {
  return (
    <form
      action={action}
      className="mb-5 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{children}</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Buscar
        </button>
        {hasActiveFilters ? (
          <Link
            href={clearHref}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-700"
          >
            Limpar
          </Link>
        ) : null}
      </div>
    </form>
  );
}
