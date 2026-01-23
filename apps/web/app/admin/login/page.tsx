"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/src/components/ThemeToggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto scanlines flex items-center justify-center px-4" style={{ background: 'var(--color-bg-primary)', transition: 'var(--theme-transition)' }}>
      <div className="vaporwave-grid" />
      <div className="absolute inset-0 opacity-30" style={{
        background: 'var(--gradient-bg-overlay)',
        transition: 'var(--theme-transition)'
      }} />
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      <div className="relative z-10 w-full max-w-md space-y-6 md:space-y-8 card-admin p-5 md:p-8 backdrop-blur-md mx-2">
        <div className="text-center space-y-3 md:space-y-4">
          <div className="glow-soft flex justify-center">
            <img src="/logo.png" alt="The Feeder Logo" className="w-14 h-14 md:w-20 md:h-20 opacity-80" />
          </div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary neon-glow-pink">Admin Login</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Sign in to manage feeds and subscribers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          {error && (
            <div className="border border-destructive/50 bg-destructive/10 text-destructive p-2 md:p-3 rounded-lg text-xs md:text-sm card-admin">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="label-admin mb-1.5 md:mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-admin w-full text-foreground"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label-admin mb-1.5 md:mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-admin w-full text-foreground"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-admin btn-admin-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

