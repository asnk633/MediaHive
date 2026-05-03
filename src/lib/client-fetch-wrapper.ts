// dev-only client fetch wrapper
// ensures x-user-data header is attached to client fetch calls during local dev/testing
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  try {
    const FLAG = "__TGMM_FETCH_WRAPPER__";
    if (!(window as any)[FLAG]) {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
          const isInternalRequest = url.startsWith('/') || url.startsWith(window.location.origin);
          const stored = localStorage.getItem("user");

          if (isInternalRequest && stored) {
            const headers = new Headers(init?.headers as HeadersInit | undefined);
            if (!headers.get("x-user-data")) headers.set("x-user-data", stored);
            init = { ...(init || {}), headers };
          }
        } catch (err) {
          // don't break requests for dev helper errors
        }
        return originalFetch(input, init);
      };
      (window as any)[FLAG] = true;
    }
  } catch (err) {
    // silent fail
  }
}
