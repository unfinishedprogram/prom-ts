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
      const aggregator = new BaseAggregator();

      aggregator.observe(
        "observed_metric",
        "counter",
        "An observed counter metric",
        [{ value: 100, labels: { labelA: "valueA" } }],
      );

      expect(aggregator.metrics["observed_metric"]).toEqual(
        {
          type: "counter",
          description: "An observed counter metric",
          samples: [{ value: 100, labels: { labelA: "valueA" } }],
        },
      );
    });

    test("observe produces the same results as separate addMeta and addSample calls", () => {
      const aggregator1 = new BaseAggregator();
      const aggregator2 = new BaseAggregator();

      aggregator1.observe(
        "observed_metric",
        "counter",
        "An observed counter metric",
        [{ value: 100, labels: { labelA: "valueA" } }],
      );

      aggregator2.addMeta(
        "observed_metric",
        "counter",
        "An observed counter metric",
      );
      aggregator2.addSample("observed_metric", 100, { labelA: "valueA" });

      expect(aggregator1.metrics).toEqual(aggregator2.metrics);

      expect(aggregator1.toString()).toEqual(aggregator2.toString());
    });
  });

  describe("Labeling aggregator", () => {
    test("LabelingAggregator applies default labels to metadata and samples", () => {
      const baseAggregator = new BaseAggregator();
      const labelingAggregator = new LabelingAggregator(baseAggregator, {
        env: "production",
        service: "user-service",
      });

      labelingAggregator.observe(
        "test_metric",
        "gauge",
        "A test metric",
        [{ value: 123, labels: { region: "us-east" } }],
      );

      expect(baseAggregator.metrics["test_metric"])
        .toEqual({
          type: "gauge",
          description: "A test metric",
          samples: [
            {
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
