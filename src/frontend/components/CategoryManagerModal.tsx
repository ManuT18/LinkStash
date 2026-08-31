import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  X,
  Plus,
  Tag,
  Save,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Category } from '../types';
import { api } from '../services/api';

export interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategoriesUpdated: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdated,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string | number>('');
  const [keywordsMap, setKeywordsMap] = useState<Record<string | number, string[]>>({});
  const [newKeywordInputMap, setNewKeywordInputMap] = useState<Record<string | number, string>>({});
  const [savingCatId, setSavingCatId] = useState<string | number | null>(null);
  const [successCatId, setSuccessCatId] = useState<string | number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync categories into local keyword map state when modal opens or categories change
  useEffect(() => {
    if (categories && categories.length > 0) {
      const map: Record<string | number, string[]> = {};
      categories.forEach((cat) => {
        map[cat.id] = [...(cat.keywords || [])];
      });
      setKeywordsMap(map);
      if (!selectedCatId && categories[0]) {
        setSelectedCatId(categories[0].id);
      }
    }
  }, [categories, isOpen]);

  const handleAddKeyword = (catId: string | number) => {
    const text = (newKeywordInputMap[catId] || '').trim().toLowerCase();
    if (!text) return;

    const existing = keywordsMap[catId] || [];
    if (existing.includes(text)) {
      setNewKeywordInputMap((prev) => ({ ...prev, [catId]: '' }));
      return;
    }

    setKeywordsMap((prev) => ({
      ...prev,
      [catId]: [...existing, text],
    }));

    setNewKeywordInputMap((prev) => ({ ...prev, [catId]: '' }));
  };

  const handleRemoveKeyword = (catId: string | number, keywordToRemove: string) => {
    setKeywordsMap((prev) => ({
      ...prev,
      [catId]: (prev[catId] || []).filter((kw) => kw !== keywordToRemove),
    }));
  };

  const handleSaveCategory = async (cat: Category) => {
    setSavingCatId(cat.id);
    setErrorMessage(null);
    setSuccessCatId(null);

    try {
      const currentKeywords = keywordsMap[cat.id] || [];
      await api.updateCategoryKeywords(cat.id, currentKeywords);
      setSuccessCatId(cat.id);
      setTimeout(() => setSuccessCatId(null), 2500);
      onCategoriesUpdated();
    } catch (err: any) {
      console.error('Error saving keywords:', err);
      setErrorMessage(err.message || 'Failed to update category keywords.');
    } finally {
      setSavingCatId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-lg"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[85vh] p-6 sm:p-8 rounded-3xl glass-card border border-white/15 shadow-2xl flex flex-col z-10 bg-[#0b0f19]/95"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    Category Keyword Manager
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Customize keywords for automated AI categorizer matching
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mt-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2.5 flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main scrollable list */}
            <div className="mt-6 flex-grow overflow-y-auto pr-1 space-y-4">
              {categories.map((cat) => {
                const keywords = keywordsMap[cat.id] || [];
                const inputVal = newKeywordInputMap[cat.id] || '';
                const isSaving = savingCatId === cat.id;
                const isSuccess = successCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-4 sm:p-5 rounded-2xl glass-card border border-white/10 space-y-3.5 hover:border-white/20 transition-all"
                  >
                    {/* Category Title Header & Save button */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/5">
                          {cat.emoji || '📁'}
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            <span>{cat.name}</span>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                              {keywords.length} keywords
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400">ID: {cat.id}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSaveCategory(cat)}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          isSuccess
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : isSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Keywords</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Keywords Tag List */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold group"
                        >
                          <Tag className="w-3 h-3 text-purple-400" />
                          <span>{kw}</span>
                          <button
                            onClick={() => handleRemoveKeyword(cat.id, kw)}
                            className="ml-1 p-0.5 text-purple-400 hover:text-white hover:bg-purple-500/30 rounded-md transition-colors"
                            title={`Remove "${kw}"`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {keywords.length === 0 && (
                        <span className="text-xs text-slate-500 italic">No keywords assigned</span>
                      )}
                    </div>

                    {/* Add Keyword Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="relative flex-grow max-w-sm">
                        <input
                          type="text"
                          value={inputVal}
                          onChange={(e) =>
                            setNewKeywordInputMap((prev) => ({
                              ...prev,
                              [cat.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword(cat.id);
                            }
                          }}
                          placeholder="Type keyword and press Enter..."
                          className="w-full pl-3.5 pr-8 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => handleAddKeyword(cat.id)}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between flex-shrink-0 text-xs">
              <span className="text-slate-400">
                Changes take effect immediately after saving each category.
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-white"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
