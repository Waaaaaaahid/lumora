import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute/ProtectedRoute";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Design Studio Admin — Lumora Curio" },
      { name: "description", content: "Manage interior portfolio, gallery categories, enquiries and website settings for Lumora Curio." },
      { property: "og:title", content: "Admin Console — Lumora Curio" },
      { property: "og:description", content: "Manage projects, enquiries and website settings for Lumora Curio." },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <ProtectedRoute adminOnly>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </ProtectedRoute>
  );
}
