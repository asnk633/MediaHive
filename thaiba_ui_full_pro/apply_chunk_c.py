import os
from pathlib import Path

# ============================================================
# C1 — Firestore Task Service
# ============================================================
(Path("src/services/taskService.ts")).parent.mkdir(parents=True, exist_ok=True)
(Path("src/services/taskService.ts")).write_text("""import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

import { db } from "../../firebase/auth";

export const tasksRef = collection(db, "tasks");

export function listenTasks(callback: Function) {
  const q = query(tasksRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(all);
  });
}

export async function createTask(data: any) {
  data.createdAt = Date.now();
  data.updatedAt = Date.now();
  return await addDoc(tasksRef, data);
}

export async function updateTask(id: string, data: any) {
  data.updatedAt = Date.now();
  const ref = doc(db, "tasks", id);
  await updateDoc(ref, data);
}

export async function deleteTask(id: string) {
  const ref = doc(db, "tasks", id);
  await deleteDoc(ref);
}
""")

# ============================================================
# C2 — Tasks Context Provider
# ============================================================
(Path("src/context/TaskContext.tsx")).write_text("""import React, { createContext, useContext, useEffect, useState } from "react";
import { listenTasks } from "../services/taskService";

export const TaskContext = createContext<any>(null);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenTasks((all: any[]) => {
      setTasks(all);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, loading }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
""")

# ============================================================
# C3 — Task List (animated)
# ============================================================
(Path("src/components/TaskList.tsx")).write_text("""import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import TaskCard from "./TaskCard";

export default function TaskList({ tasks }) {
  return (
    <AnimatePresence>
      {tasks.map((task: any) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          <TaskCard task={task} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
""")

# ============================================================
# C4 — Task Modal (Add/Edit)
# ============================================================
(Path("src/components/TaskModal.tsx")).write_text("""import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createTask, updateTask } from "../services/taskService";
import { useAuth } from "../context/AuthContext";

export default function TaskModal({ open, onClose, edit }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (edit) {
      setTitle(edit.title);
      setPriority(edit.priority);
      setDesc(edit.description || "");
    }
  }, [edit]);

  if (!open) return null;

  const save = async () => {
    const data = {
      title,
      priority,
      description: desc,
      status: "pending",
      createdBy: user.uid,
      assignedTo: [],
    };

    if (edit) {
      await updateTask(edit.id, data);
    } else {
      await createTask(data);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-[100]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 p-6 rounded-lg w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">{edit ? "Edit Task" : "New Task"}</h2>

        <input
          className="w-full p-2 bg-white/20 rounded mb-3"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full p-2 bg-white/20 rounded mb-3"
          rows={3}
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <label className="block mb-2 font-semibold">Priority</label>
        <select
          className="w-full p-2 bg-white/20 rounded mb-4"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option>low</option>
          <option>medium</option>
          <option>high</option>
          <option>urgent</option>
        </select>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-white/10 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 rounded"
            onClick={save}
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
""")

# ============================================================
# C5 — TaskCard
# ============================================================
(Path("src/components/TaskCard.tsx")).write_text("""import React, { useState } from "react";
import { motion } from "framer-motion";
import { deleteTask } from "../services/taskService";
import { useAuth } from "../context/AuthContext";
import TaskModal from "./TaskModal";

export default function TaskCard({ task }) {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);

  const canEdit =
    role?.role === "admin" ||
    task.createdBy === user?.uid;

  const canDelete = role?.role === "admin";

  const color = {
    low: "bg-green-800",
    medium: "bg-yellow-700",
    high: "bg-orange-700",
    urgent: "bg-red-700",
  }[task.priority];

  return (
    <>
      <div className="p-4 bg-slate-800 rounded-lg border border-white/10 mb-3">
        <div className="flex justify-between">
          <h3 className="font-semibold text-lg">{task.title}</h3>
          <span className={`px-2 py-1 text-xs rounded ${color}`}>
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="opacity-80 mt-1">{task.description}</p>
        )}

        <div className="flex gap-3 mt-3 text-sm">
          {canEdit && (
            <button
              className="px-3 py-1 rounded bg-white/10"
              onClick={() => setOpen(true)}
            >
              Edit
            </button>
          )}

          {canDelete && (
            <button
              className="px-3 py-1 rounded bg-red-600"
              onClick={() => deleteTask(task.id)}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <TaskModal open={open} edit={task} onClose={() => setOpen(false)} />
    </>
  );
}
""")

# ============================================================
# C6 — Search + Filters
# ============================================================
(Path("src/components/TaskFilters.tsx")).write_text("""import React from "react";

export default function TaskFilters({ search, setSearch, priority, setPriority }) {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      <input
        className="flex-1 p-2 bg-white/10 rounded"
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        className="p-2 bg-white/10 rounded"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="">All</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>
  );
}
""")

# ============================================================
# C7 — Tasks Page (Full UI)
# ============================================================
(Path("src/routes/Tasks.tsx")).write_text("""import React, { useState } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import TaskList from "../components/TaskList";
import TaskModal from "../components/TaskModal";
import TaskFilters from "../components/TaskFilters";

export default function Tasks() {
  const { tasks, loading } = useTasks();
  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");

  let filtered = tasks;

  if (search) {
    filtered = filtered.filter((t) =>
      t.title.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (priority) {
    filtered = filtered.filter((t) => t.priority === priority);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tasks</h2>

      <TaskFilters
        search={search}
        setSearch={setSearch}
        priority={priority}
        setPriority={setPriority}
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <TaskList tasks={filtered} />
      )}

      <TaskModal open={open} onClose={() => setOpen(false)} />

      <button
        className="fixed right-6 bottom-20 bg-indigo-600 px-4 py-2 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        + New Task
      </button>
    </div>
  );
}
""")

print("Chunk C files applied successfully!")
