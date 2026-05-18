import { redirect } from "next/navigation";
import { SeasonForm } from "@/components/seasons/SeasonForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSeason } from "@/services/seasons";
import type { FormState } from "@/types/forms";

async function createSeasonAction(_: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await createSeason({
      name: String(formData.get("name") ?? ""),
      startYear: String(formData.get("startYear") ?? ""),
      endYear: String(formData.get("endYear") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel cadastrar a temporada.")
    };
  }

  redirect("/seasons?created=season");
}

export default function NewSeasonPage() {
  return (
    <div>
      <PageHeader title="Nova temporada" description="Cadastre uma temporada do universo do seu save." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <SeasonForm action={createSeasonAction} />
    </div>
  );
}
