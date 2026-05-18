type SearchInputProps = {
  name?: string;
  defaultValue?: string | null;
  placeholder?: string;
};

export function SearchInput({
  name = "search",
  defaultValue,
  placeholder = "Buscar"
}: SearchInputProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      Busca
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="min-h-10 rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
      />
    </label>
  );
}
