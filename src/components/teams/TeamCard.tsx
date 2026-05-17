import Link from "next/link";
import type { TeamWithLeague } from "@/types/database";

type TeamCardProps = {
  team: TeamWithLeague;
};

export function TeamCard({ team }: TeamCardProps) {
  const league = team.leagues;
  const country = league?.countries;

  return (
    <Link
      href={`/teams/${team.id}`}
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
          {team.logo_url ? (
            <img src={team.logo_url} alt="" className="max-h-12 max-w-12 object-contain" />
          ) : (
            <span className="text-lg font-bold text-slate-400">{team.name.slice(0, 2)}</span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-950">{team.name}</h2>
          <p className="text-sm text-slate-600">
            {league?.name ?? "Liga nao informada"}
            {country ? `, ${country.name}` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
