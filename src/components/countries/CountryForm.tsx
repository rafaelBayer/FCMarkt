type CountryFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function CountryForm({ action }: CountryFormProps) {
  return (
    <form action={action} className="grid max-w-2xl gap-5 rounded-lg border border-slate-200 bg-white p-6">
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
        className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
      >
        Salvar pais
      </button>
    </form>
  );
}
