/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    try {
      this.setState({ hasError: false, error: null, errorInfo: null });
    } catch (e) {
      window.location.reload();
    }
  };

  private handleClearSaveAndReload = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-mono">
          <div className="max-w-lg w-full bg-slate-900 border border-red-500/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 text-xl">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Sanctum Runtime Encountered an Error</h2>
                <p className="text-xs text-slate-400">An unexpected exception was caught and contained safely.</p>
              </div>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-red-300 overflow-x-auto max-h-36">
                <p className="font-semibold">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-500 mt-2 font-mono whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Resume Game
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Reload Window
              </button>
              <button
                type="button"
                onClick={this.handleClearSaveAndReload}
                className="py-2.5 px-3 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/40 text-red-300 font-semibold text-xs transition-colors"
                title="Clears corrupted LocalStorage saves"
              >
                Reset Save
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
