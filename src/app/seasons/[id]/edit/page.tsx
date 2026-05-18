import { notFound, redirect } from "next/navigation";
import { SeasonForm } from "@/components/seasons/SeasonForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getSeasonById, updateSeason } from "@/services/seasons";
import type { FormState } from "@/types/forms";

type EditSeasonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateSeasonAction(id: string, _: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await updateSeason(id, {
      name: String(formData.get("name") ?? ""),
      startYear: String(formData.get("startYear") ?? ""),
      endYear: String(formData.get("endYear") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel atualizar a temporada.")
    };
  }

  redirect("/seasons?updated=season");
}

export default async function EditSeasonPage({ params }: EditSeasonPageProps) {
  const { id } = await params;
  const season = await getSeasonById(id);

  if (!season) {
    notFound();
  }

  return (
    <div>
      <PageHeader title="Editar temporada" description="Ajuste nome e anos da temporada." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <SeasonForm
        action={updateSeasonAction.bind(null, id)}
        initialValues={season}
        submitLabel="Atualizar temporada"
      />
    </div>
  );
}
