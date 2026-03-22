"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ensureUserRows } from "@/lib/supabase/user-data";
import { Anchor } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await ensureUserRows(user);
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F8F7F5] px-6">
        <div className="w-full max-w-sm text-center">
          <Anchor size={40} strokeWidth={1.5} className="mx-auto mb-4 text-[#1F6B66]" />
          <h1 className="mb-2 text-2xl font-medium text-[#2C2C2C]">Check your email</h1>
          <p className="mb-8 text-gray-500">
            We sent a confirmation link to <strong className="text-[#2C2C2C]">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-full bg-[#1F6B66] px-8 py-4 text-lg font-medium text-white shadow-md transition-transform active:scale-[0.98]"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F8F7F5] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <Anchor size={40} strokeWidth={1.5} className="text-[#1F6B66]" />
          <h1 className="text-3xl font-medium text-[#2C2C2C]">Create account</h1>
          <p className="text-gray-500">Get started with Anchor</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#2C2C2C]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-2xl bg-white px-5 py-4 text-lg text-[#2C2C2C] shadow-sm outline-none ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1F6B66]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#2C2C2C]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
              className="w-full rounded-2xl bg-white px-5 py-4 text-lg text-[#2C2C2C] shadow-sm outline-none ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1F6B66]"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-[#2C2C2C]">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repeat your password"
              className="w-full rounded-2xl bg-white px-5 py-4 text-lg text-[#2C2C2C] shadow-sm outline-none ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1F6B66]"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#1F6B66] py-4 text-lg font-medium text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#1F6B66] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
