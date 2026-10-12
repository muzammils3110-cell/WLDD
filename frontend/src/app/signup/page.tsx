"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api";
import { homeFor, useAuth } from "@/context/AuthContext";
import { Role } from "@/types";

export default function SignupPage() {
  const { user, loading, signup } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("creator");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(homeFor(user.role));
  }, [user, loading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const u = await signup(email, password, role);
      router.replace(homeFor(u.role));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <h2>Create an account</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password (min 8 characters)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="role">I am a</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="creator">Creator</option>
              <option value="brand">Brand</option>
            </select>
          </div>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="muted">
          Already registered? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}