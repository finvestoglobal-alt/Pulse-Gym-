'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Application Error</h1>
          <p className="text-xs text-slate-500 mb-6 font-mono bg-slate-50 p-3 rounded-lg border border-slate-100 break-all text-left">
            {error.message || 'A critical error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium transition-colors shadow-xs shadow-purple-200 cursor-pointer"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
