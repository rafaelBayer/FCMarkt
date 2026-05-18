"use client";

import { useActionState } from "react";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { initialFormState, type FormState } from "@/types/forms";

type PlayerFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

export function PlayerForm({ action }: PlayerFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <form action={formAction} className="grid max-w-3xl gap-5 rounded-lg border border-slate-200 bg-white p-6">
      {state.status === "error" && state.message ? (
        <StatusMessage tone="error">{state.message}</StatusMessage>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Nome
          <input
            required
            name="name"
            placeholder="Gabriel Silva"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Nome conhecido
          <input
            name="knownName"
            placeholder="G. Silva"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Nacionalidade
          <input
            name="nationality"
            placeholder="Brazil"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Data de nascimento
          <input
            name="birthDate"
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Posicao
          <input
            name="mainPosition"
            placeholder="ST"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Overall
          <input
            name="overall"
            type="number"
            min={1}
            max={99}
            placeholder="72"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Potencial
          <input
            name="potential"
            type="number"
            min={1}
            max={99}
            placeholder="84"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          URL da foto
          <input
            name="photoUrl"
            placeholder="https://..."
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Salvando..." : "Salvar jogador"}
      </button>
    </form>
  );
}
