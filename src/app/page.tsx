"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { toast } from "sonner";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") || "/dashboard";

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn.social(
        {
          provider: "google",
          callbackURL: callbackURL,
        },
        {
          onError: (ctx: any) => {
            console.error("Google Login Client Error (onError):", ctx.error);
            toast.error(`Error: ${ctx?.error?.message || "Failed to log in with Google"}`);
            setIsLoading(false);
          },
        }
      );
    } catch (error) {
      console.error("Failed to login with Google (catch):", error);
      toast.error(error instanceof Error ? error.message : "Failed to login with Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background font-sans selection:bg-neutral-800 selection:text-white">
      {/* Left Column: Branding & Value Prop (Simplified) */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-neutral-950 p-8 text-neutral-200 lg:w-[45%] xl:w-[40%] min-h-[300px] lg:min-h-screen border-b border-neutral-900 lg:border-b-0 lg:border-r">
        {/* Decorative Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        
        {/* Gradient Mesh Blur */}
        <div className="absolute -top-40 -left-40 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[128px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[128px]" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-500 to-blue-600 shadow-lg shadow-emerald-500/10">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            VerifBuilder
          </span>
        </div>

        {/* Center Content / Hero Details */}
        <div className="relative z-10 my-auto py-12 lg:py-0">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-4xl xl:text-5xl leading-tight">
            Build Secure <br />
            <span className="bg-linear-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Verification Flows
            </span>
          </h1>

          <p className="mt-4 text-base text-neutral-400 max-w-md leading-relaxed">
            Configure dynamic, customizable verification logic, integrate multiple identity providers, and monitor your pipelines in real-time.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-neutral-600 border-t border-neutral-900/60 pt-6">
          <p>© 2026 VerifBuilder.</p>
        </div>
      </div>

      {/* Right Column: Google Login CTA */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile Logo Header */}
          <div className="flex items-center gap-3 lg:hidden mb-12">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-tr from-emerald-500 to-blue-600">
              <svg className="h-4.5 w-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">VerifBuilder</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Get Started
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Sign in with your Google workspace account to start building and managing your verification pipelines.
            </p>
          </div>

          <div className="mt-8">
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="w-full gap-3 rounded-xl h-12"
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" data-icon="inline-start">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.92-2.77 3.5-4.51 6.76-4.51z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.85 2.99c2.26-2.09 3.58-5.17 3.58-8.81z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.24 14.45c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27L1.39 6.92C.5 8.7 0 10.7 0 12.8s.5 4.1 1.39 5.88l3.85-2.99z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.85-2.99c-1.11.75-2.52 1.2-4.11 1.2-3.26 0-5.84-1.74-6.76-4.51L1.39 16.8c1.98 3.89 5.96 6.56 10.61 6.56z"
                  />
                </svg>
              )}
              <span>{isLoading ? "Connecting..." : "Continue with Google"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
