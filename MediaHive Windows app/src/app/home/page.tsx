import { Home } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto w-full h-full">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight m-0">Home</h1>
        <p className="text-zinc-400 m-0 text-base">
          MediaHive Home View.
        </p>
      </header>
      <div className="flex-1 rounded-xl border border-dashed border-white/10 bg-zinc-900/20 flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <Home className="w-12 h-12 text-zinc-600" />
        <p className="text-zinc-500">Welcome to MediaHive.</p>
      </div>
    </div>
  );
}
