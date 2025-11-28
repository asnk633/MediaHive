import os
from pathlib import Path

# ============================================================
# 1. firebase/roles.ts
# ============================================================
(Path("firebase/roles.ts")).write_text("""import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./auth";

export type PrimaryRole = "admin" | "team" | "guest";

export interface UserRole {
  role: PrimaryRole;
  tags: string[];
}

export async function getUserRole(uid: string): Promise<UserRole> {
  const ref = doc(db, "roles", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data() as UserRole;

  // default role
  return { role: "guest", tags: [] };
}

export async function setUserRole(uid: string, role: UserRole) {
  const ref = doc(db, "roles", uid);
  await setDoc(ref, role, { merge: true });
}
""")

# ============================================================
# 2. src/context/AuthContext.tsx
# ============================================================
(Path("src/context/AuthContext.tsx")).write_text("""import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { getUserRole } from "../../firebase/roles";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<any>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setVerified(u.emailVerified);

        const roles = await getUserRole(u.uid);
        setRole(roles);
      } else {
        setUser(null);
        setRole(null);
        setVerified(false);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const requestVerification = () => {
    if (auth.currentUser) {
      sendEmailVerification(auth.currentUser);
      alert("Verification email sent.");
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      verified,
      loading,
      requestVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
""")

# ============================================================
# 3. src/routes/LoginPage.tsx
# ============================================================
(Path("src/routes/LoginPage.tsx")).write_text("""import React, { useState } from "react";
import { auth } from "../../firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const login = async () => {
    try {
      setErr("");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/10 p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Login</h2>

        {err && <p className="text-red-400 mb-3">{err}</p>}

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

        <div className="flex justify-between mt-3 text-sm opacity-80">
          <Link to="/register">Register</Link>
          <Link to="/forgot">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
}
""")

# ============================================================
# 4. src/routes/RegisterPage.tsx
# ============================================================
(Path("src/routes/RegisterPage.tsx")).write_text("""import React, { useState } from "react";
import { auth } from "../../firebase/auth";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setUserRole } from "../../firebase/roles";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    const u = await createUserWithEmailAndPassword(auth, email, password);
    await setUserRole(u.user.uid, { role: "guest", tags: [] });
    alert("Registered! Please verify your email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/10 p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Register</h2>

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

        <button className="w-full py-2 bg-indigo-600 rounded" onClick={register}>
          Register
        </button>
      </div>
    </div>
  );
}
""")

# ============================================================
# 5. src/routes/ForgotPassword.tsx
# ============================================================
(Path("src/routes/ForgotPassword.tsx")).write_text("""import React, { useState } from "react";
import { auth } from "../../firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const reset = async () => {
    await sendPasswordResetEmail(auth, email);
    alert("Reset email sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white/10 p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
        <input
          className="w-full mb-3 p-2 rounded bg-white/20"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="w-full py-2 bg-indigo-600 rounded" onClick={reset}>
          Send Reset Email
        </button>
      </div>
    </div>
  );
}
""")

# ============================================================
# 6. src/routes/VerifyEmail.tsx
# ============================================================
(Path("src/routes/VerifyEmail.tsx")).write_text("""import React from "react";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const { requestVerification } = useAuth();

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-3">Email not verified</h2>
      <p className="mb-4">Please verify your email to continue.</p>

      <button
        onClick={requestVerification}
        className="px-6 py-2 bg-indigo-600 rounded text-white"
      >
        Send verification email
      </button>
    </div>
  );
}
""")

# ============================================================
# 7. src/routes/RoleManager.tsx
# ============================================================
(Path("src/routes/RoleManager.tsx")).write_text("""import React, { useState } from "react";
import { setUserRole } from "../../firebase/roles";
import { useAuth } from "../context/AuthContext";

export default function RoleManager() {
  const { role } = useAuth();

  if (role?.role !== "admin") {
    return <div className="p-6">Access denied — admin only.</div>;
  }

  const [uid, setUid] = useState("");
  const [primary, setPrimary] = useState("team");
  const [tags, setTags] = useState<string[]>([]);

  const toggleTag = (t: string) => {
    setTags((old) =>
      old.includes(t) ? old.filter((x) => x !== t) : [...old, t]
    );
  };

  const update = async () => {
    await setUserRole(uid, { role: primary, tags });
    alert("Updated");
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Role Manager</h2>

      <input
        className="w-full p-2 bg-white/20 mb-3"
        placeholder="User UID"
        onChange={(e) => setUid(e.target.value)}
      />

      <label className="block mb-2 font-semibold">Primary Role</label>
      <select
        className="w-full p-2 mb-3 bg-white/20"
        onChange={(e) => setPrimary(e.target.value)}
      >
        <option value="admin">admin</option>
        <option value="team">team</option>
        <option value="guest">guest</option>
      </select>

      <label className="block mb-2 font-semibold">Tags</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {["media","academics","it","principal","teacher","coordinator","volunteer","student"].map(t => (
          <button
            key={t}
            onClick={() => toggleTag(t)}
            className={
              "px-2 py-1 rounded " +
              (tags.includes(t) ? "bg-indigo-600" : "bg-white/20")
            }
          >
            {t}
          </button>
        ))}
      </div>

      <button
        className="px-4 py-2 bg-green-600 rounded"
        onClick={update}
      >
        Update Role
      </button>
    </div>
  );
}
""")

# ============================================================
# 9. src/routes/AdminOnly.tsx
# ============================================================
(Path("src/routes/AdminOnly.tsx")).write_text("""import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminOnly({ children }) {
  const { role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (role?.role !== "admin") return <Navigate to="/" />;
  return children;
}
""")

print("Chunk B files applied successfully!")
