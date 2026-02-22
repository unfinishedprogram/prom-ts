import { describe, expect, test } from "bun:test";
import MetricRegistry from "./metricRegistry";
import { BaseAggregator } from "../src/aggregator";

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

    const agg = new BaseAggregator();
    registry.aggregate(agg);
    expect(agg.metrics["test_gauge"]).toBeDefined();
    expect(agg.metrics["test_gauge"]?.samples[0]).toMatchObject({
      name: "test_gauge",
      type: "gauge",
      value: 0,
    });

    registry.unregister(gauge);

    const aggAfterUnregister = new BaseAggregator();
    registry.aggregate(aggAfterUnregister);
    expect(aggAfterUnregister.metrics["test_gauge"]).toBeUndefined();
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

    const agg = new BaseAggregator();
    registry.aggregate(agg);

    expect(agg.metrics["described_counter"]?.description)
      .toBe("This is a test counter");
    expect(agg.metrics["described_gauge"]?.description)
      .toBe("This is a test gauge");
    expect(agg.metrics["described_observer"]?.description)
      .toBe("This is a test observer");
    expect(agg.metrics["described_histogram"]?.description)
      .toBe("This is a test histogram");
  });
});

describe("Default labels in MetricRegistry", () => {
  test("Default labels are applied to metrics", () => {
    const registry = new MetricRegistry({ defaultLabels: { env: "test" } });

    const counter = registry.counter("labeled_counter");
    counter.inc();
    const gauge = registry.gauge("labeled_gauge");
    gauge.set(5);

    const agg = new BaseAggregator();
    registry.aggregate(agg);

    expect(agg.metrics["labeled_counter"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "labeled_counter",
        type: "counter",
        value: 1,
        labels: { env: "test" },
      }));
    expect(agg.metrics["labeled_gauge"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "labeled_gauge",
        type: "gauge",
        value: 5,
        labels: { env: "test" },
      }));
  });

  test("Metrics can override default labels", () => {
    const registry = new MetricRegistry({ defaultLabels: { env: "test" } });

    const counter = registry.counter("labeled_counter", {
      other_label: "no_override",
    });
    counter.inc();
    const gauge = registry.gauge("labeled_gauge", { env: "prod" });
    gauge.set(5);

    const agg = new BaseAggregator();
    registry.aggregate(agg);

    expect(agg.metrics["labeled_counter"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "labeled_counter",
        type: "counter",
        value: 1,
        labels: { env: "test", other_label: "no_override" },
      }));
    expect(agg.metrics["labeled_gauge"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "labeled_gauge",
        type: "gauge",
        value: 5,
        labels: { env: "prod" },
      }));
  });

  test("Metrics labels are merged with default labels", () => {
    const registry = new MetricRegistry({ defaultLabels: { env: "test" } });

    const counter = registry.counter("labeled_counter", {
      method: "GET",
    });
    counter.inc();

    const agg = new BaseAggregator();
    registry.aggregate(agg);

    expect(agg.metrics["labeled_counter"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "labeled_counter",
        type: "counter",
        value: 1,
        labels: { env: "test", method: "GET" },
      }));
  });
});

describe("MetricRegistry children", () => {
  test("Metrics registered on child registries are collected by parent", () => {
    const parentRegistry = new MetricRegistry();
    const childRegistry = parentRegistry.withLabels();

    const counter = childRegistry.counter("child_counter");
    counter.inc(1);

    const agg = new BaseAggregator();
    parentRegistry.aggregate(agg);
    expect(agg.metrics["child_counter"]!.samples[0]).toMatchObject({
      name: "child_counter",
      type: "counter",
      value: 1,
    });
  });

  test("Child registries inherit default labels from parent", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = parentRegistry.withLabels({ service: "api" });

    const counter = childRegistry.counter("child_labeled_counter");
    counter.inc(1);

    const agg = new BaseAggregator();
    parentRegistry.aggregate(agg);
    expect(agg.metrics["child_labeled_counter"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "child_labeled_counter",
        type: "counter",
        value: 1,
        labels: { env: "test", service: "api" },
      }));
  });

  test("Child registries can add to parent default labels", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = parentRegistry.withLabels({ service: "api" });

    const counter = childRegistry.counter("child_labeled_counter");
    counter.inc(1);

    const agg = new BaseAggregator();
    parentRegistry.aggregate(agg);
    expect(agg.metrics["child_labeled_counter"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "child_labeled_counter",
        type: "counter",
        value: 1,
        labels: { env: "test", service: "api" },
      }));
  });

  test("Child registries can override parent default labels", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = parentRegistry.withLabels({ env: "prod" });

    const counter = childRegistry.counter("child_labeled_counter");
    counter.inc(1);

    const agg = new BaseAggregator();
    parentRegistry.aggregate(agg);
    expect(agg.metrics["child_labeled_counter"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "child_labeled_counter",
        type: "counter",
        value: 1,
        labels: { env: "prod" },
      }));
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

    const agg = new BaseAggregator();
    grandParentRegistry.aggregate(agg);
    expect(agg.metrics["nested_labeled_counter"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "nested_labeled_counter",
        type: "counter",
        value: 1,
        labels: {
          env: "test",
          service: "api",
          version: "v1",
          region: "us-east",
        },
      }));
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

    const agg = new BaseAggregator();
    parentRegistry.aggregate(agg);

    expect(agg.metrics["manually_added_child_counter"]!.samples)
      .toContainEqual(expect.objectContaining({
        name: "manually_added_child_counter",
        type: "counter",
        value: 1,
        labels: { env: "test", service: "api" },
      }));
  });
});

describe("MetricRegistry aggregation", () => {
  test("Metrics from all collectors are aggregated", () => {
    const registry = new MetricRegistry();

    const counter = registry.counter("test_counter");
    counter.inc(5);

    const gauge = registry.gauge("test_gauge");
    gauge.set(10);

    const agg = new BaseAggregator();
    registry.aggregate(agg);

    expect(agg.metrics["test_counter"]!.samples[0]).toMatchObject({
      name: "test_counter",
      type: "counter",
      value: 5,
    });
    expect(agg.metrics["test_gauge"]!.samples[0]).toMatchObject({
      name: "test_gauge",
      type: "gauge",
      value: 10,
    });

    expect(registry.collect()).toBeString();
  });
});
