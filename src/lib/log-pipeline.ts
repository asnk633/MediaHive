export async function logServerEvent(event: any) {
  try {
    if (!process.env.LOG_WEBHOOK) return;
    await fetch(process.env.LOG_WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...event,
        ts: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error("Log pipeline failed:", err);
  }
}