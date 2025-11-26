'use client';

import { TrendingUp, TrendingDown, Minus, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PollutionTrend } from '@/lib/services/pollution-api';

interface ComparisonWidgetProps {
  trend: PollutionTrend;
  label: string;
  icon?: React.ReactNode;
}

export default function ComparisonWidget({ trend, label, icon }: ComparisonWidgetProps) {
  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend.direction === 'up' ? '#ef4444' : trend.direction === 'down' ? '#10b981' : '#6b7280';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-foreground/5 rounded-xl p-4 border border-foreground/10"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon || <Calendar className="w-4 h-4 text-foreground/70" />}
          <span className="text-sm font-medium text-foreground/70">{label}</span>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${trendColor}20`,
            color: trendColor,
          }}
        >
          <TrendIcon className="w-3 h-3" />
          {trend.direction === 'up' ? 'Worse' : trend.direction === 'down' ? 'Better' : 'Stable'}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-foreground/60 mb-1">Current</p>
            <p className="text-2xl font-bold">{trend.current.toFixed(0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground/60 mb-1">Previous</p>
            <p className="text-xl font-semibold text-foreground/70">{trend.previous.toFixed(0)}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-foreground/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/60">Change</span>
            <span
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: trendColor }}
            >
              <TrendIcon className="w-3 h-3" />
              {trend.change.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

