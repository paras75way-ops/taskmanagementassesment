import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp, resendOtp } from "../services/auth.service";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  if (!email) {
    return (
      <h2 className="text-center text-xl mt-20 text-red-500 dark:text-red-300">
        Invalid access
      </h2>
    );
  }

  const handleVerify = async () => {
    try {
      await verifyOtp(email, otp);
      setMessage("OTP verified! Redirecting...");
      setTimeout(() => navigate("/signin"), 1500);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Invalid OTP");
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(email);
      setMessage("OTP resent to your email");
    } catch {
      setMessage("Failed to resend OTP");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">

        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800 dark:text-gray-100">
          Email Verification
        </h2>

        <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
          OTP sent to: <strong className="font-semibold">{email}</strong>
        </p>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-3 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 mb-4"
        />

        <button
          onClick={handleVerify}
          className="w-full py-2.5 bg-black dark:bg-gray-200 text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-90 transition mb-3"
        >
          Verify OTP
        </button>

        <button
          onClick={handleResend}
          className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Resend OTP
        </button>

        {message && (
          <p className="text-center mt-4 text-sm text-gray-700 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}