# Monitoring Setup

## Webhook Configuration

To enable monitoring webhooks, set the following environment variable:

```
MONITORING_WEBHOOK=https://your-webhook-url.com/monitoring
```

## How it works

The monitoring system will send POST requests to the configured webhook URL with the following payloads:

### Exception Events
```json
{
  "type": "exception",
  "error": "Error message",
  "stack": "Stack trace",
  "context": {},
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

### Message Events
```json
{
  "type": "message",
  "message": "Log message",
  "level": "info|warning|error",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

## Enabling in Staging/Production

Add the `MONITORING_WEBHOOK` environment variable to your hosting platform (Vercel, Netlify, etc.) to enable monitoring in staging and production environments.