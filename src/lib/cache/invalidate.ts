export async function invalidate(key: string) {
  if (typeof window !== "undefined")
    localStorage.removeItem(key);
}
