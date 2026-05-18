import Link from "next/link";
import type { TeamWithLeague } from "@/types/database";
import { LogoBox } from "@/components/ui/LogoBox";

type TeamCardProps = {
  team: TeamWithLeague;
};

export function TeamCard({ team }: TeamCardProps) {
  const league = team.leagues;
  const country = league?.countries;
  const displayName = team.short_name || team.name;

  return (
    <Link
      href={`/teams/${team.id}`}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <LogoBox src={team.logo_url} label={displayName} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-950">{displayName}</h2>
          <p className="text-sm text-slate-600">
            {league?.name ?? "Liga nao informada"}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-slate-500">
            {country?.name ?? "Pais nao informado"}
          </p>
        </div>
      </div>
    </Link>
  );
}
