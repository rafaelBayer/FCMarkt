import { notFound, redirect } from "next/navigation";
import { PlayerForm } from "@/components/players/PlayerForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getPlayerById, updatePlayer } from "@/services/players";
import type { FormState } from "@/types/forms";

type EditPlayerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updatePlayerAction(id: string, _: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await updatePlayer(id, {
      name: String(formData.get("name") ?? ""),
      knownName: String(formData.get("knownName") ?? ""),
      nationality: String(formData.get("nationality") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      mainPosition: String(formData.get("mainPosition") ?? ""),
      overall: String(formData.get("overall") ?? ""),
      potential: String(formData.get("potential") ?? ""),
      photoUrl: String(formData.get("photoUrl") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel atualizar o jogador.")
    };
  }

  redirect("/players?updated=player");
}

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  const { id } = await params;
  const player = await getPlayerById(id);

  if (!player) {
    notFound();
  }

  return (
    <div>
      <PageHeader title="Editar jogador" description="Ajuste dados basicos sem alterar transferencias." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <PlayerForm
        action={updatePlayerAction.bind(null, id)}
        initialValues={player}
        submitLabel="Atualizar jogador"
      />
    </div>
  );
}
