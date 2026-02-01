import { describe, expect, test } from "bun:test";
import Gauge from "./gauge";
import TestAggregator from "../test/testAggregator";

describe("Gauge", () => {
  test("Gauge can be set to a negative value", () => {
    const gauge = new Gauge("test_gauge");
    gauge.set(-5);
    expect(gauge.value).toBe(-5);

    gauge.set(-55.124674);
    expect(gauge.value).toBe(-55.124674);
  });

  test("Gauge can be set to a positive value", () => {
    const gauge = new Gauge("test_gauge");
    gauge.set(10);
    expect(gauge.value).toBe(10);

    gauge.set(42.987654);
    expect(gauge.value).toBe(42.987654);
  });
});
