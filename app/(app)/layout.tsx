import type { ReactNode } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { ANALYTICS_KEY } from "@/lib/analytics-query";
import { getAnalytics } from "@/lib/data";

// Server Component: fetch the data once on the server and hand it to the client cache,
// so every page in the app already has real numbers on first paint.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ANALYTICS_KEY,
    queryFn: async () => getAnalytics(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppShell>{children}</AppShell>
    </HydrationBoundary>
  );
}
