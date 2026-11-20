import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { LogOut, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute/ProtectedRoute";
import { Button } from "@/components/ui/AppButton";
import { Field, TextInput } from "@/components/ui/Field";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/Loading/Loading";
import { useAuth } from "@/context/AuthContext";
import { useCafe } from "@/context/CafeContext";
import { useToast } from "@/context/ToastContext";
import { orderService } from "@/services/orderService";
import { reviewService } from "@/services/reviewService";
import { formatCurrency, formatDate, initials } from "@/utils/format";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile & orders" },
      { name: "description", content: "Manage your profile details and review your previous orders." },
      { property: "og:title", content: "Your profile" },
      { property: "og:description", content: "Profile details and order history in one place." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { settings } = useCafe();
  const { notify } = useToast();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({});
  const reviewMutation = useMutation({
    mutationFn: reviewService.create,
    onSuccess: () => { notify("Product review submitted for approval", { variant: "success" }); void queryClient.invalidateQueries({ queryKey: ["my-orders", user?._id] }); },
    onError: (error: Error) => notify(error.message || "Could not submit review", { variant: "error" }),
  });

  const ordersQuery = useQuery({
    queryKey: ["my-orders", user?._id],
    queryFn: () => orderService.listMine(user?._id ?? ""),
    enabled: Boolean(user?._id),
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      notify("Profile updated", { variant: "success" });
    } catch {
      notify("Could not save your profile", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-page py-14">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-amber-gradient font-display text-xl font-semibold text-accent-foreground">
            {initials(user?.name ?? "")}
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold">{user?.name}</h1>
            <p className="text-sm text-muted-foreground">
              Member since {user ? formatDate(user.createdAt) : "—"}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="size-4" /> Log out
        </Button>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Your details</h2>
          <div className="mt-6 space-y-5">
            <Field id="profile-name" label="Full name">
              <TextInput
                id="profile-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field id="profile-email" label="Email">
              <TextInput
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </Field>
            <Field id="profile-phone" label="Phone">
              <TextInput
                id="profile-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </Field>
            <Button type="submit" loading={saving} className="w-full">
              Save changes
            </Button>
          </div>
        </form>

        <section className="rounded-3xl border border-border bg-card p-7 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Previous orders</h2>
          <div className="mt-6">
            {ordersQuery.isLoading ? (
              <TableSkeleton rows={3} />
            ) : ordersQuery.isError ? (
              <ErrorState onRetry={() => void ordersQuery.refetch()} />
            ) : (ordersQuery.data ?? []).length === 0 ? (
              <EmptyState
                title="No orders yet"
                description="Your order history will appear here."
                action={
                  <Link to="/menu">
                    <Button>Browse the menu</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {(ordersQuery.data ?? []).map((order) => (
                  <li
                    key={order._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{order.code}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.items.map((item) => `${item.name} ×${item.quantity}`).join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                        {order.orderStatus}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(order.totalAmount, settings.currency)}
                      </span>
                      <Link to="/order-tracking" search={{ orderId: order._id }}>
                        <Button variant="ghost" size="sm">
                          Track
                        </Button>
                      </Link>
                    </div>
                    {order.orderStatus === "Completed" ? (
                      <div className="mt-4 w-full space-y-3 border-t border-border pt-3">
                        <p className="text-xs font-semibold text-muted-foreground">Review purchased products</p>
                        {order.items.map((item) => {
                          const draft = reviewDrafts[item.item] ?? { rating: 5, comment: "" };
                          return (
                            <div key={item.item} className="rounded-xl bg-secondary/40 p-3">
                              <p className="text-sm font-semibold">{item.name}</p>
                              <div className="mt-2 flex gap-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button key={rating} type="button" onClick={() => setReviewDrafts((current) => ({ ...current, [item.item]: { ...draft, rating } }))} aria-label={`${rating} stars`}>
                                    <Star className={`size-5 ${rating <= draft.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                                  </button>
                                ))}
                              </div>
                              <textarea value={draft.comment} onChange={(event) => setReviewDrafts((current) => ({ ...current, [item.item]: { ...draft, comment: event.target.value } }))} placeholder="Share your experience with this product..." className="mt-2 min-h-20 w-full rounded-xl border border-border bg-background p-3 text-sm" />
                              <Button size="sm" className="mt-2" disabled={!draft.comment.trim() || reviewMutation.isPending} loading={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ orderId: order._id, itemId: item.item, rating: draft.rating, comment: draft.comment })}>Submit review</Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
