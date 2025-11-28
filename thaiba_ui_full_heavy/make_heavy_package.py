import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json

root = Path(".")

# Directory structure
dirs = [
    "src/components",
    "src/pages",
    "src/app",
    "assets/screenshots",
    "data"
]

for d in dirs:
    Path(d).mkdir(parents=True, exist_ok=True)

# ==========================
# Write README
# ==========================
(Path("README.txt")).write_text("""
Thaiba UI Heavy Full Package

Generated locally by make_heavy_package.py.

Includes:
- Full React UI skeleton
- Components: TopBar, FAB, BottomNav, Card
- Pages: Tasks, Calendar, Events, Reports, Profile, Settings, Home
- Tailwind-ready globals.css
- 21 screenshots (7 screens x 3 color themes)
- sample_tasks.json (mock data)
""".strip(), encoding='utf-8')

# ==========================
# Components
# ==========================
(Path("src/components/TopBar.tsx")).write_text("""
import React from "react";

export default function TopBar() {
  return (
    <header className="w-full py-3 px-4 shadow-sm bg-gradient-to-r from-indigo-700 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-lg font-semibold">Thaiba Garden Media Manager</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">Backend: healthy</span>
          <button className="px-3 py-1 rounded-md bg-white/10">Profile</button>
        </div>
      </div>
    </header>
  );
}
""", encoding='utf-8')

(Path("src/components/FAB.tsx")).write_text("""
import React from "react";
export default function FAB() {
  return (
    <button
      aria-label="Main FAB"
      style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(var(--bottom-nav-height) + 2px)" }}
      className="fab w-16 h-16 rounded-full shadow-lg bg-indigo-600 text-white text-3xl flex items-center justify-center"
    >
      +
    </button>
  );
}
""", encoding='utf-8')

(Path("src/components/BottomNav.tsx")).write_text("""
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
""", encoding='utf-8')

(Path("src/components/Card.tsx")).write_text("""
import React from "react";

export default function Card({ title, children }) {
  return (
    <div className="p-4 mb-4 rounded-lg shadow bg-white/10 border border-white/10">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}
""", encoding='utf-8')

# ==========================
# Pages
# ==========================
pages = {
    "Home.tsx": "<div>Home Page</div>",
    "TasksPage.tsx": "<div>Tasks Page</div>",
    "Calendar.tsx": "<div>Calendar Page</div>",
    "Events.tsx": "<div>Events Page</div>",
    "Reports.tsx": "<div>Reports Page</div>",
    "Profile.tsx": "<div>Profile Page</div>",
    "Settings.tsx": "<div>Settings Page</div>",
}

for name, content in pages.items():
    (Path(f"src/pages/{name}")).write_text(f"""
import React from "react";
import TopBar from "../components/TopBar";
import FAB from "../components/FAB";

export default function {name.replace(".tsx","")}() {{
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="p-6 max-w-6xl mx-auto">
        {content}
      </main>
      <FAB />
    </div>
  );
}}
""", encoding='utf-8')

# ==========================
# globals.css
# ==========================
(Path("src/app/globals.css")).write_text("""
:root {
  --bottom-nav-height: 22px;
}
body {
  margin: 0;
  background: linear-gradient(180deg, #0f172a, #020617);
  color: #e6eef8;
  font-family: Inter, system-ui, Arial;
}
.fab {
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
}
""", encoding='utf-8')

# ==========================
# Sample data
# ==========================
(Path("data/sample_tasks.json")).write_text(json.dumps({
    "tasks": [
        {"id": 1, "title": "Shoot campus B-roll", "priority": "high"},
        {"id": 2, "title": "Edit festival video", "priority": "urgent"},
        {"id": 3, "title": "Schedule drone shoot", "priority": "medium"}
    ]
}, indent=2), encoding='utf-8')

# ==========================
# Screenshots (21 high-quality)
# ==========================
screens = ["Home", "Tasks", "Calendar", "Events", "Reports", "Profile", "Settings"]
themes = ["default", "blue", "rose"]

font = None
try:
    font = ImageFont.truetype("arial.ttf", 28)
except:
    font = ImageFont.load_default()

for s in screens:
    for t in themes:
        img = Image.new("RGB", (700, 1400), (20,20,40))
        d = ImageDraw.Draw(img)

        # theme tint
        if t == "blue":
            overlay = Image.new("RGBA", img.size, (30,80,200,80))
            img.paste(overlay, (0,0), overlay)
        elif t == "rose":
            overlay = Image.new("RGBA", img.size, (200,50,120,90))
            img.paste(overlay, (0,0), overlay)

        d.text((40, 40), f"{s} - {t}", font=font, fill=(255,255,255))

        # mock UI
        for i in range(5):
            y = 160 + i*220
            d.rounded_rectangle([40,y,660,y+180], radius=18, outline=(220,220,220), width=3)
            d.text((60, y+20), f"Card {i+1} on {s}", font=font, fill=(230,230,230))

        fname = f"assets/screenshots/{s.lower()}_{t}.png"
        img.save(fname, optimize=True)

print("Heavy full package generated successfully!")