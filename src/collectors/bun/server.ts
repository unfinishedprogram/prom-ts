import type { Labels } from "../../metric/metric";
import type MetricRegistry from "../../metricRegistry";

export function registerServerMetrics(
  registry: MetricRegistry,
  server: Bun.Server<any>,
  labels?: Labels,
) {
  registry.observer(
    "bun_server_pending_requests",
    () => server.pendingRequests,
    labels,
  ).describe("Number of pending requests");
}
