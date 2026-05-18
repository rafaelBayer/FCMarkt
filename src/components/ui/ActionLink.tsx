import Link from "next/link";

type ActionLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function ActionLink({ href, children }: ActionLinkProps) {
  return (
    <Link
      href={href}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}
