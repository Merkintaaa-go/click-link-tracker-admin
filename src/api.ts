
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Link {
  id: number;
  code: string;
  white_url: string;
  black_url: string;
  created_at: string;
}

export interface Click {
  id: number;
  ip: string;
  user_agent: string;
  country: string;
  is_bot: boolean;
  link_id: number;
  created_at: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface LinkStats {
  total_clicks: number;
  bot_clicks: number;
  country_stats: Array<{
    country: string;
    count: number;
  }>;
}

export interface FilterParams {
  country?: string;
  is_bot?: boolean;
}

// API functions
export const getLinks = async ({ page, pageSize }: PaginationParams) => {
  const response = await api.get('/links', {
    params: { page, pageSize },
  });
  return response.data;
};

export const createLink = async (linkData: { white_url: string; black_url: string }) => {
  const response = await api.post('/links', linkData);
  return response.data;
};

export const getLinkStats = async (id: number) => {
  const response = await api.get(`/links/${id}/stats`);
  return response.data as LinkStats;
};

export const getClicks = async ({ 
  page, 
  pageSize, 
  ...filters 
}: PaginationParams & FilterParams) => {
  const response = await api.get('/clicks', {
    params: { page, pageSize, ...filters },
  });
  return response.data;
};

export default api;
