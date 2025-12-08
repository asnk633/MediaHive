
import React from "react";
import TopBar from "../components/TopBar";
import FAB from "../components/FAB";

export default function Home() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="p-6 max-w-6xl mx-auto">
        <div>Home Page</div>
      </main>
      <FAB />
    </div>
  );
}
