import { describe, expect, test } from "bun:test";
import Histogram from "./histogram";

describe("Histogram", () => {
  describe("Constructor", () => {
    test("Creates histogram with default buckets", () => {
      const histogram = new Histogram("test_histogram");
      expect(histogram.collect()).toContain("test_histogram_bucket");
      expect(histogram.collect()).toContain("test_histogram_count");
      expect(histogram.collect()).toContain("test_histogram_sum");
    });

    test("Creates histogram with labels", () => {
      const histogram = new Histogram("test_histogram", {
        method: "GET",
        path: "/api",
      });
      expect(histogram.collect()).toContain('method="GET"');
      expect(histogram.collect()).toContain('path="/api"');
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

      const output = histogram.collect();
      expect(output).toContain("test_histogram_count 1");
      expect(output).toContain("test_histogram_sum 0.5");
    });

    test("Records multiple observations", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(0.5);
      histogram.observe(1.5);
      histogram.observe(2.5);

      const output = histogram.collect();
      expect(output).toContain("test_histogram_count 3");
      expect(output).toContain("test_histogram_sum 4.5");
    });

    test("Places observations in correct buckets", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(0.003); // Below first bucket (0.005)
      histogram.observe(0.01); // Exactly on second bucket
      histogram.observe(0.5); // On sixth bucket
      histogram.observe(15); // Above all buckets

      const output = histogram.collect();
      const lines = output.split("\n").filter(Boolean);

      expect(lines[0]).toBe("# TYPE test_histogram histogram"); // Ensure there are enough lines
      // First bucket (0.005) should have 1 (cumulative)
      expect(lines[1]).toBe('test_histogram_bucket{le="0.005"} 1');

      // Second bucket (0.01) should have 2 (cumulative)
      expect(lines[2]).toBe('test_histogram_bucket{le="0.01"} 2');

      // +Inf bucket should have all 4
      expect(lines[lines.length - 5]).toBe(
        'test_histogram_bucket{le="+Inf"} 4',
      );
    });
  });

  describe("Default buckets", () => {
    test("Uses default buckets correctly", () => {
      const histogram = new Histogram("test_histogram");
      const output = histogram.collect();

      // Check that default buckets are present
      expect(output).toContain('le="0.005"');
      expect(output).toContain('le="0.01"');
      expect(output).toContain('le="0.025"');
      expect(output).toContain('le="0.05"');
      expect(output).toContain('le="0.1"');
      expect(output).toContain('le="0.25"');
      expect(output).toContain('le="0.5"');
      expect(output).toContain('le="1"');
      expect(output).toContain('le="2.5"');
      expect(output).toContain('le="5"');
      expect(output).toContain('le="10"');
      expect(output).toContain('le="+Inf"');
    });
  });

  describe("withLinearBuckets", () => {
    test("Creates linear buckets correctly", () => {
      const histogram = new Histogram("test_histogram");
      histogram.withLinearBuckets(0, 10, 5);

      histogram.observe(5);
      histogram.observe(15);
      histogram.observe(25);

      const output = histogram.collect();
      expect(output).toContain('le="0"');
      expect(output).toContain('le="10"');
      expect(output).toContain('le="20"');
      expect(output).toContain('le="30"');
      expect(output).toContain('le="40"');
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

      const output = histogram.collect();
      expect(output).toContain('le="1"');
      expect(output).toContain('le="2"');
      expect(output).toContain('le="4"');
      expect(output).toContain('le="8"');
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

  describe("collect", () => {
    test("Formats output correctly without labels", () => {
      const histogram = new Histogram("http_request_duration");
      histogram.observe(0.1);
      histogram.observe(0.5);

      const output = histogram.collect();
      const lines = output.split("\n").filter(Boolean);

      // Should have bucket lines + count + sum
      expect(lines.length).toBe(17); // 12 buckets + count + sum + min + max + header
      expect(lines[lines.length - 4]).toBe("http_request_duration_count 2");
      expect(lines[lines.length - 3]).toBe("http_request_duration_sum 0.6");
    });

    test("Formats output correctly with labels", () => {
      const histogram = new Histogram("http_request_duration", {
        method: "GET",
        endpoint: "/api/users",
      });
      histogram.observe(0.1);

      const output = histogram.collect();

      // Bucket lines should have both le and custom labels
      expect(output).toContain(
        'http_request_duration_bucket{method="GET", endpoint="/api/users", le="0.1"} 1',
      );

      // Count and sum should not have le label
      expect(output).toContain(
        'http_request_duration_count{method="GET", endpoint="/api/users"} 1',
      );
      expect(output).toContain(
        'http_request_duration_sum{method="GET", endpoint="/api/users"} 0.1',
      );
    });

    test("Cumulative counts are correct", () => {
      const histogram = new Histogram("test_histogram");
      histogram.withLinearBuckets(1, 1, 3); // buckets: 1, 2, 3, +Inf

      histogram.observe(0.5); // Below all buckets, goes in le="1"
      histogram.observe(1); // Exactly on first bucket
      histogram.observe(2); // Exactly on second bucket
      histogram.observe(5); // Above all buckets

      const output = histogram.collect();
      const lines = output.split("\n");
      expect(lines[0]).toBe("# TYPE test_histogram histogram");

      // Bucket 1: should have 2 (0.5 and 1)
      expect(lines[1]).toBe('test_histogram_bucket{le="1"} 2');

      // Bucket 2: should have 3 (cumulative: 0.5, 1, and 2)
      expect(lines[2]).toBe('test_histogram_bucket{le="2"} 3');

      // Bucket 3: should have 3 (cumulative: 0.5, 1, 2)
      expect(lines[3]).toBe('test_histogram_bucket{le="3"} 3');

      // +Inf: should have all 4
      expect(lines[4]).toBe('test_histogram_bucket{le="+Inf"} 4');
    });

    test("Empty histogram has zero counts", () => {
      const histogram = new Histogram("test_histogram");
      const output = histogram.collect();

      expect(output).toContain("test_histogram_count 0");
      expect(output).toContain("test_histogram_sum 0");

      // All buckets should be 0
      const lines = output.split("\n").filter(Boolean);
      for (let i = 0; i < lines.length - 4; i++) {
        expect(lines[i + 1]).toContain(" 0");
      }
    });
  });

  describe("Edge cases", () => {
    test("Handles zero values correctly", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(0);

      const output = histogram.collect();
      expect(output).toContain("test_histogram_count 1");
      expect(output).toContain("test_histogram_sum 0");
    });

    test("Handles negative values correctly", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(-5);
      histogram.observe(-1);

      const output = histogram.collect();
      expect(output).toContain("test_histogram_count 2");
      expect(output).toContain("test_histogram_sum -6");
    });

    test("Handles very large values", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(1000000);

      const output = histogram.collect();
      expect(output).toContain("test_histogram_count 1");
      expect(output).toContain("test_histogram_sum 1000000");
      expect(output).toContain('test_histogram_bucket{le="+Inf"} 1');
    });

    test("Handles values exactly on bucket boundaries", () => {
      const histogram = new Histogram("test_histogram");
      histogram.withLinearBuckets(1, 1, 3); // buckets: 1, 2, 3

      histogram.observe(1);
      histogram.observe(2);
      histogram.observe(3);

      const output = histogram.collect();
      const lines = output.split("\n");

      // Header should be valid
      expect(lines[0]).toBe("# TYPE test_histogram histogram");

      // Value 1 should be in bucket le="1"
      expect(lines[1]).toBe('test_histogram_bucket{le="1"} 1');

      // Value 2 should be in bucket le="2" (cumulative: 2)
      expect(lines[2]).toBe('test_histogram_bucket{le="2"} 2');

      // Value 3 should be in bucket le="3" (cumulative: 3)
      expect(lines[3]).toBe('test_histogram_bucket{le="3"} 3');
    });
  });

  describe("Min and Max tracking", () => {
    test("Tracks min and max correctly", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(5);
      histogram.observe(1);
      histogram.observe(10);
      histogram.observe(3);

      const output = histogram.collect();
      const lines = output.split("\n").filter(Boolean);

      expect(lines[lines.length - 2]).toBe("test_histogram_min 1");
      expect(lines[lines.length - 1]).toBe("test_histogram_max 10");
    });

    test("Handles single observation for min and max", () => {
      const histogram = new Histogram("test_histogram");
      histogram.observe(7);

      const output = histogram.collect();
      const lines = output.split("\n").filter(Boolean);

      expect(lines[lines.length - 2]).toBe("test_histogram_min 7");
      expect(lines[lines.length - 1]).toBe("test_histogram_max 7");
    });

    test("Handles no observations for min and max", () => {
      const histogram = new Histogram("test_histogram");

      const output = histogram.collect();
      const lines = output.split("\n").filter(Boolean);

      expect(lines[lines.length - 2]).toBe("test_histogram_min NaN");
      expect(lines[lines.length - 1]).toBe("test_histogram_max NaN");
    });
  });
});
