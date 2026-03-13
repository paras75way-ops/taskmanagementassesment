import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { changePasswordSchema } from "../validations/auth.schema";
import type { ChangePasswordFormData } from "../validations/auth.schema";
const API_URL =
  (import.meta.env as Record<string, string | undefined>).VITE_BACKEND_URL;

export default function ChangePassword() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: ChangePasswordFormData) => {
    setError(null);
    setMessage(null);

    try {
      const accessToken = localStorage.getItem("accessToken");

      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json() as { message?: string };

      if (!res.ok) {
        throw new Error(result.message ?? "Something went wrong");
      }

      setMessage(result.message ?? "Password changed successfully");
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">

        <h2 className="text-2xl font-semibold text-white text-center mb-6">
          Change Password
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Current Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Current Password
            </label>
            <input
              type="password"
              {...register("currentPassword")}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Enter current password"
            />
            {errors.currentPassword && (
              <p className="text-red-400 text-xs mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              New Password
            </label>
            <input
              type="password"
              {...register("newPassword")}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <p className="text-red-400 text-xs mt-1">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Changing..." : "Change Password"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-green-400 text-center">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}