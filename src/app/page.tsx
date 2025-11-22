import React from "react";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <AppLayout>
      <section className="space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Home</h1>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="tg-card p-5">
            <h2 className="mb-1 text-lg font-medium">Welcome</h2>
            <p className="text-sm tg-muted">
              Jump into Tasks, check Calendar, or read quick stats in Reports.
            </p>
          </article>

          <article className="tg-card p-5">
            <h2 className="mb-1 text-lg font-medium">Quick tip</h2>
            <p className="text-sm tg-muted">
              Tap the green “+” to add a Task or Event from anywhere.
            </p>
          </article>

          <article className="tg-card p-5">
            <h2 className="mb-1 text-lg font-medium">Shortcuts</h2>
            <ul className="mt-2 space-y-2 text-sm">
              <li><Link className="text-[hsl(var(--primary))] hover:underline" href="/tasks">Go to Tasks →</Link></li>
              <li><Link className="text-[hsl(var(--primary))] hover:underline" href="/calendar">Open Calendar →</Link></li>
              <li><Link className="text-[hsl(var(--primary))] hover:underline" href="/files">Browse Files →</Link></li>
            </ul>
          </article>
        </div>
      </section>
    </AppLayout>
  );
}
