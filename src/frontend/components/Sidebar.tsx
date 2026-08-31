import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bookmark,
  Clock,
  CheckCircle2,
  FolderTree,
  Sliders,
  X,
  ChevronRight,
  Folder,
  Tag,
} from 'lucide-react';
import { Category, Stats } from '../types';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'total' | 'pending' | 'reviewed';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'all', label: 'All Links', icon: Bookmark, badgeKey: 'total' },
  { id: 'pending', label: 'Pending', icon: Clock, badgeKey: 'pending' },
  { id: 'reviewed', label: 'Reviewed', icon: CheckCircle2, badgeKey: 'reviewed' },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'settings', label: 'Settings', icon: Sliders },
];

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  categories: Category[];
  selectedCategory?: string | null;
  onSelectCategory?: (categoryName: string | null) => void;
  stats?: Stats | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  categories,
  selectedCategory,
  onSelectCategory,
  stats,
  mobileOpen = false,
  onMobileClose,
}) => {
  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    if (onSelectCategory) {
      // Reset category filter unless explicitly selecting category
      onSelectCategory(null);
    }
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleCategoryClick = (categoryName: string | null) => {
    if (onSelectCategory) {
      onSelectCategory(categoryName);
    }
    onTabChange('all');
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const getBadgeCount = (badgeKey?: 'total' | 'pending' | 'reviewed') => {
    if (!stats || !badgeKey) return null;
    if (badgeKey === 'total') return stats.totalLinks ?? stats.total ?? 0;
    if (badgeKey === 'pending') return stats.unreadCount ?? stats.pending ?? 0;
    if (badgeKey === 'reviewed') return stats.readCount ?? stats.reviewed ?? 0;
    return null;
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-6 px-4 overflow-y-auto custom-scrollbar">
      <div className="space-y-6">
        {/* Application Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 group cursor-pointer select-none transition-transform hover:opacity-90 active:scale-95"
            role="button"
            title="Ir al Dashboard principal"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-lg tracking-tight text-gradient-neon group-hover:text-blue-400 transition-colors">LinkStash</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                AI Bookmark Vault
              </p>
            </div>
          </div>
          {/* Mobile Close Button */}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Navigation Links */}
        <div>
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !selectedCategory;
              const count = getBadgeCount(item.badgeKey);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400 border-l-2 border-blue-500 font-semibold shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-blue-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {count !== null && count > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-blue-500/30 text-blue-300'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Category Shortcuts Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Category Shortcuts
            </p>
            {categories.length > 0 && (
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-mono">
                {categories.length}
              </span>
            )}
          </div>

          <div className="space-y-1">
            {/* All Categories Option */}
            <button
              onClick={() => handleCategoryClick(null)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'all' && selectedCategory === null
                  ? 'bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">All Categories</span>
              </div>
            </button>

            {categories.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-slate-400 italic bg-white/5 rounded-xl border border-white/5">
                No categories found
              </div>
            ) : (
              categories.map((cat) => {
                const isCatActive =
                  activeTab === 'all' && selectedCategory === cat.name;
                const catCount = stats?.categoryCounts?.[cat.name];

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isCatActive
                        ? 'bg-blue-500/20 text-blue-400 border-l-2 border-blue-500 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base leading-none shrink-0">
                        {cat.emoji || '📁'}
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </div>

                    {catCount !== undefined && catCount > 0 && (
                      <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 group-hover:text-slate-300">
                        {catCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Info / Micro-card */}
      <div className="mt-6 pt-4 border-t border-white/10 px-2">
        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
            LinkStash Bookmark Vault
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Hecho con ❤️ por Manuel Tauro
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed permanent) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 h-screen backdrop-blur-xl bg-[#0b0f19]/95 border-r border-white/10 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Slide-over Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 backdrop-blur-xl bg-[#0b0f19]/95 border-r border-white/10 z-50 md:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
