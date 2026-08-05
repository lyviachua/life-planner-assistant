import React from 'react';

export interface StatusBadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'teal';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
}) => {
  const variantClasses = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    teal: 'bg-teal-950/80 text-teal-300 border-teal-800/60',
    success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    danger: 'bg-rose-950/80 text-rose-400 border-rose-800/60',
    info: 'bg-sky-950/80 text-sky-400 border-sky-800/60',
    purple: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
};