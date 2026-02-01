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
