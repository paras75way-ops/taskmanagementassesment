import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { setAccessToken, logout } from "../slices/auth.slice";
import type { RootState } from "../index";

const envBase = (import.meta.env as Record<string, string | undefined>);
const baseQuery = fetchBaseQuery({
  baseUrl: envBase.VITE_BACKEND_URL || "http://localhost:5000/api",
  credentials: "include",

  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {

  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {

    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {

      const { accessToken } = refreshResult.data as { accessToken: string };

      api.dispatch(setAccessToken(accessToken));

      result = await baseQuery(args, api, extraOptions);

    } else {

      api.dispatch(logout());
    }
  }

  return result;
};