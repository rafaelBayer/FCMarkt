"use client";

import { useActionState } from "react";
import type { Player, Season } from "@/types/database";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { initialFormState, type FormState } from "@/types/forms";

type SquadMembershipFormProps = {
  teamId: string;
  players: Player[];
  seasons: Season[];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

export function SquadMembershipForm({
  teamId,
  players,
  seasons,
  action
}: SquadMembershipFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const canSubmit = players.length > 0 && seasons.length > 0;

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5">
      <input type="hidden" name="teamId" value={teamId} />
      {state.status === "error" && state.message ? (
        <StatusMessage tone="error">{state.message}</StatusMessage>
      ) : null}
      {!canSubmit ? (
        <StatusMessage tone="error">
          Cadastre jogadores e temporadas antes de montar o elenco.
        </StatusMessage>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_120px]">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Jogador
          <select
            required
            name="playerId"
            defaultValue=""
            disabled={!canSubmit}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700 disabled:bg-slate-100"
          >
            <option value="" disabled>
              Selecione
            </option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.known_name || player.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Temporada
          <select
            required
            name="seasonId"
            defaultValue=""
            disabled={!canSubmit}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700 disabled:bg-slate-100"
          >
            <option value="" disabled>
              Selecione
            </option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Camisa
          <input
            name="shirtNumber"
            type="number"
            min={1}
            max={99}
            disabled={!canSubmit}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700 disabled:bg-slate-100"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Entrada
          <input
            name="joinedAt"
            type="date"
            disabled={!canSubmit}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700 disabled:bg-slate-100"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Saida
          <input
            name="leftAt"
            type="date"
            disabled={!canSubmit}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700 disabled:bg-slate-100"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending || !canSubmit}
        className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Salvando..." : "Adicionar ao elenco"}
      </button>
    </form>
  );
}
