'use client';

import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { nativeNavigate } from "@/lib/utils";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card rounded-[32px] p-12 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-foreground/[0.03] border border-foreground/5 flex items-center justify-center mx-auto">
          <span className="text-4xl font-bold text-primary/60">404</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Page not found
          </h1>
          <p className="text-sm text-foreground/70 font-medium">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <button
          onClick={() => nativeNavigate('/home', router)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl font-bold transition-all active:scale-95 text-sm"
        >
          <Home size={16} />
          Go Home
        </button>
      </div>
    </div>
  );
}
