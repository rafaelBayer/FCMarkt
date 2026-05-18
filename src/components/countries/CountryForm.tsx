"use client";

import { useActionState } from "react";
import { initialFormState, type FormState } from "@/types/forms";
import { StatusMessage } from "@/components/ui/StatusMessage";

type CountryFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

export function CountryForm({ action }: CountryFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="grid max-w-2xl gap-5 rounded-lg border border-slate-200 bg-white p-6">
      {state.status === "error" && state.message ? (
        <StatusMessage tone="error">{state.message}</StatusMessage>
      ) : null}
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Nome
        <input
          required
          name="name"
          placeholder="Brazil"
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Codigo
        <input
          name="code"
          maxLength={3}
          placeholder="BR"
          className="rounded-md border border-slate-300 px-3 py-2 uppercase text-slate-950 outline-none focus:border-teal-700"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Salvando..." : "Salvar pais"}
      </button>
    </form>
  );
}
