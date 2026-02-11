"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const form = new FormData(e.currentTarget);

    const { error } = await supabase.auth.signInWithPassword({
      email: form.get("email") as string,
      password: form.get("password") as string,
    });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    setMsg("Logged in successfully");
    router.refresh();
    router.push("/home");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#FFF8E7' }}>
      <div className="w-full max-w-lg">
        {/* Brand Header with Logo */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <div className="relative w-88 h-88 md:w-104 md:h-104 mb-6">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-20"
              style={{ backgroundColor: '#E0A11B' }}
            />
            <div
              className="relative w-full h-full rounded-full overflow-hidden shadow-2xl"
              style={{
                backgroundColor: '#FFFFFF',
                border: '4px solid #E0A11B',
                boxShadow: '0 10px 40px rgba(224, 161, 27, 0.3)'
              }}
            >
              <Image
                src="/logo.png"
                alt="Srinibas Vastra"
                width={316}
                height={316}
                className="object-contain w-full h-full p-0"
                priority
              />
            </div>
          </div>
          <div>
            <p className="text-lg font-light tracking-wide" style={{ color: '#5A3A22' }}>
              Welcome to the Heritage Collection
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl shadow-2xl p-8 backdrop-blur-sm"
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #E0A11B',
            boxShadow: '0 20px 60px rgba(43, 26, 18, 0.15)'
          }}
        >
          <h2 className="text-2xl font-semibold text-center mb-8" style={{ color: '#2B1A12' }}>
            Sign In to Your Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium tracking-wide" style={{ color: '#3A2416' }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all duration-200 placeholder:text-opacity-50"
                style={{
                  backgroundColor: '#FFF8E7',
                  border: '2px solid #5A3A22',
                  color: '#2B1A12'
                }}
                onFocus={(e) => e.target.style.borderColor = '#E0A11B'}
                onBlur={(e) => e.target.style.borderColor = '#5A3A22'}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium tracking-wide" style={{ color: '#3A2416' }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                className="w-full rounded-xl px-4 py-3 text-base outline-none transition-all duration-200 placeholder:text-opacity-50"
                style={{
                  backgroundColor: '#FFF8E7',
                  border: '2px solid #5A3A22',
                  color: '#2B1A12'
                }}
                onFocus={(e) => e.target.style.borderColor = '#E0A11B'}
                onBlur={(e) => e.target.style.borderColor = '#5A3A22'}
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-base font-semibold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{
                backgroundColor: '#E0A11B',
                color: '#2B1A12',
                border: 'none'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#C88912')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#E0A11B')}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            {/* Message */}
            {msg && (
              <div
                className="text-sm text-center px-4 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: msg.toLowerCase().includes("success") ? '#e8f5e9' : '#ffebee',
                  color: msg.toLowerCase().includes("success") ? '#2e7d32' : '#A51212',
                  border: `1px solid ${msg.toLowerCase().includes("success") ? '#4caf50' : '#A51212'}`
                }}
              >
                {msg}
              </div>
            )}
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <p className="text-base" style={{ color: '#5A3A22' }}>
            New to Srinibas Vastra?{' '}
            <a
              href="/signup"
              className="font-semibold underline decoration-2 transition-colors duration-200"
              style={{ color: '#E0A11B' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#C88912'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#E0A11B'}
            >
              Create Account
            </a>
          </p>
        </div>

        {/* Secure Badge */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E0A11B' }} />
          <p className="text-xs tracking-wider uppercase" style={{ color: '#5A3A22', opacity: 0.7 }}>
            Secure & Encrypted
          </p>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E0A11B' }} />
        </div>
      </div>
    </div>
  );
}
