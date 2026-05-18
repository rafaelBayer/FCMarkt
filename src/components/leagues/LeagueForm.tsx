"use client";

import { useActionState } from "react";
import type { Country } from "@/types/database";
import { initialFormState, type FormState } from "@/types/forms";
import { StatusMessage } from "@/components/ui/StatusMessage";

type LeagueFormProps = {
  countries: Country[];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialValues?: {
    name?: string | null;
    country_id?: string | null;
    logo_url?: string | null;
  };
  submitLabel?: string;
};

export function LeagueForm({ countries, action, initialValues, submitLabel = "Salvar liga" }: LeagueFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const hasCountries = countries.length > 0;

  return (
    <form action={formAction} className="grid max-w-2xl gap-5 rounded-lg border border-slate-200 bg-white p-6">
      {state.status === "error" && state.message ? (
        <StatusMessage tone="error">{state.message}</StatusMessage>
      ) : null}
      {!hasCountries ? (
        <StatusMessage tone="error">Cadastre pelo menos um pais antes de criar uma liga.</StatusMessage>
      ) : null}
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Nome
        <input
          required
          name="name"
          defaultValue={initialValues?.name ?? ""}
          placeholder="Premier League"
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Pais
        <select
          required
          name="countryId"
          disabled={!hasCountries}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          defaultValue={initialValues?.country_id ?? ""}
        >
          <option value="" disabled>
            Selecione um pais
          </option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        URL da logo
        <input
          name="logoUrl"
          defaultValue={initialValues?.logo_url ?? ""}
          placeholder="https://..."
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
        />
      </label>
      <button
        type="submit"
        disabled={pending || !hasCountries}
        className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
