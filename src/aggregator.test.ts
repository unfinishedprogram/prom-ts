import { describe, expect, mock, test } from "bun:test";
import { LabelingAggregator, SimpleAggregator } from "./aggregator";
import type { MetadataFormatter, TimeseriesFormatter } from "./format";
import TestAggregator from "./test/testAggregator";

describe("Aggregator", () => {
  test("custom formatter is used if provided", () => {
    const formatter = {
      timeseries: mock<TimeseriesFormatter>(),
      metadata: mock<MetadataFormatter>(),
    };
    const aggregator = new SimpleAggregator();

    aggregator.addMeta("metric_name", "counter", "A counter metric");
    aggregator.addSample("metric_name", 42, { label1: "value1" });
    aggregator.format(formatter);

    expect(formatter.metadata)
      .toHaveBeenCalledWith("metric_name", "counter", "A counter metric");

    expect(formatter.timeseries)
      .toHaveBeenCalledWith("metric_name", 42, { label1: "value1" });
  });

  describe("Observe method", () => {
    test("observe adds both metadata and sample entries", () => {
      const aggregator = new SimpleAggregator();

      aggregator.observe(
        "observed_metric",
        "counter",
        100,
        "An observed counter metric",
        { labelA: "valueA" },
      );

      expect(aggregator.metadata[0]).toEqual({
        name: "observed_metric",
        type: "counter",
        description: "An observed counter metric",
      });

      expect(aggregator.samples[0]).toEqual({
        name: "observed_metric",
        value: 100,
        labels: { labelA: "valueA" },
      });
    });

    test("observe produces the same results as separate addMeta and addSample calls", () => {
      const aggregator1 = new SimpleAggregator();
      const aggregator2 = new SimpleAggregator();

      aggregator1.observe(
        "observed_metric",
        "counter",
        100,
        "An observed counter metric",
        { labelA: "valueA" },
      );

      aggregator2.addMeta(
        "observed_metric",
        "counter",
        "An observed counter metric",
      );
      aggregator2.addSample("observed_metric", 100, { labelA: "valueA" });

      expect(aggregator1.metadata).toEqual(aggregator2.metadata);
      expect(aggregator1.samples).toEqual(aggregator2.samples);

      expect(aggregator1.toString()).toEqual(aggregator2.toString());
    });
  });

  describe("Labeling aggregator", () => {
    test("LabelingAggregator applies default labels to metadata and samples", () => {
      const baseAggregator = new TestAggregator();
      const labelingAggregator = new LabelingAggregator(baseAggregator, {
        env: "production",
        service: "user-service",
      });

      labelingAggregator.observe(
        "test_metric",
        "gauge",
        123,
        "A test metric",
        { region: "us-east" },
      );

      expect(baseAggregator.metadata[0]).toEqual({
        name: "test_metric",
        type: "gauge",
        description: "A test metric",
      });

      expect(baseAggregator.samples[0]).toEqual({
        name: "test_metric",
        value: 123,
        labels: {
          env: "production",
          service: "user-service",
          region: "us-east",
        },
      });
    });
  });
});
