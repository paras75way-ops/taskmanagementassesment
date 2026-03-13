import { redirect } from "react-router";
import { login } from "../../services/auth.service";
import { store } from "../../store";
import { loginSuccess } from "../../store/slices/auth.slice";
import { signInSchema } from "../../validations/auth.schema";

export async function signInAction({ request }: { request: Request }) {
  try {
    const formData = await request.formData();

    const raw = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const parsed = signInSchema.safeParse(raw);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return { error: firstError?.message ?? "Invalid input" };
    }

    const { email, password } = parsed.data;
    const data = await login(email, password);

    const accessToken = data.accessToken as string;
    localStorage.setItem("accessToken", accessToken);
    store.dispatch(loginSuccess(accessToken));

    return redirect("/dashboard");
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Invalid email or password",
    };
  }
}