# prom-ts

A simple zero-dependency prometheus compatible client-library

## Example usage

### Using the global registry

```ts
import metrics from "prom-ts"

// Create a counter
const requestCounter = metrics.counter("http_requests_total", {
  method: "GET",
  path: "/api"
});
requestCounter.inc(); // Increment by 1
requestCounter.inc(5); // Increment by 5

// Create a gauge
const cpuUsage = metrics.gauge("cpu_usage_percent");
cpuUsage.set(45.2);
cpuUsage.set(67.8);

// Create a histogram with default buckets
const requestDuration = metrics.histogram("http_request_duration_seconds", {
  endpoint: "/api/users"
});
requestDuration.observe(0.123);
requestDuration.observe(0.456);

// Create a histogram with custom linear buckets
const customHistogram = metrics.histogram("custom_metric")
  .withLinearBuckets(0, 10, 5); // start=0, width=10, count=5 -> [0, 10, 20, 30, 40]

// Create a histogram with exponential buckets
const expHistogram = metrics.histogram("response_size_bytes")
  .withExponentialBuckets(1, 2, 8); // start=1, factor=2, count=8 -> [1, 2, 4, 8, 16, 32, 64, 128]

// Create an observer that dynamically reads a value
let memoryUsed = 0;
const memoryObserver = metrics.observer(
  "memory_used_bytes",
  () => memoryUsed
);

// Export metrics in Prometheus format
const output = metrics.collect();
console.log(output);
```


### Manually creating a registry

```ts
import { MetricRegistry } from "prom-ts"

// Create a custom registry
const registry = new MetricRegistry();

// Create metrics on the custom registry
const counter = registry.counter("custom_counter");
counter.inc(10);

const gauge = registry.gauge("temperature_celsius", { location: "room1" });
gauge.set(22.5);

const histogram = registry.histogram("request_latency_ms");
histogram.observe(150);
histogram.observe(200);

// Create an observer
let activeSessions = 0;
const sessionObserver = registry.observer(
  "active_sessions",
  () => activeSessions
);

// Collect metrics from this specific registry
const metrics = registry.collect();
console.log(metrics);
```

## Development

### Install dependencies

```sh
bun install
```

### Run unit tests

```sh
bun test
```
