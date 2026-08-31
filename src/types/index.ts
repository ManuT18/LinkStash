export interface LinkItem {
  id: number;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'other';
  category: string;
  status: 'pending' | 'reviewed';
  notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface Category {
  id: number;
  name: string;
  emoji: string;
  keywords: string[];
  color: string;
}

export interface MetadataResult {
  title: string;
  description: string;
  thumbnail: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'other';
}
