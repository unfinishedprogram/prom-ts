import type MetricRegistry from "../../metricRegistry";

export function registerServerMetrics(
  registry: MetricRegistry,
  server: Bun.Server<undefined>,
  labels?: Record<string, string>,
) {
  registry.observer(
    "bun_server_pending_requests",
    () => server.pendingRequests,
    labels,
  );
}
