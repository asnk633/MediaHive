"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

// ─── types ──────────────────────────────────────────────────────────────────

type LogLevel = "log" | "info" | "warn" | "error";

interface LogEntry {
  id: number;
  level: LogLevel;
  timestamp: Date;
  message: string;
  stack?: string;
}

interface TelemetryData {
  userAgent: string;
  url: string;
  viewport: string;
  memory?: string;
  connection?: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onlineStatus: boolean;
  timezone: string;
  capturedAt: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

let _logId = 0;
const nextId = () => ++_logId;

function formatDate(d: Date) {
  return d.toLocaleTimeString("en-US", { hour12: false, fractionalSecondDigits: 3 });
}

function getTelemetry(): TelemetryData {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number };
  };
  return {
    userAgent: nav.userAgent,
    url: location.href,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : "N/A",
    connection: nav.connection
      ? `${nav.connection.effectiveType ?? "?"} ${nav.connection.downlink ?? "?"}Mbps`
      : "N/A",
    platform: nav.platform,
    language: nav.language,
    cookieEnabled: nav.cookieEnabled,
    onlineStatus: nav.onLine,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    capturedAt: new Date().toISOString(),
  };
}

function buildShareText(logs: LogEntry[], telemetry: TelemetryData): string {
  const sep = "─".repeat(60);
  const header = [
    "MediaHive · Telemetry & Log Report",
    `Generated: ${telemetry.capturedAt}`,
    "",
    "DEVICE TELEMETRY",
    sep,
    `URL:        ${telemetry.url}`,
    `Platform:   ${telemetry.platform}`,
    `Viewport:   ${telemetry.viewport}`,
    `Memory:     ${telemetry.memory}`,
    `Network:    ${telemetry.connection}`,
    `Online:     ${telemetry.onlineStatus}`,
    `Language:   ${telemetry.language}`,
    `Timezone:   ${telemetry.timezone}`,
    `Cookies:    ${telemetry.cookieEnabled}`,
    `UA:         ${telemetry.userAgent}`,
    "",
    "LOG ENTRIES",
    sep,
  ].join("\n");

  const logLines = logs.length
    ? logs
        .map((l) =>
          [
            `[${formatDate(l.timestamp)}] [${l.level.toUpperCase()}] ${l.message}`,
            l.stack ? `  Stack: ${l.stack.split("\n").slice(0, 3).join(" | ")}` : "",
          ]
            .filter(Boolean)
            .join("\n")
        )
        .join("\n")
    : "(no logs captured)";

  return `${header}\n${logLines}\n`;
}

// ─── level colours ────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<LogLevel, string> = {
  log:   "text-slate-400",
  info:  "text-blue-400",
  warn:  "text-amber-400",
  error: "text-red-400",
};

const LEVEL_BADGE: Record<LogLevel, string> = {
  log:   "bg-slate-700/60 text-slate-300",
  info:  "bg-blue-900/60 text-blue-300",
  warn:  "bg-amber-900/60 text-amber-300",
  error: "bg-red-900/60 text-red-300",
};

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "logs" | "telemetry";

// ─── main component ───────────────────────────────────────────────────────────

