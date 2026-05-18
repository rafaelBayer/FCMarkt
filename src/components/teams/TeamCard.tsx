import Link from "next/link";
import type { TeamWithLeague } from "@/types/database";
import { LogoBox } from "@/components/ui/LogoBox";
import { ActionLink } from "@/components/ui/ActionLink";
import { DeleteButton } from "@/components/ui/DeleteButton";

type TeamCardProps = {
  team: TeamWithLeague;
  deleteAction?: (formData: FormData) => Promise<void>;
};

export function TeamCard({ team, deleteAction }: TeamCardProps) {
  const league = team.leagues;
  const country = league?.countries;
  const displayName = team.short_name || team.name;

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
      <Link href={`/teams/${team.id}`} className="flex items-center gap-4">
        <LogoBox src={team.logo_url} label={displayName} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-950">{displayName}</h2>
          <p className="text-sm text-slate-600">{league?.name ?? "Liga nao informada"}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-slate-500">
            {country?.name ?? "Pais nao informado"}
          </p>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2">
        <ActionLink href={`/teams/${team.id}`}>Ver</ActionLink>
        <ActionLink href={`/teams/${team.id}/edit`}>Editar</ActionLink>
        {deleteAction ? (
          <DeleteButton
            id={team.id}
            action={deleteAction}
            confirmMessage="Excluir este time? Esta acao so sera permitida se nao houver elenco ou transferencias vinculadas."
          />
        ) : null}
      </div>
    </div>
  );
}
