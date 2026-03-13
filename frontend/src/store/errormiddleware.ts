import {  isRejectedWithValue } from "@reduxjs/toolkit";
import { setError } from "./slices/errorSlice";
import type { Middleware } from "@reduxjs/toolkit"; 
export const rtkQueryErrorMiddleware: Middleware =
  (store) => (next) => (action) => {
    if (isRejectedWithValue(action)) {
      const payload = action.payload as {
        data?: { message?: string };
      };

      const message =
        payload?.data?.message ||
        action.error?.message ||
        "Something went wrong";

      store.dispatch(setError(message));
    }

    return next(action);
  };