"use client";

import { useActionState } from "react";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { initialFormState, type FormState } from "@/types/forms";

type SeasonFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialValues?: {
    name?: string | null;
    start_year?: number | null;
    end_year?: number | null;
  };
  submitLabel?: string;
};

export function SeasonForm({ action, initialValues, submitLabel = "Salvar temporada" }: SeasonFormProps) {
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
          defaultValue={initialValues?.name ?? ""}
          placeholder="2029/30"
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Ano inicial
          <input
            required
            name="startYear"
            type="number"
            defaultValue={initialValues?.start_year ?? ""}
            min={1900}
            max={2200}
            placeholder="2029"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Ano final
          <input
            required
            name="endYear"
            type="number"
            defaultValue={initialValues?.end_year ?? ""}
            min={1900}
            max={2200}
            placeholder="2030"
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
