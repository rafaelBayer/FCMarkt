type StatusMessageProps = {
  tone: "success" | "error";
  children: React.ReactNode;
};

const toneClasses = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-red-200 bg-red-50 text-red-950"
};

export function StatusMessage({ tone, children }: StatusMessageProps) {
  return (
    <div className={`mb-6 rounded-lg border p-4 text-sm ${toneClasses[tone]}`} role="status">
      {children}
    </div>
  );
}
