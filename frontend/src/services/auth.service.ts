const env = import.meta.env as Record<string, string | undefined>;
const API_URL = env.VITE_BACKEND_URL || env.Backend_url ;

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json() as { accessToken?: string; message?: string };

  if (!res.ok) throw new Error(data.message || "Login failed");

  return data;
}

export async function signup(name: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json() as { message?: string };

  if (!res.ok) throw new Error(data.message || "Signup failed");

  return data;
}

export async function logouts() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  localStorage.removeItem("accessToken");
}

export async function verifyOtp(email: string, otp: string) {
  const res = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  const data = await res.json() as { message?: string };

  if (!res.ok) throw new Error(data.message ?? "OTP verification failed");

  return data;
}

export async function resendOtp(email: string) {
  const res = await fetch(`${API_URL}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json() as { message?: string };

  if (!res.ok) throw new Error(data.message ?? "Failed to resend OTP");

  return data;
}

export async function getUser() {
  const token = localStorage.getItem("accessToken");

  let res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!refreshRes.ok) {
      return null;
    }

    const data = await refreshRes.json() as { accessToken: string };
    localStorage.setItem("accessToken", data.accessToken);

    res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    });
  }

  if (!res.ok) return null;

  return res.json();
}

export function isAuthenticated() {
  return !!localStorage.getItem("accessToken");
}
