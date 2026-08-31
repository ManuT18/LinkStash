import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Clock, CheckCircle2, FolderTree, TrendingUp } from 'lucide-react';
import { Stats } from '../types';

export interface StatsOverviewProps {
  stats: Stats | null;
  categoryCount?: number;
  loading?: boolean;
  onCardClick?: (filterType: string) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  categoryCount,
  loading = false,
  onCardClick,
}) => {
  const total = stats?.totalLinks ?? stats?.total ?? 0;
  const pending = stats?.unreadCount ?? stats?.pending ?? 0;
  const reviewed = stats?.readCount ?? stats?.reviewed ?? 0;
  const categories = categoryCount ?? (stats?.byCategory ? stats.byCategory.length : 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl glass-card border border-white/10 animate-pulse flex items-center justify-between"
          >
            <div className="space-y-3 flex-1 pr-4">
              <div className="h-3 w-20 bg-slate-700/60 rounded"></div>
              <div className="h-7 w-16 bg-slate-700/80 rounded"></div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      id: 'total',
      title: 'Total Links',
      value: total,
      icon: Bookmark,
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-400',
      glowClass: 'glow-blue',
    },
    {
      id: 'pending',
      title: 'Pending Links',
      value: pending,
      icon: Clock,
      color: 'amber',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      textColor: 'text-amber-400',
      glowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    },
    {
      id: 'reviewed',
      title: 'Reviewed Links',
      value: reviewed,
      icon: CheckCircle2,
      color: 'emerald',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
      glowClass: 'glow-emerald',
    },
    {
      id: 'categories',
      title: 'Active Categories',
      value: categories,
      icon: FolderTree,
      color: 'purple',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      textColor: 'text-purple-400',
      glowClass: 'glow-purple',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {statCards.map((card) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.id}
            variants={cardVariants}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => onCardClick && onCardClick(card.id)}
            className={`p-5 rounded-2xl glass-card glass-card-hover border border-white/10 flex items-center justify-between transition-all duration-300 ${
              onCardClick ? 'cursor-pointer' : ''
            }`}
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-white tracking-tight">
                  {card.value.toLocaleString()}
                </h3>
              </div>
            </div>

            <div
              className={`w-12 h-12 rounded-xl ${card.bgColor} border ${card.borderColor} ${card.textColor} flex items-center justify-center shrink-0 ${card.glowClass} transition-transform duration-300`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
