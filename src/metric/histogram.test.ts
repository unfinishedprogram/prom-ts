import { describe, expect, test } from "bun:test";
import Histogram from "./histogram";
import { BaseAggregator } from "../aggregator";

describe("Histogram", () => {
  describe("Constructor", () => {
    test("Creates histogram with default buckets", () => {
      const histogram = new Histogram("test_histogram");
      const agg = new BaseAggregator();
      histogram.aggregate(agg);
      expect(agg.metrics["test_histogram"]!.type).toBe("histogram");

      expect(agg.metrics["test_histogram_bucket"]!.samples).toBeArrayOfSize(12);

      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 0, labels: { le: "0.005" } });
      expect(agg.metrics["test_histogram_count"]!.samples).toBeDefined();
      expect(agg.metrics["test_histogram_sum"]!.samples).toBeDefined();
    });

    test("Creates histogram with labels", () => {
      const histogram = new Histogram("test_histogram", {
        method: "GET",
        path: "/api",
      });
      const agg = new BaseAggregator();
      histogram.aggregate(agg);
      expect(agg.metrics["test_histogram_count"]!.samples)
        .toContainEqual(
          expect.objectContaining({ labels: { method: "GET", path: "/api" } }),
        );
      expect(agg.metrics["test_histogram_sum"]!.samples)
        .toContainEqual(
          expect.objectContaining({ labels: { method: "GET", path: "/api" } }),
        );
    });

    test("Throws error if label key is 'le'", () => {
      expect(() => {
        new Histogram("test_histogram", { le: "value" });
      }).toThrow('Histogram label keys cannot include "le"');
    });
  });

  describe("observe", () => {
    test("Records a single observation", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(0.5);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);
      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(1);
      expect(agg.metrics["test_histogram_sum"]!.samples[0]?.value).toBe(0.5);
    });

    test("Records multiple observations", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(0.5);
      histogram.observe(1.5);
      histogram.observe(2.5);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);
      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(3);
      expect(agg.metrics["test_histogram_sum"]!.samples[0]?.value).toBe(4.5);
    });

    test("Places observations in correct buckets", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(0.003); // Below first bucket (0.005)
      histogram.observe(0.01); // Exactly on second bucket
      histogram.observe(0.5); // On sixth bucket
      histogram.observe(15); // Above all buckets

      const agg = new BaseAggregator();
      histogram.aggregate(agg);

      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(4);

      // First bucket (0.005) should have 1 (cumulative)
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 1, labels: { le: "0.005" } });

      // Second bucket (0.01) should have 2 (cumulative)
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 2, labels: { le: "0.01" } });

      // +Inf bucket should have all 4
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 4, labels: { le: "+Inf" } });
    });
  });

  describe("Default buckets", () => {
    test("Uses default buckets correctly", () => {
      const histogram = new Histogram("test_histogram");
      const agg = new BaseAggregator();
      histogram.aggregate(agg);

      const expectedBuckets = [
        "0.005",
        "0.01",
        "0.025",
        "0.05",
        "0.1",
        "0.25",
        "0.5",
        "1",
        "2.5",
        "5",
        "10",
      ];

      for (const le of expectedBuckets) {
        expect(agg.metrics["test_histogram_bucket"]!.samples)
          .toContainEqual(expect.objectContaining({ labels: { le } }));
      }
    });
  });

  describe("withLinearBuckets", () => {
    test("Creates linear buckets correctly", () => {
      const histogram = new Histogram("test_histogram");
      histogram.withLinearBuckets(0, 10, 5);

      histogram.observe(5);
      histogram.observe(15);
      histogram.observe(25);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);
      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(3);

      const labels = ["0", "10", "20", "30", "40", "+Inf"];
      for (const le of labels) {
        expect(agg.metrics["test_histogram_bucket"]!.samples).toContainEqual(
          expect.objectContaining({ labels: { le } }),
        );
      }
    });

    test("Returns this for method chaining", () => {
      const histogram = new Histogram("test_histogram");
      const result = histogram.withLinearBuckets(0, 10, 5);
      expect(result).toBe(histogram);
    });
  });

  describe("withExponentialBuckets", () => {
    test("Creates exponential buckets correctly", () => {
      const histogram = new Histogram("test_histogram");
      histogram.withExponentialBuckets(1, 2, 4);

      histogram.observe(1.5);
      histogram.observe(3);
      histogram.observe(10);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);

      const labels = ["1", "2", "4", "8", "+Inf"];
      for (const le of labels) {
        expect(agg.metrics[`test_histogram_bucket`]).toBeObject();
        expect(agg.metrics[`test_histogram_bucket`]!.samples).toContainEqual(
          expect.objectContaining({ labels: { le } }),
        );
      }
    });

    test("Returns this for method chaining", () => {
      const histogram = new Histogram("test_histogram");
      const result = histogram.withExponentialBuckets(1, 2, 4);
      expect(result).toBe(histogram);
    });
  });

  describe("linearBuckets static method", () => {
    test("Generates correct linear buckets", () => {
      const buckets = Histogram.linearBuckets(0, 5, 4);
      expect(buckets).toEqual([0, 5, 10, 15]);
    });

    test("Works with negative start", () => {
      const buckets = Histogram.linearBuckets(-10, 5, 3);
      expect(buckets).toEqual([-10, -5, 0]);
    });

    test("Works with single bucket", () => {
      const buckets = Histogram.linearBuckets(10, 5, 1);
      expect(buckets).toEqual([10]);
    });

    test("Throws error if count is less than 1", () => {
      expect(() => {
        Histogram.linearBuckets(0, 5, 0);
      }).toThrow("Count must be at least 1");
    });
  });

  describe("exponentialBuckets static method", () => {
    test("Generates correct exponential buckets", () => {
      const buckets = Histogram.exponentialBuckets(1, 2, 4);
      expect(buckets).toEqual([1, 2, 4, 8]);
    });

    test("Works with factor other than 2", () => {
      const buckets = Histogram.exponentialBuckets(1, 10, 3);
      expect(buckets).toEqual([1, 10, 100]);
    });

    test("Works with single bucket", () => {
      const buckets = Histogram.exponentialBuckets(5, 2, 1);
      expect(buckets).toEqual([5]);
    });

    test("Throws error if count is less than 1", () => {
      expect(() => {
        Histogram.exponentialBuckets(1, 2, 0);
      }).toThrow("Count must be positive");
    });

    test("Throws error if start is not positive", () => {
      expect(() => {
        Histogram.exponentialBuckets(0, 2, 5);
      }).toThrow("Start must be greater than 0");

      expect(() => {
        Histogram.exponentialBuckets(-1, 2, 5);
      }).toThrow("Start must be greater than 0");
    });

    test("Throws error if factor is not greater than 1", () => {
      expect(() => {
        Histogram.exponentialBuckets(1, 1, 5);
      }).toThrow("Factor must be greater than 1");

      expect(() => {
        Histogram.exponentialBuckets(1, 0.5, 5);
      }).toThrow("Factor must be greater than 1");
    });
  });

  describe("Cumulative Counts", () => {
    test("Cumulative counts are correct", () => {
      const histogram = new Histogram("test_histogram");
      histogram.withLinearBuckets(1, 1, 3); // buckets: 1, 2, 3, +Inf

      histogram.observe(0.5); // Below all buckets, goes in le="1"
      histogram.observe(1); // Exactly on first bucket
      histogram.observe(2); // Exactly on second bucket
      histogram.observe(5); // Above all buckets

      const agg = new BaseAggregator();
      histogram.aggregate(agg);

      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 2, labels: { le: "1" } });
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 3, labels: { le: "2" } });
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 3, labels: { le: "3" } });
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 4, labels: { le: "+Inf" } });
    });

    test("Empty histogram has zero counts", () => {
      const histogram = new Histogram("test_histogram");
      const agg = new BaseAggregator();
      histogram.aggregate(agg);
      agg.metrics["test_histogram_bucket"]!.samples.forEach((sample) => {
        expect(sample.value).toBe(0);
      });
    });
  });

  describe("Edge cases", () => {
    test("Handles zero values correctly", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(0);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);
      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(1);
      expect(agg.metrics["test_histogram_sum"]!.samples[0]?.value).toBe(0);
    });

    test("Handles negative values correctly", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(-5);
      histogram.observe(-1);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);
      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(2);
      expect(agg.metrics["test_histogram_sum"]!.samples[0]?.value).toBe(-6);
    });

    test("Handles very large values", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(1000000);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);
      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(1);
      expect(agg.metrics["test_histogram_sum"]!.samples[0]?.value)
        .toBe(1000000);
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 1, labels: { le: "+Inf" } });
    });

    test("Handles values exactly on bucket boundaries", () => {
      const histogram = new Histogram("test_histogram");
      histogram.withLinearBuckets(1, 1, 3); // buckets: 1, 2, 3

      histogram.observe(1);
      histogram.observe(2);
      histogram.observe(3);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);

      // Value 1 should be in bucket le="1"
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 1, labels: { le: "1" } });

      // Value 2 should be in bucket le="2" (cumulative: 2)
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 2, labels: { le: "2" } });

      // Value 3 should be in bucket le="3" (cumulative: 3)
      expect(agg.metrics["test_histogram_bucket"]!.samples)
        .toContainEqual({ value: 3, labels: { le: "3" } });
    });
  });

  describe("Min and Max tracking", () => {
    test("Tracks min and max correctly", () => {
      const histogram = new Histogram("test_histogram");

      histogram.observe(5);
      histogram.observe(1);
      histogram.observe(10);
      histogram.observe(3);
      histogram.observe(-3125);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);

      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(5);

      expect(agg.metrics["test_histogram_min"]!.samples[0]?.value).toBe(-3125);
      expect(agg.metrics["test_histogram_max"]!.samples[0]?.value).toBe(10);
    });

    test("Handles single observation for min and max", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(7);

      const agg = new BaseAggregator();
      histogram.aggregate(agg);

      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(1);

      expect(agg.metrics["test_histogram_min"]!.samples[0]?.value).toBe(7);
      expect(agg.metrics["test_histogram_max"]!.samples[0]?.value).toBe(7);
    });

    test("Handles no observations for min and max", () => {
      const histogram = new Histogram("test_histogram");

      const agg = new BaseAggregator();
      histogram.aggregate(agg);

      expect(agg.metrics["test_histogram_count"]!.samples[0]?.value).toBe(0);
      expect(agg.metrics["test_histogram_min"]!.samples[0]?.value).toBeNaN();
      expect(agg.metrics["test_histogram_max"]!.samples[0]?.value).toBeNaN();
    });
  });
});
