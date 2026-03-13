import { redirect } from "react-router";
import { isAuthenticated} from "../services/auth.service";
import { store } from "../store/index";
import { authApi } from "../store/api/authApi";
export function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect("/signin");
  }
  return null;
}

export function requireGuest() {
  if (isAuthenticated()) {
    throw redirect("/dashboard");
  }
  return null;
}




export async function userLoader() {
 if (!isAuthenticated()) {
    throw redirect("/signin");
  }
  const result = await store.dispatch(
    authApi.endpoints.getMe.initiate(undefined)
  );

  if ("error" in result) {
    throw redirect("/signin");
  }

  return result.data;
}