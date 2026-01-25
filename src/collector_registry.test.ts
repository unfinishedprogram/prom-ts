import { describe, expect, test } from "bun:test";
import MetricRegistry from "./collector_registry";
import Counter from "./metric/counter";

test("The same instance is returned for the same name", () => {
  const registry = new MetricRegistry();

  const counter = registry.counter("test_counter", { "name": "bad_name" });

  registry.counter("test_counter", { "name": "bad_name" }).inc(5);

  expect(counter.getValue()).toBe(5);
});
