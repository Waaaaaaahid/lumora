import { api } from "@/services/api";
import type { CafeSettings, Category, MenuItem } from "@/lib/types";

/** GET /api/menu, /api/categories, GET /api/cafe/settings */
export const menuService = {
  list: (category?: string, newArrivals = false) => { const params = new URLSearchParams(); if (category) params.set("category", category); if (newArrivals) params.set("newArrival", "true"); const query = params.toString(); return api.get<MenuItem[]>(`/menu${query ? `?${query}` : ""}`, { auth: false }); },
  get: (id: string) => api.get<MenuItem>(`/menu/${id}`, { auth: false }),
  categories: () => api.get<Category[]>("/categories", { auth: false }),
  settings: () => api.get<CafeSettings>("/cafe/settings", { auth: false }),
};