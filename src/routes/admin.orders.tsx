import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
export const Route = createFileRoute("/admin/orders")({ component: RetiredAdminRoute });
function RetiredAdminRoute() { const navigate = useNavigate(); useEffect(() => { void navigate({ to: "/admin/our-work", replace: true }); }, [navigate]); return <main className="min-h-screen grid place-items-center bg-[#f5f4f1] text-[#292a25]"><p className="text-sm">Redirecting…</p></main>; }