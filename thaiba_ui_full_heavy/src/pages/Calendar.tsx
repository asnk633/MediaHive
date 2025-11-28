
import React from "react";
import TopBar from "../components/TopBar";
import FAB from "../components/FAB";

export default function Calendar() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="p-6 max-w-6xl mx-auto">
        <div>Calendar Page</div>
      </main>
      <FAB />
    </div>
  );
}
