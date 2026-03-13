import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { Provider } from "react-redux";
import { store } from "./store";
import { router } from "./routes";
import { GlobalError } from "./components/globalerror";
import { Toaster } from "react-hot-toast";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <Toaster position="bottom-right" />
      <GlobalError />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);