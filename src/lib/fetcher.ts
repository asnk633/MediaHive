import { apiClient } from '@/lib/apiClient';

export async function fetcher(url:string, opts: RequestInit = {}, timeout = 15000) {
  // Note: This function is designed to work with internal API routes only
  // since apiClient handles authentication tokens
  try {
    const result = await apiClient(url, opts);
    return result;
  } catch (e) {
    throw e;
  }
}