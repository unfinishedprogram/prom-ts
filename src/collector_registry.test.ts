import { expect, test } from "bun:test";
import MetricRegistry from "./collector_registry";

test("The same instance is returned for the same name", () => {
  const registry = new MetricRegistry();

  const counter = registry.counter("test_counter", { "name": "bad_name" });

  registry.counter("test_counter", { "name": "bad_name" }).inc(5);

  expect(counter.value).toBe(5);
});

test("Unregistering a metric removes it from the registry", () => {
  const registry = new MetricRegistry();

  const gauge = registry.gauge("test_gauge");
  gauge.set(10);
  expect(gauge.value).toBe(10);

  // Re-create the gauge to ensure it's the same instance
  const oldGauge = registry.gauge("test_gauge");
  expect(oldGauge.value).toBe(10);

  // Unregister the gauge
  registry.unregister(gauge);

  // New gauge instance should have initial value
  const newGauge = registry.gauge("test_gauge");
  expect(newGauge.value).toBe(0);
});

test("Unregistering a metric prevents it from being collected by the registry", () => {
  const registry = new MetricRegistry();

  const gauge = registry.gauge("test_gauge");

  const collected = registry.collect();
  expect(collected).toContain("test_gauge 0");

  registry.unregister(gauge);

  const collectedAfterUnregister = registry.collect();
  expect(collectedAfterUnregister).not.toContain("test_gauge 0");
});

test("Can add descriptions to metrics", () => {
  const registry = new MetricRegistry();

  registry.counter("described_counter")
    .describe("This is a test counter");

  registry.gauge("described_gauge")
    .describe("This is a test gauge");

  registry.histogram("described_histogram")
    .describe("This is a test histogram");

  registry.observer("described_observer", () => 1)
    .describe("This is a test observer");

  const collected = registry.collect();

  expect(collected).toContain(
    "# HELP described_counter This is a test counter",
  );
  expect(collected).toContain(
    "# HELP described_gauge This is a test gauge",
  );
  expect(collected).toContain(
    "# HELP described_observer This is a test observer",
  );
  expect(collected).toContain(
    "# HELP described_histogram This is a test histogram",
  );
});

test("Default labels are applied to metrics", () => {
  const registry = new MetricRegistry({ defaultLabels: { env: "test" } });

  const counter = registry.counter("labeled_counter");
  counter.inc();
  const gauge = registry.gauge("labeled_gauge");
  gauge.set(5);

  const collected = registry.collect();

  expect(collected).toContain('labeled_counter{env="test"} 1');
  expect(collected).toContain('labeled_gauge{env="test"} 5');
});

test("Metrics can override default labels", () => {
  const registry = new MetricRegistry({ defaultLabels: { env: "test" } });

  const counter = registry.counter("labeled_counter", {
    other_label: "no_override",
  });
  counter.inc();
  const gauge = registry.gauge("labeled_gauge", { env: "prod" });
  gauge.set(5);

  const collected = registry.collect();

  expect(collected).toContain(
    'labeled_counter{env="test", other_label="no_override"} 1',
  );
  expect(collected).toContain('labeled_gauge{env="prod"} 5');
});

test("Metrics labels are merged with default labels", () => {
  const registry = new MetricRegistry({ defaultLabels: { env: "test" } });

  const counter = registry.counter("labeled_counter", {
    method: "GET",
  });
  counter.inc();

  const collected = registry.collect();

  expect(collected).toContain(
    'labeled_counter{env="test", method="GET"} 1',
  );
});
