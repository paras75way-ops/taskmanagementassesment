import { redirect } from "react-router";
import { logouts } from "../../services/auth.service";
import { store } from "../../store";
import { logout } from "../../store/slices/auth.slice";

export async function logoutAction() {
  logouts();
  store.dispatch(logout());
  return redirect("/signin");
}