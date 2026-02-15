import { describe, expect, test } from "bun:test";
import MetricRegistry from "./metricRegistry";
import TestAggregator from "./test/testAggregator";

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

    const agg = new TestAggregator();
    registry.aggregate(agg);
    expect(agg.getMetric("test_gauge")?.value).toBe(0);

    registry.unregister(gauge);

    const aggAfterUnregister = new TestAggregator();
    registry.aggregate(aggAfterUnregister);
    expect(aggAfterUnregister.getMetric("test_gauge")).toBeUndefined();
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

    const agg = new TestAggregator();
    registry.aggregate(agg);

    expect(agg.getMeta("described_counter")?.description).toBe(
      "This is a test counter",
    );
    expect(agg.getMeta("described_gauge")?.description).toBe(
      "This is a test gauge",
    );
    expect(agg.getMeta("described_observer")?.description).toBe(
      "This is a test observer",
    );
    expect(agg.getMeta("described_histogram")?.description).toBe(
      "This is a test histogram",
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

    const agg = new TestAggregator();
    registry.aggregate(agg);

    expect(agg.getMetric('labeled_counter{"env":"test"}')?.value).toBe(1);
    expect(agg.getMetric('labeled_gauge{"env":"test"}')?.value).toBe(5);
  });

  test("Metrics can override default labels", () => {
    const registry = new MetricRegistry({ defaultLabels: { env: "test" } });

    const counter = registry.counter("labeled_counter", {
      other_label: "no_override",
    });
    counter.inc();
    const gauge = registry.gauge("labeled_gauge", { env: "prod" });
    gauge.set(5);

    const agg = new TestAggregator();
    registry.aggregate(agg);

    expect(
      agg.getMetric('labeled_counter{"env":"test","other_label":"no_override"}')
        ?.value,
    ).toBe(1);
    expect(agg.getMetric('labeled_gauge{"env":"prod"}')?.value).toBe(5);
  });

  test("Metrics labels are merged with default labels", () => {
    const registry = new MetricRegistry({ defaultLabels: { env: "test" } });

    const counter = registry.counter("labeled_counter", {
      method: "GET",
    });
    counter.inc();

    const agg = new TestAggregator();
    registry.aggregate(agg);

    expect(agg.getMetric('labeled_counter{"env":"test","method":"GET"}')?.value)
      .toBe(1);
  });
});

describe("MetricRegistry children", () => {
  test("Metrics registered on child registries are collected by parent", () => {
    const parentRegistry = new MetricRegistry();
    const childRegistry = parentRegistry.withLabels();

    const counter = childRegistry.counter("child_counter");
    counter.inc(1);

    const agg = new TestAggregator();
    parentRegistry.aggregate(agg);
    expect(agg.getMetric("child_counter")?.value).toBe(1);
  });

  test("Child registries inherit default labels from parent", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = parentRegistry.withLabels({ service: "api" });

    const counter = childRegistry.counter("child_labeled_counter");
    counter.inc(1);

    const agg = new TestAggregator();
    parentRegistry.aggregate(agg);
    expect(
      agg.getMetric('child_labeled_counter{"env":"test","service":"api"}')
        ?.value,
    ).toBe(1);
  });

  test("Child registries can add to parent default labels", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = parentRegistry.withLabels({ service: "api" });

    const counter = childRegistry.counter("child_labeled_counter");
    counter.inc(1);

    const agg = new TestAggregator();
    parentRegistry.aggregate(agg);
    expect(
      agg.getMetric('child_labeled_counter{"env":"test","service":"api"}')
        ?.value,
    ).toBe(1);
  });

  test("Child registries can override parent default labels", () => {
    const parentRegistry = new MetricRegistry({
      defaultLabels: { env: "test" },
    });
    const childRegistry = parentRegistry.withLabels({ env: "prod" });

    const counter = childRegistry.counter("child_labeled_counter");
    counter.inc(1);

    const agg = new TestAggregator();
    parentRegistry.aggregate(agg);
    expect(agg.getMetric('child_labeled_counter{"env":"prod"}')?.value).toBe(1);
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

    const agg = new TestAggregator();
    grandParentRegistry.aggregate(agg);
    expect(
      agg.getMetric(
        'nested_labeled_counter{"env":"test","service":"api","version":"v1","region":"us-east"}',
      )?.value,
    ).toBe(1);
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

    const agg = new TestAggregator();
    parentRegistry.aggregate(agg);

    expect(
      agg.getMetric(
        'manually_added_child_counter{"env":"test","service":"api"}',
      )?.value,
    ).toBe(1);
  });
});

describe("MetricRegistry aggregation", () => {
  test("Metrics from all collectors are aggregated", () => {
    const registry = new MetricRegistry();

    const counter = registry.counter("test_counter");
    counter.inc(5);

    const gauge = registry.gauge("test_gauge");
    gauge.set(10);

    const agg = new TestAggregator();
    registry.aggregate(agg);

    expect(agg.getMetric("test_counter")?.value).toBe(5);
    expect(agg.getMetric("test_gauge")?.value).toBe(10);

    expect(registry.collect()).toBeString();
  });
});
