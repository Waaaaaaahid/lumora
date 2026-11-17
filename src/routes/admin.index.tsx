import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ClipboardList, IndianRupee, ShoppingBag, UsersRound, UtensilsCrossed,
} from "lucide-react";
import { orderService } from "@/services/orderService";
import { menuService } from "@/services/menuService";
import { adminService } from "@/services/adminService";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { StatCard } from "@/components/admin/StatCard";
import { OrderStatusPill } from "@/components/admin/StatusPill";
import { ErrorState, Skeleton, TableSkeleton } from "@/components/Loading/Loading";
import { ORDER_STATUSES, type Order, type MenuItem } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin" },
      { name: "description", content: "Overview of orders, revenue and menu performance." },
      { property: "og:title", content: "Dashboard — Admin" },
      { property: "og:description", content: "Overview of orders, revenue and menu performance." },
    ],
  }),
  component: AdminDashboard,
});

const CHART_COLORS = ["#B96B19", "#D99A55", "#71816A", "#8B789D", "#D6B77A", "#7C8C9B"];
const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
};

function isToday(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
}

function isSameDay(dateString: string, day: Date) {
  const date = new Date(dateString);
  return date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate();
}

/** A sale counts toward revenue unless cancelled or the payment failed/refunded. */
function isSaleRevenue(order: Order) {
  if (order.orderStatus === "Cancelled") return false;
  if (order.paymentStatus === "paid") return true;
  return order.paymentMethod === "cod" &&
    order.paymentStatus !== "failed" &&
    order.paymentStatus !== "refunded";
}

function buildRevenueSeries(orders: Order[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });

  return days.map((day) => ({
    label: day.toLocaleDateString(undefined, { weekday: "short" }),
    revenue: orders
      .filter((order) => isSaleRevenue(order) && isSameDay(order.createdAt, day))
      .reduce((sum, order) => sum + order.totalAmount, 0),
  }));
}

function formatAxisCurrency(value: number) {
  if (value >= 1000) {
    const compact = value % 1000 === 0 ? value / 1000 : (value / 1000).toFixed(1);
    return `₹${compact}k`;
  }
  return formatCurrency(value);
}

function getCategoryLabel(item: MenuItem, categoryNames: Map<string, string>) {
  const raw = item.category as unknown as string | { _id?: string; name?: string; slug?: string };
  if (typeof raw === "object" && raw !== null) {
    return raw.name || (raw.slug ? categoryNames.get(raw.slug) : undefined) || "Other";
  }
  return categoryNames.get(String(raw)) || "Other";
}

