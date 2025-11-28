
import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const loc = useLocation();

  const linkClass = (path: string) =>
    loc.pathname === path
      ? "text-yellow-300 font-bold"
      : "text-gray-300";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-[22px] bg-slate-900 text-xs flex items-center justify-around"
    >
      <Link to="/" className={linkClass("/")}>Home</Link>
      <Link to="/tasks" className={linkClass("/tasks")}>Tasks</Link>
      <Link to="/events" className={linkClass("/events")}>Events</Link>
      <Link to="/calendar" className={linkClass("/calendar")}>Calendar</Link>
      <Link to="/profile" className={linkClass("/profile")}>Profile</Link>
    </nav>
  );
}
