import {
  Link,
  Category,
  Stats,
  FetchLinksFilters,
  FetchLinksResponse,
  CreateLinkPayload,
  UpdateLinkPayload,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP Error ${response.status}`);
  }
  return response.json();
}

export const api = {
  /**
   * Fetch paginated and filtered links
   */
  async getLinks(filters: FetchLinksFilters = {}): Promise<FetchLinksResponse> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.platform) params.append('platform', filters.platform);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = `${API_BASE}/links${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url, { credentials: 'same-origin' });
    const data = await handleResponse<{ links: Link[]; total: number; page?: number; totalPages?: number }>(res);
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil((data.total || 0) / limit) || 1;

    return {
      links: data.links || [],
      total: data.total || 0,
      page,
      totalPages,
    };
  },

  /**
   * Create a new link
   */
  async createLink(payload: CreateLinkPayload): Promise<Link> {
    const res = await fetch(`${API_BASE}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    return handleResponse<Link>(res);
  },

  /**
   * Update an existing link
   */
  async updateLink(id: number, payload: UpdateLinkPayload): Promise<Link> {
    const res = await fetch(`${API_BASE}/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    return handleResponse<Link>(res);
  },

  /**
   * Delete a link
   */
  async deleteLink(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/links/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    return handleResponse<{ success: boolean }>(res);
  },

  /**
   * Fetch all categories
   */
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`, { credentials: 'same-origin' });
    return handleResponse<Category[]>(res);
  },

  /**
   * Update category keywords
   */
  async updateCategoryKeywords(categoryId: string | number, keywords: string[]): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/categories/${categoryId}/keywords`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ keywords }),
    });
    return handleResponse<{ success: boolean }>(res);
  },

  /**
   * Fetch dashboard statistics
   */
  async getStats(): Promise<Stats> {
    const res = await fetch(`${API_BASE}/stats`, { credentials: 'same-origin' });
    const stats = await handleResponse<Stats>(res);
    return {
      ...stats,
      totalLinks: stats.total,
      unreadCount: stats.pending,
      readCount: stats.reviewed,
      archivedCount: 0,
      categoryCounts: (stats.byCategory || []).reduce((acc, curr) => {
        acc[curr.category] = curr.count;
        return acc;
      }, {} as Record<string, number>),
    };
  },
};
