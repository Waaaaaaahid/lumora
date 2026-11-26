import type { OrderStatus } from "@/lib/types";

export const APP_NAME = "Lumora Curio";

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Explore', to: '/our-work' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Our Work', to: '/our-work' },
] as const;

export const ADMIN_LINKS = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Gallery Categories', to: '/admin/categories' },
  { label: 'Our Work / Projects', to: '/admin/our-work' },
  { label: 'Enquiries', to: '/admin/enquiries' },
  { label: 'Website Settings', to: '/admin/settings' },
] as const;

// Legacy catalog sort options kept for backward compatibility; not used in the design portfolio UI.\nexport const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const ORDER_STATUS_FLOW: OrderStatus[] = ["Pending", "Confirmed", "Preparing", "Ready", "Out for Delivery", "Completed"];

export const STORAGE_KEYS = {
  cart: "cafe.cart.v1",
  session: "cafe.session.v1",
  lastOrder: "cafe.lastOrder.v1",
  coupon: "cafe.coupon.v1",
} as const;
