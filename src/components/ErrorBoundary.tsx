import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 shadow-xl text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              An unexpected application error occurred. You can return to the dashboard to continue working.
            </p>
            {this.state.error && (
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-left text-xs text-red-600 dark:text-red-400 overflow-x-auto mb-6 font-mono">
                {this.state.error.message}
              </div>
            )}
            <Button
              onClick={this.handleReset}
              variant="primary"
              icon={<RefreshCw size={16} />}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}