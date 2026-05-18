import { redirect } from "next/navigation";
import { CountryForm } from "@/components/countries/CountryForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createCountry } from "@/services/countries";
import type { FormState } from "@/types/forms";

async function createCountryAction(_: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await createCountry({
      name: String(formData.get("name") ?? ""),
      code: String(formData.get("code") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel cadastrar o pais.")
    };
  }

  redirect("/countries?created=country");
}

export default function NewCountryPage() {
  return (
    <div>
      <PageHeader title="Novo pais" description="Adicione um pais para vincular ligas." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <CountryForm action={createCountryAction} />
    </div>
  );
}
