"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loader from "@/components/common/Loader";
import { homeFor, useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? homeFor(user.role) : "/login");
  }, [user, loading, router]);

  return <Loader />;
}