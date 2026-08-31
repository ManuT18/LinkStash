import React from 'react';
import { Bookmark, Plus, Server, Menu, Sparkles } from 'lucide-react';

export interface NavbarProps {
  apiConnected: boolean | null;
  onAddLink?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  apiConnected,
  onAddLink,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0b0f19]/70 border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-lg">
      {/* Left: Mobile Toggle & Branding */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xl tracking-tight text-gradient-neon">LinkStash</h1>
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Smart Link Management & AI Vault
            </p>
          </div>
        </div>
      </div>

      {/* Right: API Status Badge & Add Link Action */}
      <div className="flex items-center gap-3">
        {/* Backend API Status Badge */}
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border backdrop-blur-md transition-all duration-300 ${
            apiConnected === true
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : apiConnected === false
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
              : 'bg-slate-800/80 text-slate-400 border-slate-700'
          }`}
        >
          {apiConnected === true ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">API</span> Online
            </>
          ) : apiConnected === false ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="hidden sm:inline">API</span> Offline
            </>
          ) : (
            <>
              <Server className="w-3.5 h-3.5 animate-spin text-slate-400" />
              <span>Connecting...</span>
            </>
          )}
        </div>

        {/* Add Link Quick Action Button */}
        {onAddLink && (
          <button
            onClick={onAddLink}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 active:scale-95 cursor-pointer border border-white/10"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span className="font-semibold hidden sm:inline">Add Link</span>
          </button>
        )}
      </div>
    </header>
  );
};
