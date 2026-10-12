"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <nav className="navbar">
      <span className="brand-name">Meme&apos;d Payout Tracker</span>
      {user && (
        <div className="nav-right">
          <span className="muted">
            {user.email} <span className="badge">{user.role}</span>
          </span>
          <button className="btn btn-secondary btn-small" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}