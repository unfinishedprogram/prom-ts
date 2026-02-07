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
});
