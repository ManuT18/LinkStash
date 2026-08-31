import React from 'react';
import {
  Filter,
  RotateCcw,
  Tag,
  Clock,
  CheckCircle2,
  Globe,
  Layers,
} from 'lucide-react';
import { Category } from '../types';

export interface FilterBarProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedStatus: string | null; // 'all' | 'pending' | 'reviewed'
  onStatusChange: (status: string | null) => void;
  selectedPlatform: string | null; // 'all' | 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'github' | 'other'
  onPlatformChange: (platform: string | null) => void;
  categories: Category[];
  onResetFilters: () => void;
  totalFilteredCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedPlatform,
  onPlatformChange,
  categories,
  onResetFilters,
}) => {
  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedStatus && selectedStatus !== 'all' ? 1 : 0) +
    (selectedPlatform && selectedPlatform !== 'all' ? 1 : 0);

  const statusOptions: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Links', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'pending', label: 'Pending', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'reviewed', label: 'Reviewed', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  return (
    <div className="rounded-2xl glass-card border border-white/10 p-3.5 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
      {/* Status Tabs */}
      <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-white/5 overflow-x-auto">
        {statusOptions.map((opt) => {
          const isActive =
            (!selectedStatus && opt.id === 'all') || selectedStatus === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onStatusChange(opt.id === 'all' ? null : opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Select Dropdowns: Category & Platform + Reset button */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Category Filter Select */}
        <div className="relative">
          <select
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            className="px-3 py-1.5 pr-8 rounded-xl glass-input text-xs font-semibold bg-slate-900/80 text-slate-200 border border-white/10 appearance-none cursor-pointer hover:border-white/20 transition-all"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <Tag className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Platform Filter Select */}
        <div className="relative">
          <select
            value={selectedPlatform || ''}
            onChange={(e) => onPlatformChange(e.target.value || null)}
            className="px-3 py-1.5 pr-8 rounded-xl glass-input text-xs font-semibold bg-slate-900/80 text-slate-200 border border-white/10 appearance-none cursor-pointer hover:border-white/20 transition-all"
          >
            <option value="">All Platforms</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter / X</option>
            <option value="github">GitHub</option>
            <option value="other">Other / Web</option>
          </select>
          <Globe className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Active Filters / Reset */}
        {activeFiltersCount > 0 && (
          <button
            onClick={onResetFilters}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/5"
            title="Reset filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
