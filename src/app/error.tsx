"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 max-w-sm text-center">
        <h2 className="text-xl font-black text-slate-800 mb-2">Ralat 1101</h2>
        <p className="text-sm text-slate-500 mb-6">Maaf, maklumat gagal dimuatkan. Log ralat telah dihantar kepada pentadbir.</p>
        <button
          onClick={() => reset()}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full"
        >
          Cuba Semula (Retry)
        </button>
      </div>
    </div>
  );
}

