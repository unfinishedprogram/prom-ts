import { describe, expect, test } from "bun:test";
import Observer from "./observer";

describe("Observer", () => {
  test("Observer returns the value returned by the observed function", () => {
    const observer = new Observer("test_observer", () => 10);
    expect(observer.value).toBe(10);
  });

  test("Observer updates value when value changes", () => {
    let observedValue = 5;
    const observer = new Observer("test_observer", () => observedValue);

    expect(observer.value).toBe(5);
    observedValue = 15;
    expect(observer.value).toBe(15);
  });

  test("Observer has the correct metric type", () => {
    const defaultObserver = new Observer("test_observer", () => 10);
    expect(defaultObserver.metricType).toBe("gauge");

    const counterObserver = new Observer(
      "test_counter_observer",
      () => 20,
      "counter",
    );
    expect(counterObserver.metricType).toBe("counter");

    const gaugeObserver = new Observer(
      "test_gauge_observer",
      () => 30,
      "gauge",
    );
    expect(gaugeObserver.metricType).toBe("gauge");
  });
});
