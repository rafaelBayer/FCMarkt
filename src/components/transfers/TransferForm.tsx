"use client";

import { useActionState } from "react";
import type { Player, Season, TeamWithLeague } from "@/types/database";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { TRANSFER_TYPES } from "@/services/phase2-rules";
import { initialFormState, type FormState } from "@/types/forms";

type TransferFormProps = {
  players: Player[];
  seasons: Season[];
  teams: TeamWithLeague[];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialValues?: {
    player_id?: string | null;
    from_team_id?: string | null;
    to_team_id?: string | null;
    season_id?: string | null;
    transfer_date?: string | null;
    transfer_type?: string | null;
    fee?: number | null;
    notes?: string | null;
  };
  submitLabel?: string;
};

export function TransferForm({
  players,
  seasons,
  teams,
  action,
  initialValues,
  submitLabel = "Salvar transferencia"
}: TransferFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const canSubmit = players.length > 0 && seasons.length > 0 && teams.length > 0;

  return (
    <form action={formAction} className="grid max-w-4xl gap-5 rounded-lg border border-slate-200 bg-white p-6">
      {state.status === "error" && state.message ? (
        <StatusMessage tone="error">{state.message}</StatusMessage>
      ) : null}
      {!canSubmit ? (
        <StatusMessage tone="error">
          Cadastre pelo menos um jogador, uma temporada e um time antes de criar transferencias.
        </StatusMessage>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Select
          label="Jogador"
          name="playerId"
          disabled={!canSubmit}
          required
          defaultValue={initialValues?.player_id ?? ""}
        >
          <option value="" disabled>
            Selecione um jogador
          </option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.known_name || player.name}
            </option>
          ))}
        </Select>

        <Select
          label="Temporada"
          name="seasonId"
          disabled={!canSubmit}
          required
          defaultValue={initialValues?.season_id ?? ""}
        >
          <option value="" disabled>
            Selecione uma temporada
          </option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Select
          label="Time de origem"
          name="fromTeamId"
          disabled={!canSubmit}
          defaultValue={initialValues?.from_team_id ?? ""}
        >
          <option value="">Sem origem informada</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.short_name || team.name}
            </option>
          ))}
        </Select>

        <Select
          label="Time de destino"
          name="toTeamId"
          disabled={!canSubmit}
          required
          defaultValue={initialValues?.to_team_id ?? ""}
        >
          <option value="" disabled>
            Selecione o destino
          </option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.short_name || team.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Data manual
          <input
            required
            name="transferDate"
            type="date"
            defaultValue={initialValues?.transfer_date ?? ""}
            disabled={!canSubmit}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700 disabled:bg-slate-100"
          />
        </label>

        <Select
          label="Tipo"
          name="transferType"
          disabled={!canSubmit}
          required
          defaultValue={initialValues?.transfer_type ?? ""}
        >
          <option value="" disabled>
            Selecione
          </option>
          {TRANSFER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Valor
          <input
            name="fee"
            type="number"
            defaultValue={initialValues?.fee ?? ""}
            min={0}
            step="0.01"
            disabled={!canSubmit}
            placeholder="0"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700 disabled:bg-slate-100"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Observacoes
        <textarea
          name="notes"
          rows={4}
          disabled={!canSubmit}
          defaultValue={initialValues?.notes ?? ""}
          placeholder="Contexto da transferencia no save."
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700 disabled:bg-slate-100"
        />
      </label>

      <button
        type="submit"
        disabled={pending || !canSubmit}
        className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}

function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}
      <select
        defaultValue=""
        {...props}
        className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700 disabled:bg-slate-100"
      >
        {children}
      </select>
    </label>
  );
}
