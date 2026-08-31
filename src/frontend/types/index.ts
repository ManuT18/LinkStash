export type PlatformType = 'youtube' | 'tiktok' | 'instagram' | 'other';
export type LinkStatus = 'pending' | 'reviewed';

export interface Link {
  id: number;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  platform: PlatformType;
  category: string;
  status: LinkStatus;
  notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface Category {
  id: number | string;
  name: string;
  emoji: string;
  keywords: string[];
  color: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface PlatformCount {
  platform: string;
  count: number;
}

export interface Stats {
  total: number;
  pending: number;
  reviewed: number;
  byCategory: CategoryCount[];
  byPlatform: PlatformCount[];
  totalLinks?: number;
  unreadCount?: number;
  readCount?: number;
  archivedCount?: number;
  categoryCounts?: Record<string, number>;
}

export interface FetchLinksFilters {
  category?: string;
  status?: string;
  platform?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FetchLinksResponse {
  links: Link[];
  total: number;
  page?: number;
  totalPages?: number;
}

export interface CreateLinkPayload {
  url: string;
  category?: string;
}

export interface UpdateLinkPayload {
  category?: string;
  status?: LinkStatus;
  notes?: string;
  title?: string;
  url?: string;
}

export interface UpdateCategoryKeywordsPayload {
  keywords: string[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
