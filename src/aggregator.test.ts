import { describe, expect, mock, test } from "bun:test";
import { BaseAggregator, LabelingAggregator } from "./aggregator";
import type { MetadataFormatter, TimeseriesFormatter } from "./format";

describe("Aggregator", () => {
  test("custom formatter is used if provided", () => {
    const formatter = {
      timeseries: mock<TimeseriesFormatter>(),
      metadata: mock<MetadataFormatter>(),
    };
    const aggregator = new BaseAggregator();

    aggregator.observe({
      name: "metric_name",
      type: "counter",
      description: "A counter metric",
      value: 42,
      labels: { label1: "value1" },
    });
    aggregator.format(formatter);

    expect(formatter.metadata)
      .toHaveBeenCalledWith("metric_name", "counter", "A counter metric");

    expect(formatter.timeseries)
      .toHaveBeenCalledWith("metric_name", 42, { label1: "value1" });
  });

  describe("Observe method", () => {
    test("observe adds metric family with sample", () => {
      const aggregator = new BaseAggregator();

      aggregator.observe({
        name: "observed_metric",
        type: "counter",
        description: "An observed counter metric",
        value: 100,
        labels: { labelA: "valueA" },
      });

      expect(aggregator.metrics["observed_metric"]).toEqual({
        name: "observed_metric",
        type: "counter",
        description: "An observed counter metric",
        samples: [{
          name: "observed_metric",
          type: "counter",
          description: "An observed counter metric",
          value: 100,
          labels: { labelA: "valueA" },
        }],
      });
    });

    test("observe appends samples to existing metric family", () => {
      const aggregator = new BaseAggregator();

      aggregator.observe({
        name: "observed_metric",
        type: "counter",
        description: "An observed counter metric",
        value: 100,
        labels: { labelA: "valueA" },
      });

      aggregator.observe({
        name: "observed_metric",
        type: "counter",
        description: "An observed counter metric",
        value: 200,
        labels: { labelB: "valueB" },
      });

      const samples = aggregator.metrics["observed_metric"]!.samples;
      expect(samples).toHaveLength(2);
      expect((samples[0] as { value: number }).value).toBe(100);
      expect((samples[1] as { value: number }).value).toBe(200);
    });
  });

  describe("Labeling aggregator", () => {
    test("LabelingAggregator applies default labels to samples", () => {
      const baseAggregator = new BaseAggregator();
      const labelingAggregator = new LabelingAggregator(baseAggregator, {
        env: "production",
        service: "user-service",
      });

      labelingAggregator.observe({
        name: "test_metric",
        type: "gauge",
        description: "A test metric",
        value: 123,
        labels: { region: "us-east" },
      });

      expect(baseAggregator.metrics["test_metric"]).toEqual({
        name: "test_metric",
        type: "gauge",
        description: "A test metric",
        samples: [
          {
            name: "test_metric",
            type: "gauge",
            description: "A test metric",
            value: 123,
            labels: {
              env: "production",
              service: "user-service",
              region: "us-east",
            },
          },
        ],
      });
    });
  });
});
