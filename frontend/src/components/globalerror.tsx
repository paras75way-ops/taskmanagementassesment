import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/index";
import { clearError } from "../store/slices/errorSlice";

export const GlobalError = () => {
  const dispatch = useDispatch();
  const message = useSelector((state: RootState) => state.error.message);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 w-[90%] max-w-xl -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 shadow-lg backdrop-blur-sm dark:bg-red-500/15 dark:text-red-200">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{message}</p>

        <button
          onClick={() => dispatch(clearError())}
          className="rounded-md px-2 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          ✕
        </button>
      </div>
    </div>
  );
};