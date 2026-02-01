import {
  defaultFormatter,
  type MetricFormatter,
  type TimeseriesFormatter,
} from "../format";
import Metric, { type MetricType } from "./metric";

export default class Histogram extends Metric {
  static defaultBuckets = [.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10];

  private bucketsLe: number[] = Histogram.defaultBuckets;
  private bucketCounts: number[] = new Array(this.bucketsLe.length + 1).fill(0);

  private count = 0;
  private sum = 0;

  override metricType = "histogram" as const;
  constructor(
    name: string,
    labels?: Record<string, string>,
    description?: string,
  ) {
    if (labels?.le) {
      throw new Error('Histogram label keys cannot include "le"');
    }

    super(name, labels, description);
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

  collect(formatter: MetricFormatter = defaultFormatter): string {
    const bucket_name = `${this.name}_bucket`;
    const count_name = `${this.name}_count`;
    const sum_name = `${this.name}_sum`;

    const lines = [];
    lines.push(
      formatter.metadata(this.name, this.metricType, this.description),
    );

    let cumulativeCount = 0;

    for (let i = 0; i < this.bucketCounts.length; i++) {
      cumulativeCount += this.bucketCounts[i]!;

      const leLabel = i < this.bucketsLe.length
        ? this.bucketsLe[i]!.toString()
        : "+Inf";

      const labels = { ...this.labels, le: leLabel };

      lines.push(formatter.timeseries(bucket_name, cumulativeCount, labels));
    }

    lines.push(formatter.timeseries(count_name, this.count, this.labels));
    lines.push(formatter.timeseries(sum_name, this.sum, this.labels));

    return lines.join("");
  }
}
