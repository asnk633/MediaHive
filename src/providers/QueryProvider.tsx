import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./ReactQueryProvider"

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
