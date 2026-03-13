import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { Provider } from "react-redux";
import { store } from "./store";
import { router } from "./routes";
import { GlobalError } from "./components/globalerror";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <GlobalError />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);