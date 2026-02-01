import { describe, expect, test } from "bun:test";
import MetricRegistry from "./collector_registry";

describe("MetricRegistry registration semantics", () => {
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
});

describe("Metric descriptions", () => {
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
});

describe("Default labels in MetricRegistry", () => {
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
});

describe("MetricRegistry children", () => {
  test("Metrics registered on child registries are collected by parent", () => {
    const parentRegistry = new MetricRegistry();
    const childRegistry = parentRegistry.withLabels();

    const counter = childRegistry.counter("child_counter");
    counter.inc(1);

    const collected = parentRegistry.collect();
    expect(collected).toContain("child_counter 1");
  });

  test("Child registries inherit default labels from parent", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = parentRegistry.withLabels({ service: "api" });

    const counter = childRegistry.counter("child_labeled_counter");
    counter.inc(1);

    const collected = parentRegistry.collect();
    expect(collected).toContain(
      'child_labeled_counter{env="test", service="api"} 1',
    );
  });

  test("Child registries can add to parent default labels", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = parentRegistry.withLabels({ service: "api" });

    const counter = childRegistry.counter("child_labeled_counter");
    counter.inc(1);

    const collected = parentRegistry.collect();
    expect(collected).toContain(
      'child_labeled_counter{env="test", service="api"} 1',
    );
  });

  test("Child registries can override parent default labels", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = parentRegistry.withLabels({ env: "prod" });

    const counter = childRegistry.counter("child_labeled_counter");
    counter.inc(1);

    const collected = parentRegistry.collect();
    expect(collected).toContain(
      'child_labeled_counter{env="prod"} 1',
    );
  });

  test("Child registries can be nested", () => {
    const grandParentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const registry = grandParentRegistry
      .withLabels({ service: "api" })
      .withLabels({ version: "v1" })
      .withLabels({ region: "us-east" });

    const counter = registry.counter("nested_labeled_counter");
    counter.inc(1);

    const collected = grandParentRegistry.collect();
    expect(collected).toContain(
      'nested_labeled_counter{env="test", service="api", version="v1", region="us-east"} 1',
    );
  });

  test("Children can be added manually", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = new MetricRegistry({
      defaultLabels: { service: "api" },
    });

    parentRegistry.addCollector(childRegistry);

    const counter = childRegistry.counter("manually_added_child_counter");
    counter.inc(1);

    const collected = parentRegistry.collect();

    expect(collected).toContain(
      'manually_added_child_counter{service="api"} 1',
    );
  });
});
