import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  helpText,
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
      >
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose-400 font-medium">{error}</p>
      ) : helpText ? (
        <p className="text-xs text-slate-400">{helpText}</p>
      ) : null}
    </div>
  );
};