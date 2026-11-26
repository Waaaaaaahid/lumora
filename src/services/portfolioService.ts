import { api } from "@/services/api";

export interface PortfolioImage {
  url: string;
  publicId?: string;\n  mediaType?: 'image' | 'video';
  alt?: string;
}

export interface PortfolioProject {
  _id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  images: PortfolioImage[];
  featured: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const portfolioService = {
  list: () => api.get<PortfolioProject[]>("/portfolio", { auth: false }),
  listAdmin: () => api.get<PortfolioProject[]>("/portfolio/admin"),
  create: (input: Omit<PortfolioProject, "_id" | "createdAt" | "updatedAt">) => api.post<PortfolioProject>("/portfolio", input),
  update: (id: string, input: Partial<PortfolioProject>) => api.put<PortfolioProject>(`/portfolio/${id}`, input),
  remove: (id: string) => api.delete<{ _id: string }>(`/portfolio/${id}`),
};
