"use client";

type DeleteButtonProps = {
  id: string;
  action: (formData: FormData) => Promise<void>;
  label?: string;
  confirmMessage: string;
  fields?: Record<string, string>;
};

export function DeleteButton({
  id,
  action,
  label = "Excluir",
  confirmMessage,
  fields
}: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="confirmed" value="1" />
      {fields
        ? Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <button
        type="submit"
        className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
      >
        {label}
      </button>
    </form>
  );
}
