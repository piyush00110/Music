'use client';

import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <svg className="w-16 h-16 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="text-zinc-400 mb-1">Something went wrong</p>
          <p className="text-xs text-zinc-600">Please refresh the page and try again</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="mt-4 px-6 py-2 bg-[#D4AF37] text-black rounded-full text-sm font-semibold hover:bg-[#E0BF4A] transition-all"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
