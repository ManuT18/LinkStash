import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Bookmark,
  Clock,
  CheckCircle2,
  FolderTree,
  Sliders,
  ExternalLink,
  Layers,
  Search,
  Filter,
  Inbox,
  RotateCcw,
  Check,
  Tag,
  ShieldCheck,
  Database,
  Cpu,
} from 'lucide-react';
import { api } from './services/api';
import { Stats, Category, Link, LinkStatus, UpdateLinkPayload } from './types';
import { Layout } from './components/Layout';
import { StatsOverview } from './components/StatsOverview';
import { LinkCard } from './components/LinkCard';
import { AddLinkModal } from './components/AddLinkModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { Pagination } from './components/Pagination';

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [totalLinks, setTotalLinks] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(12);

  const [loading, setLoading] = useState<boolean>(true);
  const [feedLoading, setFeedLoading] = useState<boolean>(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  // Active navigation tab & category filter
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null); // 'all' | 'pending' | 'reviewed'
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  // Fetch Stats & Categories
  const loadStatsAndCategories = useCallback(async () => {
    try {
      const [statsData, categoriesData] = await Promise.all([
        api.getStats(),
        api.getCategories(),
      ]);
      setStats(statsData);
      setCategories(categoriesData);
      setApiConnected(true);
    } catch (err) {
      console.warn('API connection error:', err);
      setApiConnected(false);
    }
  }, []);

  // Fetch Feed Links with filters and pagination
  const fetchLinks = useCallback(async () => {
    setFeedLoading(true);
    try {
      // Derive effective status filter
      let effectiveStatus: string | undefined = undefined;
      if (activeTab === 'pending') {
        effectiveStatus = 'pending';
      } else if (activeTab === 'reviewed') {
        effectiveStatus = 'reviewed';
      } else if (selectedStatus && selectedStatus !== 'all') {
        effectiveStatus = selectedStatus;
      }

      const res = await api.getLinks({
        page,
        limit,
        category: selectedCategory || undefined,
        status: effectiveStatus,
        platform: selectedPlatform && selectedPlatform !== 'all' ? selectedPlatform : undefined,
        search: searchQuery || undefined,
      });

      setLinks(res.links);
      setTotalLinks(res.total);
      setTotalPages(res.totalPages || Math.ceil(res.total / limit) || 1);
    } catch (err) {
      console.error('Failed to fetch links feed:', err);
      setLinks([]);
      setTotalLinks(0);
      setTotalPages(1);
    } finally {
      setFeedLoading(false);
    }
  }, [page, limit, activeTab, selectedCategory, selectedStatus, selectedPlatform, searchQuery]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadStatsAndCategories();
      setLoading(false);
    };
    init();
  }, [loadStatsAndCategories]);

  // Refetch feed links when filters/pagination/activeTab change
  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Handle Card Status Toggle
  const handleStatusToggle = async (id: number, currentStatus: LinkStatus) => {
    const newStatus: LinkStatus = currentStatus === 'pending' ? 'reviewed' : 'pending';
    // Optimistic UI update
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );

    try {
      await api.updateLink(id, { status: newStatus });
      loadStatsAndCategories();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      fetchLinks(); // revert on error
    }
  };

  // Handle Link Update (notes, title, url, category)
  const handleUpdateLink = async (id: number, payload: UpdateLinkPayload) => {
    try {
      const updated = await api.updateLink(id, payload);
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
      loadStatsAndCategories();
    } catch (err) {
      console.error('Failed to update link:', err);
      throw err;
    }
  };

  // Handle Link Delete
  const handleDeleteLink = async (id: number) => {
    try {
      await api.deleteLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setTotalLinks((prev) => Math.max(0, prev - 1));
      loadStatsAndCategories();
    } catch (err) {
      console.error('Failed to delete link:', err);
      throw err;
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedStatus(null);
    setSelectedPlatform(null);
    setPage(1);
  };

  // Stat Card click handler
  const handleStatCardClick = (cardId: string) => {
    setPage(1);
    if (cardId === 'total') {
      setActiveTab('all');
      setSelectedCategory(null);
      setSelectedStatus(null);
    } else if (cardId === 'pending') {
      setActiveTab('pending');
      setSelectedCategory(null);
      setSelectedStatus('pending');
    } else if (cardId === 'reviewed') {
      setActiveTab('reviewed');
      setSelectedCategory(null);
      setSelectedStatus('reviewed');
    } else if (cardId === 'categories') {
      setActiveTab('categories');
      setShowCategoryModal(true);
    }
  };

  const getTabTitle = () => {
    if (selectedCategory) return `Category: ${selectedCategory}`;
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'all':
        return 'All Saved Links';
      case 'pending':
        return 'Pending Review';
      case 'reviewed':
        return 'Reviewed Links';
      case 'categories':
        return 'Categories Keyword Manager';
      case 'settings':
        return 'Dashboard Settings';
      default:
        return 'LinkStash Workspace';
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setPage(1);
        if (tab === 'categories') {
          setShowCategoryModal(true);
        }
      }}
      categories={categories}
      selectedCategory={selectedCategory}
      onSelectCategory={(catName) => {
        setSelectedCategory(catName);
        setPage(1);
      }}
      stats={stats}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>{getTabTitle()}</span>
            {totalLinks > 0 && activeTab !== 'dashboard' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                {totalLinks} {totalLinks === 1 ? 'link' : 'links'}
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {selectedCategory
              ? `Showing saved links categorized as ${selectedCategory}`
              : activeTab === 'dashboard'
              ? 'Real-time metrics, AI categorizer rules, and bookmark feed'
              : `Viewing ${activeTab} links vault`}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3.5 py-2 rounded-xl glass-card hover:border-purple-500/30 transition-all text-purple-300 hover:text-purple-200 active:scale-95 flex items-center gap-2 text-xs font-semibold cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-purple-400" />
            <span>Manage Keywords</span>
          </button>

          <button
            onClick={() => {
              loadStatsAndCategories();
              fetchLinks();
            }}
            disabled={loading || feedLoading}
            className="px-3.5 py-2 rounded-xl glass-card hover:border-white/20 transition-all text-slate-300 hover:text-white active:scale-95 disabled:opacity-50 flex items-center gap-2 text-xs font-semibold cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading || feedLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Banner Cards */}
      <StatsOverview
        stats={stats}
        categoryCount={categories.length}
        loading={loading}
        onCardClick={handleStatCardClick}
      />

      {/* Dashboard View specific sections */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Hero Feature Banner REMOVED */}

          {/* Categories Explorer Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-purple-400" />
                <span>Categories Quick Explorer</span>
              </h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300"
              >
                Configure Keywords →
              </button>
            </div>

            {categories.length === 0 && !loading ? (
              <div className="p-8 rounded-2xl glass-card border border-white/10 text-center space-y-2">
                <FolderTree className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-medium text-slate-400">No categories found in system</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const count = stats?.categoryCounts?.[cat.name] || 0;
                  const isSelected = selectedCategory === cat.name;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(isSelected ? null : cat.name);
                        setActiveTab('all');
                      }}
                      className={`p-4.5 rounded-2xl glass-card glass-card-hover border flex items-center justify-between cursor-pointer group transition-all ${
                        isSelected
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                          {cat.emoji || '📁'}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                            {cat.name}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-1">
                            {cat.keywords ? cat.keywords.slice(0, 3).join(', ') : 'No keywords'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                        {count} links
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab view */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-card border border-white/10 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-purple-400" />
                <span>Categories & Auto-Categorization Keywords</span>
              </h3>
              <p className="text-xs text-slate-400">
                The AI Categorizer matches incoming links against these keywords to assign category tags automatically.
              </p>
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Edit Keywords</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-5 rounded-2xl glass-card border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/5">
                      {cat.emoji || '📁'}
                    </span>
                    <h4 className="text-base font-bold text-white">{cat.name}</h4>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                    {stats?.categoryCounts?.[cat.name] || 0} links
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(cat.keywords || []).map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700"
                    >
                      #{kw}
                    </span>
                  ))}
                  {(!cat.keywords || cat.keywords.length === 0) && (
                    <span className="text-xs text-slate-500 italic">No keywords assigned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab view */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              <span>System Status & Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>API Status</span>
                </div>
                <p className="text-sm font-extrabold text-white">
                  {apiConnected ? 'Connected (200 OK)' : 'Disconnected'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Database className="w-4 h-4" />
                  <span>Database Engine</span>
                </div>
                <p className="text-sm font-extrabold text-white">SQLite 3 (LinkStash DB)</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Cpu className="w-4 h-4" />
                  <span>AI Categorizer</span>
                </div>
                <p className="text-sm font-extrabold text-white">Keyword Matcher Active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Link Feed Section (Rendered for dashboard preview & all/pending/reviewed tabs) */}
      {activeTab !== 'categories' && activeTab !== 'settings' && (
        <div className="space-y-6">
          {/* Links Feed Grid / Skeletons / Empty State */}

          {/* Links Feed Grid / Skeletons / Empty State */}
          {feedLoading ? (
            /* Skeleton Loaders */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl glass-card border border-white/5 p-5 space-y-4 animate-pulse h-56 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-6 bg-slate-800 rounded-lg" />
                    <div className="w-20 h-6 bg-slate-800 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-3/4 h-5 bg-slate-800 rounded-md" />
                    <div className="w-1/2 h-4 bg-slate-800/60 rounded-md" />
                    <div className="w-full h-10 bg-slate-800/40 rounded-xl" />
                  </div>
                  <div className="w-full h-8 bg-slate-800/50 rounded-xl" />
                </div>
              ))}
            </div>
          ) : links.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 rounded-3xl glass-card border border-white/10 text-center space-y-4 max-w-lg mx-auto shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400">
                <Inbox className="w-8 h-8 text-blue-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">No links found</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {searchQuery || selectedCategory || selectedStatus || selectedPlatform
                    ? 'No links match your current active filters and search query.'
                    : 'Your LinkStash vault is empty. Save your first link now!'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {(searchQuery || selectedCategory || selectedStatus || selectedPlatform) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Link</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* Link Cards Feed Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {links.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    categories={categories}
                    onStatusToggle={handleStatusToggle}
                    onDelete={handleDeleteLink}
                    onUpdate={handleUpdateLink}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination Controls */}
          {!feedLoading && links.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalLinks}
              limit={limit}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) for manual link addition */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 z-40 p-4 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-[0_4px_25px_rgba(79,70,229,0.5)] hover:shadow-[0_6px_30px_rgba(79,70,229,0.75)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 border border-white/20 cursor-pointer group"
        title="Añadir Link Manualmente"
        aria-label="Añadir Link Manualmente"
      >
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 stroke-[2.5]" />
        <span className="hidden sm:inline font-bold tracking-wide">Añadir Link</span>
      </button>

      {/* Add Link Quick Action Modal */}
      <AddLinkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
        onSuccess={() => {
          fetchLinks();
          loadStatsAndCategories();
        }}
      />

      {/* Category Keywords Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        onCategoriesUpdated={() => {
          loadStatsAndCategories();
        }}
      />
    </Layout>
  );
}
