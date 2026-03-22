"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ensureUserRows } from "@/lib/supabase/user-data";
import { Anchor } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
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

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F8F7F5] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <Anchor size={40} strokeWidth={1.5} className="text-[#1F6B66]" />
          <h1 className="text-3xl font-medium text-[#2C2C2C]">Welcome back</h1>
          <p className="text-gray-500">Sign in to Anchor</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              autoComplete="current-password"
              placeholder="••••••••"
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[#1F6B66] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
