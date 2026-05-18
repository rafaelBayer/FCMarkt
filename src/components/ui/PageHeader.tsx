import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: {
    href: string;
    label: string;
  };
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-normal text-slate-950">{title}</h1>
        {description ? <p className="max-w-2xl text-slate-600">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
