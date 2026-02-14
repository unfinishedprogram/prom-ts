import { describe, expect, mock, test } from "bun:test";
import { Aggregator } from "./aggregator";
import type { MetadataFormatter, TimeseriesFormatter } from "./format";

describe("Aggregator", () => {
  test("custom formatter is used if provided", () => {
    const formatter = {
      timeseries: mock<TimeseriesFormatter>(),
      metadata: mock<MetadataFormatter>(),
    };
    const aggregator = new Aggregator(formatter);

    aggregator.addMeta("metric_name", "counter", "A counter metric");
    aggregator.addSample("metric_name", 42, { label1: "value1" });
    aggregator.format();

    expect(formatter.metadata)
      .toHaveBeenCalledWith("metric_name", "counter", "A counter metric");

    expect(formatter.timeseries)
      .toHaveBeenCalledWith("metric_name", 42, { label1: "value1" });
  });

  test("toString is equivalent to calling format", () => {
    const aggregator = new Aggregator();

    aggregator.addMeta("metric_name", "counter", "A counter metric");
    aggregator.addSample("metric_name", 42, { label1: "value1" });

    aggregator.addMeta("other_metric", "gauge", "A gauge metric");
    aggregator.addSample("other_metric", 43);

    const formatResult = aggregator.format();
    const toStringResult = aggregator.toString();

    expect(formatResult).toBe(toStringResult);
  });

  describe("Observe method", () => {
    test("observe adds both metadata and sample entries", () => {
      const aggregator = new Aggregator();

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
      const aggregator1 = new Aggregator();
      const aggregator2 = new Aggregator();

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

      expect(aggregator1.format()).toEqual(aggregator2.format());
    });
  });
});
