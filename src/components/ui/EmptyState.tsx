import React from 'react';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-slate-950/40 border border-dashed border-slate-800 rounded-lg ${className}`}>
      {icon && (
        <div className="p-3 bg-teal-950/60 text-teal-400 border border-teal-800/50 rounded-lg mb-4">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-slate-100">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm mt-1.5 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};