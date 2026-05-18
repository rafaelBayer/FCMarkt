import { redirect } from "next/navigation";

export function redirectWithMessage(path: string, key: "deleted" | "error", message: string) {
  const params = new URLSearchParams({ [key]: message });
  redirect(`${path}${path.includes("?") ? "&" : "?"}${params.toString()}`);
}
