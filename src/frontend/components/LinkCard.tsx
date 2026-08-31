import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Copy,
  Check,
  Edit3,
  Trash2,
  MessageSquare,
  Globe,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Save,
  Tag,
} from 'lucide-react';
import { Link, LinkStatus, Category, UpdateLinkPayload } from '../types';

interface LinkCardProps {
  link: Link;
  categories?: Category[];
  onStatusToggle: (id: number, currentStatus: LinkStatus) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
  onUpdate: (id: number, payload: UpdateLinkPayload) => Promise<void> | void;
}

export const LinkCard: React.FC<LinkCardProps> = ({
  link,
  categories = [],
  onStatusToggle,
  onDelete,
  onUpdate,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(link.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Edit details state
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editTitle, setEditTitle] = useState(link.title || '');
  const [editUrl, setEditUrl] = useState(link.url || '');
  const [editCategory, setEditCategory] = useState(link.category || '');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Status toggle loading state
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const getDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleToggleStatus = async () => {
    if (isTogglingStatus) return;
    setIsTogglingStatus(true);
    try {
      const newStatus: LinkStatus = link.status === 'pending' ? 'reviewed' : 'pending';
      await onStatusToggle(link.id, link.status);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdate(link.id, { notes: notesText });
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Failed to update notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDetails(true);
    try {
      await onUpdate(link.id, {
        title: editTitle,
        url: editUrl,
        category: editCategory,
      });
      setIsEditingDetails(false);
    } catch (err) {
      console.error('Failed to update link details:', err);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeletingLoading(true);
    try {
      await onDelete(link.id);
    } catch (err) {
      console.error('Failed to delete link:', err);
      setIsDeletingLoading(false);
    }
  };

  // Find category emoji
  const catObj = categories.find(
    (c) => c.name.toLowerCase() === (link.category || '').toLowerCase()
  );

  // Platform Badge Renderer
  const renderPlatformBadge = () => {
    const p = (link.platform || 'other').toLowerCase();

    switch (p) {
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold shadow-sm shadow-red-500/10">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>YouTube</span>
          </span>
        );
      case 'tiktok':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-sm">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.891 2.893 2.895 2.895 0 0 1-2.894-2.893 2.895 2.895 0 0 1 2.894-2.892c.328 0 .641.057.933.161V9.432a6.326 6.326 0 0 0-.933-.07 6.339 6.339 0 0 0-6.335 6.336 6.339 6.339 0 0 0 6.335 6.336 6.339 6.339 0 0 0 6.335-6.336V9.066a8.211 8.211 0 0 0 4.771 1.516V7.137a4.783 4.783 0 0 1-1.000-.451z" />
            </svg>
            <span>TikTok</span>
          </span>
        );
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 border border-pink-500/30 text-pink-300 text-xs font-semibold shadow-sm">
            <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            <span>Instagram</span>
          </span>
        );
      case 'twitter':
      case 'x':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold shadow-sm shadow-sky-500/10">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Twitter/X</span>
          </span>
        );
      case 'github':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700/40 border border-slate-600/40 text-slate-200 text-xs font-semibold shadow-sm">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold shadow-sm">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Web</span>
          </span>
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: 15 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-2xl glass-card glass-card-hover border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl overflow-hidden group"
    >
      {/* Top Header Row: Platform badge, Category badge, Status toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          {renderPlatformBadge()}

          {/* Category Tag Badge */}
          {link.category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Tag className="w-3 h-3 text-purple-400" />
              <span>
                {catObj?.emoji ? `${catObj.emoji} ` : ''}
                {link.category}
              </span>
            </span>
          )}
        </div>

        {/* Status Toggle Pill */}
        <button
          onClick={handleToggleStatus}
          disabled={isTogglingStatus}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
            link.status === 'reviewed'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 glow-emerald'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 glow-amber'
          }`}
          title={`Click to mark as ${link.status === 'pending' ? 'Reviewed' : 'Pending'}`}
        >
          {link.status === 'reviewed' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Reviewed</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="space-y-2 flex-grow">
        {/* Title & External Link */}
        <div className="flex items-start justify-between gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-bold text-white hover:text-blue-400 transition-colors line-clamp-2 flex items-center gap-1.5 group/link"
          >
            <span>{link.title || link.url}</span>
            <ExternalLink className="w-4 h-4 opacity-70 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all flex-shrink-0" />
          </a>
        </div>

        {/* Domain Subtitle */}
        <p className="text-xs font-medium text-slate-400 flex items-center gap-1 truncate">
          <Globe className="w-3 h-3 text-slate-500" />
          <span>{getDomain(link.url)}</span>
        </p>

        {/* Thumbnail Preview if available */}
        {link.thumbnail && (
          <div className="mt-2 relative rounded-xl overflow-hidden max-h-40 border border-white/10 bg-black/40">
            <img
              src={link.thumbnail}
              alt={link.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Hide image container on error
                (e.target as HTMLElement).parentElement?.remove();
              }}
            />
          </div>
        )}

        {/* Description snippet */}
        {link.description && (
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mt-1">
            {link.description}
          </p>
        )}
      </div>

      {/* Inline Notes Section */}
      <div className="pt-2 border-t border-white/5 space-y-2">
        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add your notes about this link..."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditingNotes(false)}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setIsEditingNotes(true)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-left"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              {link.notes ? (
                <span className="italic line-clamp-1 text-slate-300">"{link.notes}"</span>
              ) : (
                <span className="text-slate-500 hover:text-slate-400">+ Add note</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons Toolbar */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
        <span className="text-[11px] text-slate-500 font-medium">
          {new Date(link.created_at).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Copy Link Action */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer relative"
            title="Copy URL to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Edit Details Action */}
          <button
            onClick={() => setIsEditingDetails(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Edit details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Action */}
          <button
            onClick={() => setIsDeleting(true)}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all active:scale-95 cursor-pointer"
            title="Delete link"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-center space-y-3 rounded-2xl"
          >
            <AlertTriangle className="w-8 h-8 text-red-400 animate-bounce" />
            <h4 className="text-sm font-bold text-white">Delete Link?</h4>
            <p className="text-xs text-slate-300 line-clamp-2 px-2">
              Are you sure you want to delete "{link.title || link.url}"?
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleting(false)}
                disabled={isDeletingLoading}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeletingLoading}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-600/30 flex items-center gap-1"
              >
                {isDeletingLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Details Modal Overlay */}
      <AnimatePresence>
        {isEditingDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md p-6 rounded-2xl glass-card border border-white/15 shadow-2xl space-y-4 bg-[#0b0f19]/95 text-left"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  Edit Link Details
                </h3>
                <button
                  onClick={() => setIsEditingDetails(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDetails} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    URL Address
                  </label>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl glass-input bg-slate-900 text-slate-200"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditingDetails(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDetails}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
                  >
                    {isSavingDetails ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
