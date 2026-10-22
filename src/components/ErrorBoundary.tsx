/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ErrorInfo, ReactNode } from 'react';

export interface ParsedErrorLocation {
  file: string;
  line: string;
  col: string;
  functionName?: string;
  fullLocation: string;
}

/**
 * Extracts the exact source file, line number, column, and function name from a JS Error stack trace.
 */
export function parseErrorLocation(error: Error | null | string): ParsedErrorLocation {
  if (!error) {
    return { file: 'Unknown File', line: '?', col: '?', fullLocation: 'Location unavailable' };
  }

  const stack = typeof error === 'string' ? error : (error.stack || error.message || '');
  const lines = stack.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('Error') || line.startsWith('TypeError') || line.startsWith('RangeError')) {
      continue;
    }

    // Pattern 1: "at functionName (http://.../file.ts?query:line:col)" or "at functionName (file.ts:line:col)"
    const fnWithParenMatch = line.match(/^at\s+(?:async\s+)?([^\s(]+)\s*\((?:https?:\/\/[^\/]+)?\/?(.*?):(\d+):(\d+)\)$/i);
    if (fnWithParenMatch) {
      const fnName = fnWithParenMatch[1];
      const rawPath = fnWithParenMatch[2].replace(/\?.*$/, '');
      const lineNum = fnWithParenMatch[3];
      const colNum = fnWithParenMatch[4];
      return {
        file: rawPath,
        line: lineNum,
        col: colNum,
        functionName: fnName,
        fullLocation: `${rawPath}:${lineNum}:${colNum} in ${fnName}()`,
      };
    }

    // Pattern 2: "at http://.../file.ts:line:col" or "at file.ts:line:col"
    const directAtMatch = line.match(/^at\s+(?:async\s+)?(?:https?:\/\/[^\/]+)?\/?(.*?):(\d+):(\d+)$/i);
    if (directAtMatch) {
      const rawPath = directAtMatch[1].replace(/\?.*$/, '');
      const lineNum = directAtMatch[2];
      const colNum = directAtMatch[3];
      return {
        file: rawPath,
        line: lineNum,
        col: colNum,
        fullLocation: `${rawPath}:${lineNum}:${colNum}`,
      };
    }

    // Pattern 3: Firefox style "functionName@http://.../file.ts:line:col"
    const ffMatch = line.match(/^([^@]*)@(?:https?:\/\/[^\/]+)?\/?(.*?):(\d+):(\d+)$/i);
    if (ffMatch) {
      const fnName = ffMatch[1] || undefined;
      const rawPath = ffMatch[2].replace(/\?.*$/, '');
      const lineNum = ffMatch[3];
      const colNum = ffMatch[4];
      return {
        file: rawPath,
        line: lineNum,
        col: colNum,
        functionName: fnName,
        fullLocation: `${rawPath}:${lineNum}:${colNum}${fnName ? ` in ${fnName}()` : ''}`,
      };
    }

    // Pattern 4: Fallback generic any file with :line:col
    const genericMatch = line.match(/([a-zA-Z0-9_\-./]+\.(?:tsx?|jsx?|js|ts))(?:\?[^:]*)?:(\d+):(\d+)/i);
    if (genericMatch) {
      const rawPath = genericMatch[1];
      const lineNum = genericMatch[2];
      const colNum = genericMatch[3];
      return {
        file: rawPath,
        line: lineNum,
        col: colNum,
        fullLocation: `${rawPath}:${lineNum}:${colNum}`,
      };
    }
  }

  return { file: 'Unknown File', line: '?', col: '?', fullLocation: 'Location not found in stack' };
}

/**
 * Formats a clean markdown diagnostic log that the player can copy-paste to report bugs.
 */
export function formatErrorLog(
  error: Error | null,
  context?: string,
  extraDetails?: Record<string, any>
): string {
  const loc = parseErrorLocation(error);
  const now = new Date().toISOString();

  let log = `### ⚠️ Sanctum Error Gump Diagnostic Report\n`;
  log += `- **Timestamp:** ${now}\n`;
  log += `- **Exact Location:** \`${loc.fullLocation}\`\n`;
  log += `- **Target File:** \`${loc.file}\`\n`;
  log += `- **Line Number:** **Line ${loc.line}**, Column ${loc.col}\n`;
  if (loc.functionName) {
    log += `- **Function:** \`${loc.functionName}()\`\n`;
  }
  if (context) {
    log += `- **Combat/Game Context:** ${context}\n`;
  }
  if (error) {
    log += `- **Exception:** \`${error.name}: ${error.message}\`\n`;
  }
  if (extraDetails && Object.keys(extraDetails).length > 0) {
    log += `- **Extra Context:** \n\`\`\`json\n${JSON.stringify(extraDetails, null, 2)}\n\`\`\`\n`;
  }

  log += `\n#### 📜 Stack Trace:\n\`\`\`\n`;
  log += error?.stack || error?.message || 'No stack trace available';
  log += `\n\`\`\`\n`;

  return log;
}

