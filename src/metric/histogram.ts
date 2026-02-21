import type { Aggregator } from "../aggregator.type";
import Metric from "./metric";

export default class Histogram extends Metric {
  static defaultBuckets = [.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10];

  private bucketsLe: number[] = Histogram.defaultBuckets;
  private bucketCounts: number[] = new Array(this.bucketsLe.length + 1).fill(0);

  private count = 0;
  private sum = 0;
  private min = NaN;
  private max = NaN;

  override metricType = "histogram" as const;
  constructor(
    name: string,
    labels?: Record<string, string>,
  ) {
    if (labels?.le) {
      throw new Error('Histogram label keys cannot include "le"');
    }

    super(name, labels);
  }

  public withLinearBuckets(
    start: number,
    width: number,
    count: number,
  ): Histogram {
    this.bucketsLe = Histogram.linearBuckets(start, width, count);
    this.bucketCounts = new Array(this.bucketsLe.length + 1).fill(0);
    return this;
  }

  public withExponentialBuckets(
    start: number,
    factor: number,
    count: number,
  ): Histogram {
    this.bucketsLe = Histogram.exponentialBuckets(start, factor, count);
    this.bucketCounts = new Array(this.bucketsLe.length + 1).fill(0);
    return this;
  }

  static linearBuckets(start: number, width: number, count: number): number[] {
    if (count < 1) {
      throw new Error("Count must be at least 1");
    }
    const buckets: number[] = new Array(count);
    for (let i = 0; i < buckets.length; i++) {
      buckets[i] = start;
      start += width;
    }
    return buckets;
  }

  static exponentialBuckets(
    start: number,
    factor: number,
    count: number,
  ): number[] {
    if (count < 1) {
      throw new Error("Count must be positive");
    }
    if (start <= 0) {
      throw new Error("Start must be greater than 0");
    }
    if (factor <= 1) {
      throw new Error("Factor must be greater than 1");
    }
    const buckets: number[] = new Array(count);
    for (let i = 0; i < buckets.length; i++) {
      buckets[i] = start;
      start *= factor;
    }
    return buckets;
  }

  observe(value: number): void {
    const bucketIndex = this.bucketIndex(value);

    this.bucketCounts[bucketIndex]! += 1;
    this.count += 1;
    this.min = Number.isNaN(this.min) ? value : Math.min(this.min, value);
    this.max = Number.isNaN(this.max) ? value : Math.max(this.max, value);
    this.sum += value;
  }

  private bucketIndex(value: number): number {
    for (let i = 0; i < this.bucketsLe.length; i++) {
      if (value <= this.bucketsLe[i]!) {
        return i;
      }
    }

    return this.bucketsLe.length;
  }

  aggregate(agg: Aggregator) {
    let cumulativeCount = 0;
    const buckets = [];
    for (let i = 0; i < this.bucketCounts.length; i++) {
      cumulativeCount += this.bucketCounts[i]!;
      const leLabel = i < this.bucketsLe.length
        ? this.bucketsLe[i]!.toString()
        : "+Inf";

      buckets.push({ le: leLabel, count: cumulativeCount });
    }

    agg.observe({
      name: this.name,
      labels: this.labels,
      buckets,
      count: this.count,
      sum: this.sum,
      min: this.min,
      max: this.max,
      type: "histogram",
    });
  }
}
