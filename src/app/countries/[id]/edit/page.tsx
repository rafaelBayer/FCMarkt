import { notFound, redirect } from "next/navigation";
import { CountryForm } from "@/components/countries/CountryForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCountryById, updateCountry } from "@/services/countries";
import type { FormState } from "@/types/forms";

type EditCountryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateCountryAction(id: string, _: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await updateCountry(id, {
      name: String(formData.get("name") ?? ""),
      code: String(formData.get("code") ?? ""),
      flagUrl: String(formData.get("flagUrl") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel atualizar o pais.")
    };
  }

  redirect("/countries?updated=country");
}

export default async function EditCountryPage({ params }: EditCountryPageProps) {
  const { id } = await params;
  const country = await getCountryById(id);

  if (!country) {
    notFound();
  }

  return (
    <div>
      <PageHeader title="Editar pais" description="Ajuste dados basicos sem alterar historico." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <CountryForm
        action={updateCountryAction.bind(null, id)}
        initialValues={country}
        submitLabel="Atualizar pais"
      />
    </div>
  );
}
