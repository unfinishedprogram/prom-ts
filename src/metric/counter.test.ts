import { describe, expect, test } from "bun:test";
import Counter from "./counter";

describe("Counter", () => {
  test("Incrementing by a negative value does nothing", () => {
    const counter = new Counter("test_counter");
    counter.inc(-1);
    expect(counter.getValue()).toBe(0);
  });

  test("Incrementing by a positive value works correctly", () => {
    const counter = new Counter("test_counter");
    expect(counter.getValue()).toBe(0);

    counter.inc(3);
    expect(counter.getValue()).toBe(3);

    counter.inc();
    expect(counter.getValue()).toBe(4);
  });

  test("Format is correct", () => {
    const counter = new Counter("flag", {
      name: "storage.cacheSizeIndexDBDataBlocks",
      value: "0",
      is_set: "false",
    });

    counter.inc();

    expect(counter.collect()).toEqual(
      `flag{name="storage.cacheSizeIndexDBDataBlocks", value="0", is_set="false"} 1`,
    );
  });
});
