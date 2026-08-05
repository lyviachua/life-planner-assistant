import React from 'react';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-10 h-10 border-4 border-slate-800 border-t-teal-500 rounded-full animate-spin"></div>
      <p className="text-xs sm:text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
};