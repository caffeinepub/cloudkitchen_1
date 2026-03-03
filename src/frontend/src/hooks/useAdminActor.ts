/**
 * useAdminActor - wraps the base actor and ensures the admin token
 * is initialized, even for anonymous (no-login) sessions.
 *
 * Since the app removed the login flow, all callers are anonymous.
 * The backend still uses access-control, so we must call
 * _initializeAccessControlWithSecret with the caffeineAdminToken
 * that Caffeine injects into the URL hash at deploy time.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend.d";
import { getSecretParameter } from "../utils/urlParams";
import { useActor } from "./useActor";

export function useAdminActor(): {
  actor: backendInterface | null;
  isFetching: boolean;
} {
  const { actor: baseActor, isFetching: baseFetching } = useActor();
  const initializedRef = useRef<backendInterface | null>(null);
  const qc = useQueryClient();

  // Use a stable key that changes only when the actor identity changes.
  // Using "ready"/"pending" strings avoids the stale-boolean problem.
  const actorKey = baseActor ? "ready" : "pending";

  const adminQuery = useQuery<backendInterface | null>({
    queryKey: ["adminActor", actorKey],
    queryFn: async () => {
      if (!baseActor) return null;
      const token = getSecretParameter("caffeineAdminToken") || "";
      try {
        // Initialize access control so anonymous actor gets admin rights
        await (
          baseActor as unknown as {
            _initializeAccessControlWithSecret: (t: string) => Promise<void>;
          }
        )._initializeAccessControlWithSecret(token);
      } catch {
        // Ignore errors – some deployments may not need this
      }
      return baseActor;
    },
    enabled: !!baseActor && !baseFetching,
    staleTime: Number.POSITIVE_INFINITY,
    // Retry up to 3 times if initialization fails
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    // Do NOT re-run initialization on every mount — once is enough
    refetchOnMount: false,
  });

  useEffect(() => {
    if (adminQuery.data && adminQuery.data !== initializedRef.current) {
      initializedRef.current = adminQuery.data;
      qc.invalidateQueries({
        predicate: (q) =>
          !q.queryKey.includes("adminActor") && !q.queryKey.includes("actor"),
      });
    }
  }, [adminQuery.data, qc]);

  return {
    actor: adminQuery.data ?? null,
    isFetching: baseFetching || adminQuery.isFetching,
  };
}
