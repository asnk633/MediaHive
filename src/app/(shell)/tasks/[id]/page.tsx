"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useClientData } from "@/app/(shell)/ClientDataContext";
import { useToast } from "@/components/ToastProvider";
// import any other hooks/components you used in the original file
// import TaskDetailView from './TaskDetailView'; // example (if you split UI into another component)

export default function TaskDetailPage() {
  // read id from client-side router params
  const params = useParams() || {};
  const id = params.id as string | undefined;

  // keep using your client context hook
  const { updateTask, ...rest } = useClientData();
  const toast = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (!id) return;
    // if you had server fetching, call client fetch or your existing client data loader
    // Example: load task from client store if not present
  }, [id, toast]);

  if (!id) {
    return <div className="p-6">Invalid task id</div>;
  }

  // Render your task detail UI here.
  // If your original file was large, consider moving the UI into a child component like <TaskDetailView id={id} />
  return (
    <div className="min-h-screen p-4">
      {/* keep original UI: you can paste the old JSX here or call a subcomponent */}
      <h1 className="text-xl font-semibold">Task {id}</h1>
      {/* ... original content */}
    </div>
  );
}
