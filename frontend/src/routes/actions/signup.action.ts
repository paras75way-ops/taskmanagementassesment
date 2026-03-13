import { redirect } from "react-router";
import { signup } from "../../services/auth.service";
import { signUpSchema } from "../../validations/auth.schema";

export async function signUpAction({ request }: { request: Request }) {
  const formData = await request.formData();

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signUpSchema.safeParse(raw);

  if (!parsed.success) {
    const firstError = parsed.error;
    return { error: firstError?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  try {
    await signup(name, email, password);
    return redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}