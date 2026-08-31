import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Category, Stats } from '../types';
import { Menu, Bookmark } from 'lucide-react';

export interface LayoutProps {
  children: React.ReactNode;
  apiConnected?: boolean | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  categories: Category[];
  selectedCategory?: string | null;
  onSelectCategory?: (categoryName: string | null) => void;
  stats?: Stats | null;
  onAddLink?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  categories,
  selectedCategory,
  onSelectCategory,
  stats,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col md:flex-row selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient neon glows */}
      <div className="fixed top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 translate-y-1/2 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/2 right-10 -translate-y-1/2 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Mobile-only compact top bar for menu toggle */}
      <div className="md:hidden sticky top-0 z-40 w-full backdrop-blur-md bg-[#0b0f19]/80 border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg">
        <div
          onClick={() => {
            onTabChange('dashboard');
            if (onSelectCategory) onSelectCategory(null);
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none transition-transform hover:opacity-90 active:scale-95"
          role="button"
          title="Ir al Dashboard principal"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/25">
            <Bookmark className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-gradient-neon">LinkStash</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Glass Navigation Sidebar (Fixed) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        stats={stats}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset with md:pl-64 for fixed sidebar) */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
};
