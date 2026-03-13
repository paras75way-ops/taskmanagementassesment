import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import errorReducer from "./slices/errorSlice";

import { authApi } from "./api/authApi";
import { taskApi } from "./api/taskApi";
import { boardApi } from "./api/boardApi";

import { rtkQueryErrorMiddleware } from "./errormiddleware";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    error: errorReducer,

    [authApi.reducerPath]: authApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [boardApi.reducerPath]: boardApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(taskApi.middleware)
      .concat(boardApi.middleware)
      .concat(rtkQueryErrorMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;