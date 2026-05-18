export type FormState = {
  status: "idle" | "error";
  message: string | null;
};

export const initialFormState: FormState = {
  status: "idle",
  message: null
};
