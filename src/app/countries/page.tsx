import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCountries } from "@/services/countries";

export const dynamic = "force-dynamic";

export default async function CountriesPage() {
  const countries = await getCountries();

  return (
    <div>
      <PageHeader
        title="Paises"
        description="Cadastre os paises que vao organizar suas ligas do modo carreira."
        action={{ href: "/countries/new", label: "Novo pais" }}
      />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      {countries.length === 0 ? (
        <EmptyState title="Nenhum pais cadastrado" description="Comece criando o primeiro pais." />
      ) : (
        <div className="grid gap-3">
          {countries.map((country) => (
            <div
              key={country.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
            >
              <span className="font-semibold text-slate-950">{country.name}</span>
              {country.code ? (
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {country.code}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