function ChartCard({ title, subtitle, children, className = "" }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6 ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyChart({ message = "Not enough order data yet." }: { message?: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border px-5 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function AdminDashboard() {
  const ordersQuery = useQuery({ queryKey: ["admin-orders"], queryFn: orderService.listAll });
  const statsQuery = useQuery({ queryKey: ["admin-stats"], queryFn: adminService.getStats });
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: adminService.listUsers });
  const menuQuery = useQuery({ queryKey: ["admin-menu"], queryFn: menuService.list });
  const categoriesQuery = useQuery({ queryKey: ["admin-categories"], queryFn: adminService.listCategories });

  const isLoading = ordersQuery.isLoading || usersQuery.isLoading || menuQuery.isLoading;
  const isError = ordersQuery.isError || usersQuery.isError || menuQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-3xl" />)}
        </div>
        <Skeleton className="h-80 rounded-3xl" />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load dashboard"
        description="There was a problem fetching the admin data."
        onRetry={() => {
          void ordersQuery.refetch();
          void usersQuery.refetch();
          void menuQuery.refetch();
        }}
      />
    );
  }

  const orders = ordersQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const menuItems = menuQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const categoryNames = new Map(categories.flatMap((category) => [
    [category.slug, category.name] as [string, string],
    [category._id, category.name] as [string, string],
  ]));

  const todayOrders = orders.filter((order) => isToday(order.createdAt));
  const saleOrders = orders.filter(isSaleRevenue);
  const totalRevenue = saleOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const statusBreakdown = ORDER_STATUSES.map((status) => ({
    status,
    count: orders.filter((order) => order.orderStatus === status).length,
  })).filter((entry) => entry.count > 0);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // Keep the existing weekly revenue graph unchanged.
  const revenueSeries = statsQuery.data?.revenueSeries ?? buildRevenueSeries(orders);
  const maxRevenue = Math.max(...revenueSeries.map((entry) => entry.revenue), 0);

  // Revenue by category is derived from real order line items and their menu categories.
  const menuById = new Map(menuItems.map((item) => [item._id, item]));
  const categoryTotals = new Map<string, number>();
  const productTotals = new Map<string, { name: string; quantity: number; revenue: number }>();
  saleOrders.forEach((order) => order.items.forEach((line) => {
    const product = productTotals.get(line.item) ?? { name: line.name, quantity: 0, revenue: 0 };
    product.quantity += line.quantity;
    product.revenue += line.price * line.quantity;
    productTotals.set(line.item, product);

    const menuItem = menuById.get(line.item);
    const category = menuItem ? getCategoryLabel(menuItem, categoryNames) : "Other";
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + line.price * line.quantity);
  }));

  const categoryData = [...categoryTotals.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  const topProducts = [...productTotals.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const paymentTotals = new Map<string, number>();
  saleOrders.forEach((order) => {
    const method = order.paymentMethod === "cod" ? "Cash on delivery" : "Online payment";
    paymentTotals.set(method, (paymentTotals.get(method) ?? 0) + order.totalAmount);
  });
  const paymentData = [...paymentTotals.entries()].map(([name, revenue]) => ({ name, revenue }));

  const now = new Date();
  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    return {
      month: month.toLocaleDateString(undefined, { month: "short" }),
      revenue: saleOrders
        .filter((order) => {
          const date = new Date(order.createdAt);
          return date >= month && date < nextMonth;
        })
        .reduce((sum, order) => sum + order.totalAmount, 0),
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-accent">Overview</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">A snapshot of how your store is performing right now.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Orders" value={String(orders.length)} icon={ClipboardList} />
        <StatCard label="Today's Orders" value={String(todayOrders.length)} icon={ShoppingBag} accent />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue)} icon={IndianRupee} />
        <StatCard label="Total Users" value={String(users.length)} icon={UsersRound} />
        <StatCard label="Menu Items" value={String(menuItems.length)} icon={UtensilsCrossed} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft xl:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Weekly revenue</h2>
          <p className="text-xs text-muted-foreground">Paid revenue over the last 7 days</p>
          <div className="mt-4 h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} minTickGap={14} tickMargin={8} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={78} domain={[0, Math.max(maxRevenue, 1)]} allowDecimals={false} tickMargin={6} tickFormatter={(value: number) => formatAxisCurrency(value)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-foreground">Orders by status</h2>
          <div className="mt-4 space-y-3">
            {statusBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : statusBreakdown.map((entry) => (
              <div key={entry.status} className="flex items-center justify-between gap-3">
                <OrderStatusPill status={entry.status} />
                <span className="text-sm font-semibold text-foreground">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-semibold text-accent hover:underline">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 font-semibold">Code</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Placed</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-t border-border">
                    <td className="py-3 font-semibold text-foreground">{order.code}</td>
                    <td className="py-3 text-muted-foreground">{order.customerDetails.name}</td>
                    <td className="py-3 text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                    <td className="py-3 font-medium text-foreground">{formatCurrency(order.totalAmount)}</td>
                    <td className="py-3"><OrderStatusPill status={order.orderStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional analytics continue below the existing dashboard content. */}
      <div className="space-y-4 pt-2">
        <div>
          <p className="eyebrow text-accent">Store insights</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Sales & performance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Explore how products, categories and payment methods contribute to sales.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title="Revenue by category" subtitle="Sales value from items in each menu category">
            {categoryData.length === 0 ? <EmptyChart /> : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="revenue" nameKey="name" innerRadius="56%" outerRadius="82%" paddingAngle={3}>
                      {categoryData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                    <Legend verticalAlign="bottom" height={34} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Top-selling products" subtitle="Products ranked by item sales value">
            {topProducts.length === 0 ? <EmptyChart /> : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="4 8" stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value: number) => formatAxisCurrency(value)} fontSize={11} stroke="var(--color-muted-foreground)" />
                    <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="revenue" name="Sales" fill="#B96B19" radius={[0, 7, 7, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Monthly revenue" subtitle="Actual sales revenue across the last 6 months">
            {saleOrders.length === 0 ? <EmptyChart /> : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 8" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                    <YAxis tickFormatter={(value: number) => formatAxisCurrency(value)} tickLine={false} axisLine={false} fontSize={11} width={64} stroke="var(--color-muted-foreground)" />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="revenue" name="Revenue" fill="#71816A" radius={[7, 7, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Revenue by payment method" subtitle="Share of sales from online and cash-on-delivery orders">
            {paymentData.length === 0 ? <EmptyChart /> : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} dataKey="revenue" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={4}>
                      {paymentData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                    <Legend verticalAlign="bottom" height={34} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
