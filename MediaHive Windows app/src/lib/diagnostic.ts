export async function logDiagnostic(message: string, source: "tauri" | "browser" = "browser") {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${source.toUpperCase()}] ${message}`;
  console.log(logLine);

  try {
    // Save to localStorage so it is persistent inside the app and browser
    if (typeof window !== "undefined") {
      const existingLogs = localStorage.getItem("mediahive_diagnostic_logs");
      const logsArray = existingLogs ? JSON.parse(existingLogs) : [];
      logsArray.push(logLine);
      
      // Limit to 200 logs to prevent storage bloat
      if (logsArray.length > 200) {
        logsArray.shift();
      }
      localStorage.setItem("mediahive_diagnostic_logs", JSON.stringify(logsArray));
      
      // Dispatch custom event to notify any open Telemetry modals to re-render in real-time
      window.dispatchEvent(new CustomEvent("mediahive-new-log", { detail: logLine }));
    }
  } catch (err) {
    console.error("Failed to write to localStorage telemetry:", err);
  }

  try {
    // Send log to the local Next.js dev server endpoint
    fetch("http://localhost:3000/api/diagnostic-log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, source }),
    }).catch(() => {
      // Ignore network errors in production/offline
    });
  } catch (err) {
    // Ignore errors
  }
}
