"use client";

import Image from "next/image";
import { signIn } from "@/lib/auth";
import { useState } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      console.error("Sign in failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex w-full max-w-md flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="text-xl font-bold tracking-tight text-black dark:text-zinc-50 flex items-center gap-2">
            <span className="bg-primary text-primary-foreground px-2 py-1 rounded">VB</span>
            Verification Builder
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to manage and verify program participant data
          </p>
        </div>

        <div className="w-full">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full flex h-12 items-center justify-center gap-3 rounded-xl border border-solid border-zinc-200 dark:border-zinc-800 px-5 text-sm font-medium transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 cursor-pointer text-zinc-700 dark:text-zinc-300"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin"></span>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Sign in with Google
          </button>
        </div>

        <div className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Make sure your Google account has permissions to access Verification Builder.
        </div>
      </main>
    </div>
  );
}

