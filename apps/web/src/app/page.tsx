"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { user, isClient } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace("/login");
    else if (isClient) router.replace("/portal");
    else router.replace("/app/home");
  }, [user, isClient, router]);

  return (
    <div className="grid min-h-screen place-items-center text-[var(--color-muted)]">
      Redirecting…
    </div>
  );
}
