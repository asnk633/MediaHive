import React from "react";
import TopBar from "../components/TopBar";
import FAB from "../components/FAB";

export default function TasksPage() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Tasks</h2>
        <p className="mb-6">Sample tasks list (auto-generated placeholders).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-md shadow bg-white/5">Sample Task Card 1</div>
          <div className="p-4 rounded-md shadow bg-white/5">Sample Task Card 2</div>
        </div>
      </main>
      <FAB role="team" />
    </div>
  );
}