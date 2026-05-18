type FilterSelectProps = {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: Array<{
    value: string;
    label: string;
  }>;
};

export function FilterSelect({ label, name, defaultValue, options }: FilterSelectProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-teal-700"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
