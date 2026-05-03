export function DataFallback({ error }: { error: any }) {
  return (
    <div className="p-4 text-sm text-yellow-300 border border-yellow-500 rounded-lg">
      ⚠️ Failed to load live data. Showing last saved content.
    </div>
  );
}
