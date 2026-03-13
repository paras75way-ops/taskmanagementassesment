import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router";
import { signup } from "../services/auth.service";
import { useState } from "react";
import { signUpSchema } from "../validations/auth.schema";
import type { SignUpFormData } from "../validations/auth.schema";

export default function SignUp() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setServerError(null);
      await signup(data.name, data.email, data.password);
      navigate("/verify-otp", { state: { email: data.email } });
    } catch (error: unknown) {
      setServerError(error instanceof Error ? error.message : "Signup failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-100">
          Create Account
        </h2>

        {serverError && (
          <div className="mb-4 text-sm text-red-600 text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              {...register("name")}
              className="w-full p-2.5 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full p-2.5 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              className="w-full p-2.5 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-black dark:bg-gray-200 text-white dark:text-gray-900 font-medium hover:opacity-90 transition"
          >
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/signin" className="font-medium underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}