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

  test("Format is correct", () => {
    const observer = new Observer("flag", () => 7, {
      name: "storage.cacheSizeIndexDBDataBlocks",
      value: "0",
      is_set: "false",
    });

    expect(observer.collect()).toEqual(
      `flag{name="storage.cacheSizeIndexDBDataBlocks", value="0", is_set="false"} 7`,
    );
  });
});