interface Props {
  children: ReactNode;
}

interface ActiveErrorState {
  error: Error;
  context?: string;
  timestamp: number;
}

interface State {
  hasFatalRenderError: boolean;
  fatalError: Error | null;
  fatalErrorInfo: ErrorInfo | null;
  activeModalError: ActiveErrorState | null;
  isCopied: boolean;
  saveBackupCopied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  private copyTimeout: any = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasFatalRenderError: false,
      fatalError: null,
      fatalErrorInfo: null,
      activeModalError: null,
      isCopied: false,
      saveBackupCopied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasFatalRenderError: true, fatalError: error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Sanctum ErrorBoundary] Fatal render exception caught:', error, errorInfo);
    this.setState({ fatalError: error, fatalErrorInfo: errorInfo });
  }

  public componentDidMount() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleWindowError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
      window.addEventListener('show-error-gump', this.handleCustomErrorGump as EventListener);
    }
  }

  public componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleWindowError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
      window.removeEventListener('show-error-gump', this.handleCustomErrorGump as EventListener);
    }
    if (this.copyTimeout) clearTimeout(this.copyTimeout);
  }

  private handleWindowError = (event: ErrorEvent) => {
    console.error('[Sanctum Error Gump] Global window.onerror captured:', event.error || event.message);
    const err = event.error instanceof Error ? event.error : new Error(event.message || 'Window Script Exception');
    this.setState({
      activeModalError: {
        error: err,
        context: 'Global Window Event Exception',
        timestamp: Date.now(),
      },
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('[Sanctum Error Gump] Unhandled Promise Rejection captured:', event.reason);
    const err =
      event.reason instanceof Error
        ? event.reason
        : new Error(typeof event.reason === 'string' ? event.reason : 'Unhandled Promise Rejection');
    this.setState({
      activeModalError: {
        error: err,
        context: 'Unhandled Async Promise Exception',
        timestamp: Date.now(),
      },
    });
  };

  private handleCustomErrorGump = (event: CustomEvent<{ error: Error; context?: string }>) => {
    if (event.detail && event.detail.error) {
      this.setState({
        activeModalError: {
          error: event.detail.error,
          context: event.detail.context || 'Contained Combat / Runtime Action',
          timestamp: Date.now(),
        },
      });
    }
  };

  private handleCopyErrorLog = (error: Error | null, context?: string) => {
    const formatted = formatErrorLog(error, context);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(formatted).then(() => {
        this.setState({ isCopied: true });
        if (this.copyTimeout) clearTimeout(this.copyTimeout);
        this.copyTimeout = setTimeout(() => {
          this.setState({ isCopied: false });
        }, 3000);
      });
    }
  };

  private handleCopySaveBackup = () => {
    try {
      const saveStr = localStorage.getItem('shadow_over_oakhaven_save_v1') || localStorage.getItem('abyss_rogue_save_v1');
      if (saveStr && navigator.clipboard) {
        navigator.clipboard.writeText(saveStr).then(() => {
          this.setState({ saveBackupCopied: true });
          setTimeout(() => this.setState({ saveBackupCopied: false }), 3000);
        });
      }
    } catch (e) {
      console.warn('Could not copy save backup:', e);
    }
  };

  private handleDismissModal = () => {
    this.setState({ activeModalError: null, isCopied: false });
  };

  private handleResetFatal = () => {
    try {
      this.setState({
        hasFatalRenderError: false,
        fatalError: null,
        fatalErrorInfo: null,
        activeModalError: null,
      });
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

  private renderErrorGumpCard(
    error: Error | null,
    context?: string,
    isFatal: boolean = false
  ) {
    const loc = parseErrorLocation(error);

    return (
      <div className="max-w-2xl w-full bg-slate-900/95 border-2 border-red-500/60 rounded-xl p-6 shadow-2xl space-y-4 backdrop-blur-md text-slate-100 font-mono select-text">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-red-500/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 text-2xl shrink-0">
              ⚠️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 tracking-wide uppercase">
                  Sanctum Error Gump
                </h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/60">
                  {isFatal ? 'Fatal Render Crash' : 'Contained Runtime Exception'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                An unexpected exception was intercepted. You can inspect the exact line and copy the log below.
              </p>
            </div>
          </div>
          {!isFatal && (
            <button
              type="button"
              onClick={this.handleDismissModal}
              className="text-slate-400 hover:text-slate-200 text-xl font-bold p-1 rounded hover:bg-slate-800 transition-colors"
              title="Close Gump"
            >
              ✕
            </button>
          )}
        </div>

        {/* Prominent Exact Line Number & Source File Badge */}
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>📍</span>
              <span>Exact Exception Location</span>
            </div>
            <div className="text-sm font-bold text-amber-200 mt-0.5 flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/60 text-amber-100">
                Line {loc.line}
              </span>
              <span className="text-slate-400">in</span>
              <span className="text-amber-300 underline underline-offset-2">{loc.file}</span>
              {loc.functionName && (
                <span className="text-slate-400 text-xs font-normal">
                  (Function: <code className="text-amber-200">{loc.functionName}()</code>)
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-slate-400">Column: {loc.col}</span>
          </div>
        </div>

        {/* Context info if provided */}
        {context && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
            <span className="text-slate-400 font-semibold shrink-0">Game Context:</span>
            <span className="text-sky-300 truncate">{context}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-950/30 border border-red-900/40 rounded-lg p-3 text-xs text-red-200">
            <p className="font-bold text-red-300">
              {error.name}: {error.message}
            </p>
          </div>
        )}

        {/* Full Stack Trace Terminal with Line Numbers */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Detailed Stack Trace:</span>
            <span className="text-[10px] text-slate-500">Scroll to view full trace</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 overflow-x-auto max-h-44 font-mono leading-relaxed">
            <pre className="whitespace-pre-wrap">
              {error?.stack || 'No stack trace available.'}
            </pre>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800/80">
          {/* One-Click Copy Log Button */}
          <button
            type="button"
            onClick={() => this.handleCopyErrorLog(error, context)}
            className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              this.state.isCopied
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/30 active:scale-95'
            }`}
          >
            <span>{this.state.isCopied ? '✓' : '📋'}</span>
            <span>{this.state.isCopied ? 'Copied to Clipboard!' : 'Copy Error Log'}</span>
          </button>

          {/* Resume Game Button */}
          <button
            type="button"
            onClick={isFatal ? this.handleResetFatal : this.handleDismissModal}
            className="w-full sm:w-auto py-2.5 px-4 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/50 text-emerald-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            title="Dismiss error dialog and continue playing"
          >
            <span>🛡️</span>
            <span>Resume Game</span>
          </button>

          {/* Reload Window Button */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            🔄 Reload
          </button>

          {/* Backup Save Button */}
          <button
            type="button"
            onClick={this.handleCopySaveBackup}
            className="w-full sm:w-auto py-2.5 px-3 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800/40 text-sky-300 font-semibold text-xs transition-colors"
            title="Copies raw local save to clipboard"
          >
            {this.state.saveBackupCopied ? '✓ Backup Copied' : '💾 Backup Save'}
          </button>

          {/* Reset Save Button */}
          {isFatal && (
            <button
              type="button"
              onClick={this.handleClearSaveAndReload}
              className="w-full sm:w-auto py-2.5 px-3 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/40 text-red-300 font-semibold text-xs transition-colors"
              title="Clears corrupted LocalStorage saves"
            >
              Reset Save
            </button>
          )}
        </div>
      </div>
    );
  }

  public render() {
    // 1. Fatal render crash fallback
    if (this.state.hasFatalRenderError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-mono">
          {this.renderErrorGumpCard(this.state.fatalError, 'React Component Render Tree Crash', true)}
        </div>
      );
    }

    // 2. Normal rendering with optional non-fatal runtime Error Gump Modal overlay
    return (
      <>
        {this.props.children}

        {this.state.activeModalError && (
          <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            {this.renderErrorGumpCard(
              this.state.activeModalError.error,
              this.state.activeModalError.context,
              false
            )}
          </div>
        )}
      </>
    );
  }
}

export default ErrorBoundary;
