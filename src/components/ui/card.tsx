import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  footer,
  className = '',
  padding = 'md',
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg shadow-sm transition-all ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-slate-800 gap-2">
          <div className="min-w-0">
            {title && <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
      {footer && (
        <div className="px-5 sm:px-6 py-3 bg-slate-950/40 border-t border-slate-800 rounded-b-lg text-xs sm:text-sm text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};