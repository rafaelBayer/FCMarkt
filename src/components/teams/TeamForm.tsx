"use client";

import { useActionState } from "react";
import type { LeagueWithCountry } from "@/types/database";
import { initialFormState, type FormState } from "@/types/forms";
import { StatusMessage } from "@/components/ui/StatusMessage";

type TeamFormProps = {
  leagues: LeagueWithCountry[];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

export function TeamForm({ leagues, action }: TeamFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const hasLeagues = leagues.length > 0;

  return (
    <form
      action={formAction}
      className="grid max-w-3xl gap-5 rounded-lg border border-slate-200 bg-white p-6"
    >
      {state.status === "error" && state.message ? (
        <StatusMessage tone="error">{state.message}</StatusMessage>
      ) : null}
      {!hasLeagues ? (
        <StatusMessage tone="error">Cadastre pelo menos uma liga antes de criar um time.</StatusMessage>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Nome
          <input
            required
            name="name"
            placeholder="FC Barcelona"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Nome curto
          <input
            name="shortName"
            placeholder="BAR"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Liga
        <select
          required
          name="leagueId"
          disabled={!hasLeagues}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          defaultValue=""
        >
          <option value="" disabled>
            Selecione uma liga
          </option>
          {leagues.map((league) => (
            <option key={league.id} value={league.id}>
              {league.name} {league.countries ? `- ${league.countries.name}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Cidade
          <input
            name="city"
            placeholder="Barcelona"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-800 sm:col-span-2">
          Estadio
          <input
            name="stadium"
            placeholder="Camp Nou"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Ano de fundacao
        <input
          name="foundedYear"
          type="number"
          min={1800}
          max={2100}
          placeholder="1899"
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Logo
        <input
          name="logo"
          type="file"
          accept="image/*"
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-800"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Descricao
        <textarea
          name="description"
          rows={5}
          placeholder="Resumo do time no modo carreira."
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
        />
      </label>

      <button
        type="submit"
        disabled={pending || !hasLeagues}
        className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Salvando..." : "Salvar time"}
      </button>
    </form>
  );
}
