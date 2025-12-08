import os, json, shutil
from pathlib import Path

root = Path(".")

# ============================================================
# DIRECTORY STRUCTURE
# ============================================================
folders = [
    "src",
    "src/app",
    "src/components",
    "src/context",
    "src/hooks",
    "src/routes",
    "src/styles",
    "firebase"
]

for f in folders:
    Path(f).mkdir(parents=True, exist_ok=True)

# ============================================================
# PACKAGE.JSON
# ============================================================
(Path("package.json")).write_text("""
{
  "name": "thaiba-ui-full-pro",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "firebase": "^10.7.0",
    "classnames": "^2.5.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
""")

# ============================================================
# VITE CONFIG
# ============================================================
(Path("vite.config.js")).write_text("""
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()]
})
""")

# ============================================================
# TAILWIND CONFIG
# ============================================================
(Path("tailwind.config.js")).write_text("""
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        tg_dark1: "#0f172a",
        tg_dark2: "#020617"
      }
    },
  },
  plugins: [],
}
""")

# ============================================================
# POSTCSS CONFIG
# ============================================================
(Path("postcss.config.js")).write_text("""
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
""")

# ============================================================
# INDEX.HTML
# ============================================================
(Path("index.html")).write_text("""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Thaiba UI PRO</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body class="bg-tg_dark1 text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""")

# ============================================================
# FIREBASE (Mock Config)
# ============================================================
(Path("firebase/firebaseConfig.ts")).write_text("""
export const firebaseConfig = {
  apiKey: "FAKE-API-KEY",
  authDomain: "fake.firebaseapp.com",
  projectId: "fake-project",
  storageBucket: "fake.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:fakekey"
};
""")

(Path("firebase/auth.ts")).write_text("""
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
""")

# ============================================================
# MAIN.tsx
# ============================================================
(Path("src/main.tsx")).write_text("""
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './routes/App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
""")

# ============================================================
# ROUTER: App.tsx
# ============================================================
(Path("src/routes/App.tsx")).write_text("""
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import LoginPage from "../routes/LoginPage";

import Home from "../routes/Home";
import Tasks from "../routes/Tasks";
import Calendar from "../routes/Calendar";
import Events from "../routes/Events";
import Reports from "../routes/Reports";
import Profile from "../routes/Profile";
import Settings from "../routes/Settings";

import Protected from "./Protected";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<Protected />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/events" element={<Events />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
""")

# ============================================================
# Protected Route
# ============================================================
(Path("src/routes/Protected.tsx")).write_text("""
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Protected() {
  const { user, loading } = useAuth();

  if (loading) return <div className='p-6'>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
""")

# ============================================================
# AUTH CONTEXT
# ============================================================
(Path("src/context/AuthContext.tsx")).write_text("""
import React, { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface UserRole {
  role: "admin" | "team" | "guest";
  tags: string[];
}

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        setRole(snap.data()?.role || { role: "guest", tags: [] });
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
""")

# ============================================================
# THEME CONTEXT
# ============================================================
(Path("src/context/ThemeContext.tsx")).write_text("""
import React, { createContext, useContext, useEffect, useState } from "react";

export const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
""")

# ============================================================
# LAYOUT COMPONENT
# ============================================================
(Path("src/components/Layout.tsx")).write_text("""
import React from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import FAB from "./FAB";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col pb-6">
      <TopBar />
      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
      <FAB />
    </div>
  );
}
""")

# ============================================================
# TOPBAR
# ============================================================
(Path("src/components/TopBar.tsx")).write_text("""
import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function TopBar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur w-full px-4 py-4 shadow">
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-lg">Thaiba Garden Media Manager</h1>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="px-3 py-1 bg-white/10 rounded"
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
""")

# ============================================================
# BOTTOM NAV
# ============================================================
(Path("src/components/BottomNav.tsx")).write_text("""
import React from "react";
import { Link, useLocation } from "react-router-dom";
import classNames from "classnames";

export default function BottomNav() {
  const loc = useLocation();

  const items = [
    { name: "Home", path: "/" },
    { name: "Tasks", path: "/tasks" },
    { name: "Events", path: "/events" },
    { name: "Calendar", path: "/calendar" },
    { name: "Profile", path: "/profile" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 text-xs h-[26px] flex items-center justify-around">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={classNames(
            "px-2",
            loc.pathname === item.path && "text-yellow-400 font-bold"
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
""")

# ============================================================
# FAB
# ============================================================
(Path("src/components/FAB.tsx")).write_text("""
import React from "react";

export default function FAB() {
  return (
    <button className="fixed left-1/2 -translate-x-1/2 bottom-[40px] w-14 h-14 rounded-full bg-indigo-600 text-white text-3xl shadow-xl">
      +
    </button>
  );
}
""")

# ============================================================
# LOGIN PAGE
# ============================================================
(Path("src/routes/LoginPage.tsx")).write_text("""
import React, { useState } from "react";
import { auth } from "../../firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/10 p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input
          className="w-full mb-2 p-2 rounded bg-white/20"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full mb-4 p-2 rounded bg-white/20"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full py-2 bg-indigo-600 rounded" onClick={login}>
          Login
        </button>
      </div>
    </div>
  );
}
""")

# ============================================================
# SIMPLE ROUTE FILES
# ============================================================
pages = {
    "Home.tsx": "Welcome to the dashboard!",
    "Tasks.tsx": "Your tasks will appear here.",
    "Calendar.tsx": "Your calendar goes here.",
    "Events.tsx": "All events will appear here.",
    "Reports.tsx": "View reports and analytics.",
    "Profile.tsx": "User profile settings.",
    "Settings.tsx": "System settings."
}

for file, text in pages.items():
    (Path(f"src/routes/{file}")).write_text(f"""
import React from "react";
export default function {file.replace(".tsx","")}() {{
  return (
    <div className="text-base">
      <h2 className="text-xl font-bold mb-3">{file.replace(".tsx","")}</h2>
      <p>{text}</p>
    </div>
  );
}}
""")

# ============================================================
# GLOBAL STYLES
# ============================================================
(Path("src/styles/globals.css")).write_text("""
@tailwind base;
@tailwind components;
@tailwind utilities;

html.dark {
  background: #020617;
  color: #e6eef8;
}

html.light {
  background: #ffffff;
  color: #111827;
}
""")

# ============================================================
# README
# ============================================================
(Path("README.md")).write_text("""
# Thaiba UI Full PRO — Core Project

This project was autogenerated with Firebase, Tailwind, Vite, React, Router v6, and a full layout system.

Next chunks will add:
- Advanced Tasks UI
- Live Notifications
- Framer Motion Animations
- Events + Calendar upgrades
- Full responsive UI
- Role-based sections
""")

print("Chunk A generated successfully!")
