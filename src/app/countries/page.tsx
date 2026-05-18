import { EmptyState } from "@/components/ui/EmptyState";
import { ActionLink } from "@/components/ui/ActionLink";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { assertConfirmed } from "@/services/admin-rules";
import { getErrorMessage } from "@/lib/errors";
import { redirectWithMessage } from "@/lib/action-redirects";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { deleteCountry, getCountries } from "@/services/countries";

export const dynamic = "force-dynamic";

type CountriesPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
};

async function deleteCountryAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  let errorMessage: string | null = null;

  try {
    assertConfirmed(formData.get("confirmed") === "1", "pais");
    await deleteCountry(id);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Nao foi possivel excluir o pais.");
  }

  if (errorMessage) {
    redirectWithMessage("/countries", "error", errorMessage);
  }

  redirectWithMessage("/countries", "deleted", "Pais excluido com sucesso.");
}

export default async function CountriesPage({ searchParams }: CountriesPageProps) {
  const params = await searchParams;
  const countries = await getCountries();

  return (
    <div>
      <PageHeader
        title="Paises"
        description="Cadastre os paises que vao organizar suas ligas do modo carreira."
        action={{ href: "/countries/new", label: "Novo pais" }}
      />
      {params?.created === "country" ? (
        <StatusMessage tone="success">Pais cadastrado com sucesso.</StatusMessage>
      ) : null}
      {params?.updated === "country" ? (
        <StatusMessage tone="success">Pais atualizado com sucesso.</StatusMessage>
      ) : null}
      {params?.deleted ? <StatusMessage tone="success">{params.deleted}</StatusMessage> : null}
      {params?.error ? <StatusMessage tone="error">{params.error}</StatusMessage> : null}
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      {countries.length === 0 ? (
        <EmptyState
          title="Nenhum pais cadastrado"
          description="Comece criando o primeiro pais para liberar o cadastro de ligas."
          action={{ href: "/countries/new", label: "Criar pais" }}
        />
      ) : (
        <div className="grid gap-3">
          {countries.map((country) => (
            <div
              key={country.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
                  {country.flag_url ? (
                    <img src={country.flag_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">--</span>
                  )}
                </div>
                <span className="truncate font-semibold text-slate-950">{country.name}</span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {country.code ? (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {country.code}
                  </span>
                ) : null}
                <ActionLink href={`/countries/${country.id}/edit`}>Editar</ActionLink>
                <DeleteButton
                  id={country.id}
                  action={deleteCountryAction}
                  confirmMessage="Excluir este pais? Esta acao so sera permitida se nao houver ligas vinculadas."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
