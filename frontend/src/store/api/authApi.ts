import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseApi";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => "/auth/me",
    }),
  }),
});

export const { useGetMeQuery } = authApi;