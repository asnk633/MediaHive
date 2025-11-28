import React from "react";
import TopBar from "../components/TopBar";
import FAB from "../components/FAB";

export default function Calendar() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Calendar</h2>
        <p>Monthly and weekly views placeholder.</p>
      </main>
      <FAB role="team" />
    </div>
  );
}