export function TelemetryFAB() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("logs");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── intercept console ─────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);

    const originals: Record<LogLevel, typeof console.log> = {
      log:   console.log.bind(console),
      info:  console.info.bind(console),
      warn:  console.warn.bind(console),
      error: console.error.bind(console),
    };

    const intercept = (level: LogLevel) =>
      (...args: unknown[]) => {
        originals[level](...args);
        const message = args
          .map((a) =>
            typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
          )
          .join(" ");

        // Defer state updates to avoid React "Cannot update a component while rendering a different component" warnings
        setTimeout(() => {
          setLogs((prev) => {
            const next = [
              ...prev,
              { id: nextId(), level, timestamp: new Date(), message },
            ];
            // keep last 500 lines
            return next.length > 500 ? next.slice(next.length - 500) : next;
          });
          if (level === "error") {
            setErrorCount((c) => c + 1);
          }
        }, 0);
      };

    console.log   = intercept("log");
    console.info  = intercept("info");
    console.warn  = intercept("warn");
    console.error = intercept("error");

    // uncaught errors
    const onError = (e: ErrorEvent) => {
      setLogs((prev) => [
        ...prev,
        {
          id: nextId(),
          level: "error",
          timestamp: new Date(),
          message: `[uncaught] ${e.message} @ ${e.filename}:${e.lineno}`,
          stack: e.error?.stack,
        },
      ]);
      setErrorCount((c) => c + 1);
    };

    const onReject = (e: PromiseRejectionEvent) => {
      const msg =
        e.reason instanceof Error ? e.reason.message : String(e.reason);
      setLogs((prev) => [
        ...prev,
        {
          id: nextId(),
          level: "error",
          timestamp: new Date(),
          message: `[unhandled rejection] ${msg}`,
          stack: e.reason instanceof Error ? e.reason.stack : undefined,
        },
      ]);
      setErrorCount((c) => c + 1);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);

    return () => {
      console.log   = originals.log;
      console.info  = originals.info;
      console.warn  = originals.warn;
      console.error = originals.error;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);

  // ── auto-scroll logs ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open && tab === "logs") {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, open, tab]);

  // ── refresh telemetry on open ─────────────────────────────────────────────
  useEffect(() => {
    if (open) setTelemetry(getTelemetry());
  }, [open]);

  // ── close on backdrop click ───────────────────────────────────────────────
  const onBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setOpen(false);
  }, []);

  // ── share / copy ──────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const tel = getTelemetry();
    const text = buildShareText(logs, tel);

    if (navigator.share) {
      try {
        await navigator.share({ title: "MediaHive Logs", text });
        return;
      } catch { /* fall through to clipboard */ }
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [logs]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    setErrorCount(0);
  }, []);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.level === filter);

  if (!mounted) return null;

  const trigger = (
    <button
      id="telemetry-fab"
      aria-label="Open telemetry panel"
      onClick={() => {
        setOpen((v) => !v);
        setErrorCount(0);
      }}
      className="telemetry-fab-btn"
    >
      {/* icon: waveform / activity */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      {errorCount > 0 && (
        <span className="telemetry-fab-badge" aria-label={`${errorCount} errors`}>
          {errorCount > 9 ? "9+" : errorCount}
        </span>
      )}
    </button>
  );

  const panel = open
    ? createPortal(
        <div
          className="telemetry-backdrop"
          onClick={onBackdropClick}
          aria-label="Close telemetry panel"
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Telemetry & Logs"
            className="telemetry-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── header ── */}
            <div className="telemetry-header">
              <div className="telemetry-title-row">
                <span className="telemetry-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Telemetry &amp; Logs
                </span>
                <button
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="telemetry-close-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* ── tabs ── */}
              <div className="telemetry-tabs">
                <button
                  className={`telemetry-tab${tab === "logs" ? " active" : ""}`}
                  onClick={() => setTab("logs")}
                >
                  Logs
                  <span className="telemetry-count">{logs.length}</span>
                </button>
                <button
                  className={`telemetry-tab${tab === "telemetry" ? " active" : ""}`}
                  onClick={() => setTab("telemetry")}
                >
                  Device Info
                </button>
              </div>

              {/* ── log filters (only on logs tab) ── */}
              {tab === "logs" && (
                <div className="telemetry-filters">
                  {(["all", "log", "info", "warn", "error"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      className={`telemetry-filter-btn${filter === lvl ? " active" : ""}`}
                      onClick={() => setFilter(lvl)}
                    >
                      {lvl === "all" ? "All" : lvl.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── body ── */}
            <div className="telemetry-body">
              {tab === "logs" && (
                <>
                  {filteredLogs.length === 0 ? (
                    <div className="telemetry-empty">No log entries yet</div>
                  ) : (
                    <div className="telemetry-log-list">
                      {filteredLogs.map((entry) => (
                        <div key={entry.id} className={`telemetry-log-row ${LEVEL_STYLE[entry.level]}`}>
                          <span className="telemetry-log-time">{formatDate(entry.timestamp)}</span>
                          <span className={`telemetry-log-badge ${LEVEL_BADGE[entry.level]}`}>
                            {entry.level.toUpperCase()}
                          </span>
                          <span className="telemetry-log-msg">{entry.message}</span>
                          {entry.stack && (
                            <details className="telemetry-stack-details">
                              <summary>Stack</summary>
                              <pre className="telemetry-stack-pre">{entry.stack}</pre>
                            </details>
                          )}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </>
              )}

              {tab === "telemetry" && telemetry && (
                <dl className="telemetry-dl">
                  {(
                    [
                      ["URL",        telemetry.url],
                      ["Platform",   telemetry.platform],
                      ["Viewport",   telemetry.viewport],
                      ["Memory",     telemetry.memory ?? "N/A"],
                      ["Network",    telemetry.connection ?? "N/A"],
                      ["Online",     String(telemetry.onlineStatus)],
                      ["Language",   telemetry.language],
                      ["Timezone",   telemetry.timezone],
                      ["Cookies",    String(telemetry.cookieEnabled)],
                      ["Captured",   telemetry.capturedAt],
                      ["User-Agent", telemetry.userAgent],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div key={label} className="telemetry-dl-row">
                      <dt className="telemetry-dt">{label}</dt>
                      <dd className="telemetry-dd">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            {/* ── footer ── */}
            <div className="telemetry-footer">
              <button className="telemetry-action-btn ghost" onClick={handleClearLogs}>
                Clear
              </button>
              <button
                className="telemetry-action-btn primary"
                onClick={handleShare}
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Share / Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {trigger}
      {panel}
    </>
  );
}
