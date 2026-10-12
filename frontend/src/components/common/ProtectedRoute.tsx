"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { homeFor, useAuth } from "@/context/AuthContext";
import { Role } from "@/types";
import Loader from "./Loader";
import Navbar from "./Navbar";

export default function ProtectedRoute({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(homeFor(user.role));
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) return <Loader />;

  return (
    <>
      <Navbar />
      <main className="container">{children}</main>
    </>
  );
}